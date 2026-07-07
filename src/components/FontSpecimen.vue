<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  DEFAULT_FONT_ID,
  FONT_CATEGORIES,
  FONTS,
  getFont,
  type FontCategory,
} from '../data/fonts'
import { DEFAULT_INK_ID, getInk, inkStroke } from '../data/inks'
import { guidePalette } from '../render/drawGlyphs'
import { useTheme } from '../composables/useTheme'
import InkPicker from './InkPicker.vue'

// お手本メーカーは練習機能から独立した自己完結のシンプル画面
const text = ref('Hello, world!')
const fontId = ref(DEFAULT_FONT_ID)
const size = ref(72)
const inkId = ref(DEFAULT_INK_ID)
const copied = ref(false)
// Adobe Fonts (Typekit) を有効に読み込めたか
const adobeReady = ref(false)

// フォントはカテゴリで絞り込み、選択中フォントのカテゴリを初期表示にする
const selectedCategory = ref<FontCategory>(getFont(DEFAULT_FONT_ID).category)
// Adobe 提供フォントは、実際にロードできたときだけ一覧に出す
const visibleFonts = computed(() =>
  FONTS.filter(
    (font) =>
      font.category === selectedCategory.value &&
      (font.provider !== 'adobe' || adobeReady.value),
  ),
)

const { theme } = useTheme()

const paperRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const currentFamily = computed(() => getFont(fontId.value).family)

let ro: ResizeObserver | null = null

/**
 * Web フォントのメトリクス（measureText）に基づき、
 * 各行に 4 本罫線（アセンダ / ミッドライン / ベースライン / ディセンダ）を引いて
 * お手本テキストを描画する。
 */
function render() {
  const canvas = canvasRef.value
  const paper = paperRef.value
  if (!canvas || !paper) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const cw = Math.max(1, paper.clientWidth)
  const dpr = window.devicePixelRatio || 1
  const family = currentFamily.value
  const baseSize = size.value
  const lines = (text.value || ' ').split('\n')

  // フォントメトリクスを baseSize で測定
  ctx.font = `${baseSize}px ${family}`
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  const hg = ctx.measureText('Hg')
  const ascent = hg.fontBoundingBoxAscent || baseSize * 0.8
  const descent = hg.fontBoundingBoxDescent || baseSize * 0.25
  const xh = ctx.measureText('x').actualBoundingBoxAscent || baseSize * 0.5

  // 横幅に収まらない場合は全体を縮小してフィット
  const pad = baseSize * 0.5
  const availW = cw - pad * 2
  let maxW = 0
  for (const ln of lines) maxW = Math.max(maxW, ctx.measureText(ln || ' ').width)
  const scale = maxW > availW && maxW > 0 ? availW / maxW : 1

  const asc = ascent * scale
  const desc = descent * scale
  const xhs = xh * scale
  const lineGap = baseSize * 0.55 * scale
  const lineHeight = asc + desc + lineGap
  const height = pad * 2 + lines.length * lineHeight

  canvas.width = Math.round(cw * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${cw}px`
  canvas.style.height = `${height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cw, height)

  ctx.font = `${baseSize * scale}px ${family}`
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  const pal = guidePalette(theme.value)
  const inkColor = inkStroke(getInk(inkId.value), theme.value)

  const drawLine = (y: number, color: string, w: number, dash: number[]) => {
    ctx.strokeStyle = color
    ctx.lineWidth = w
    ctx.setLineDash(dash)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(cw, y)
    ctx.stroke()
    ctx.setLineDash([])
  }

  lines.forEach((ln, i) => {
    const baseY = pad + asc + i * lineHeight
    drawLine(baseY - asc, pal.ascender, 1, []) // アセンダ
    drawLine(baseY - xhs, pal.midline, 1, [6, 5]) // ミッドライン（x-height）
    drawLine(baseY, pal.baseline, 1.6, []) // ベースライン
    drawLine(baseY + desc, pal.descender, 1, []) // ディセンダ
    ctx.fillStyle = inkColor
    ctx.fillText(ln, pad, baseY)
  })
}

/** フォント読み込み完了を待ってから描画（未ロードだと fallback で測定されるため） */
async function reloadFontAndRender() {
  try {
    // family 文字列の先頭（実 font-family 名）でロード判定。Google/Adobe 双方に対応
    const primary = getFont(fontId.value).family.split(',')[0].trim()
    await document.fonts.load(`${size.value}px ${primary}`)
  } catch {
    /* 失敗しても fallback で描画 */
  }
  render()
}

/** Adobe Fonts (Typekit) が有効に読み込めるか判定（無効なら一覧から隠す） */
async function detectAdobeFonts() {
  try {
    await document.fonts.ready
    const faces = await document.fonts.load('16px "learning-curve"')
    adobeReady.value = faces.length > 0
  } catch {
    adobeReady.value = false
  }
}

/** URL ハッシュから状態を復元（共有 URL を開いたとき） */
function readHash() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''))
  if (params.get('view') !== 'maker') return
  const t = params.get('t')
  if (t !== null) text.value = t
  const fid = params.get('f')
  if (fid) {
    const font = getFont(fid)
    fontId.value = font.id
    selectedCategory.value = font.category
  }
  const s = params.get('s')
  if (s) size.value = Math.min(140, Math.max(32, Number(s) || size.value))
  const ink = params.get('ink')
  if (ink) inkId.value = getInk(ink).id
}

/** 現在の状態を URL ハッシュに書き出す（履歴を汚さない replaceState） */
function writeHash() {
  const params = new URLSearchParams()
  params.set('view', 'maker')
  params.set('t', text.value)
  params.set('f', fontId.value)
  params.set('s', String(size.value))
  params.set('ink', inkId.value)
  history.replaceState(null, '', `#${params.toString()}`)
}

/** 共有 URL をクリップボードにコピー */
async function copyUrl() {
  writeHash()
  try {
    await navigator.clipboard.writeText(location.href)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* クリップボード非対応環境では無視 */
  }
}

onMounted(() => {
  readHash() // 共有 URL から状態を復元
  detectAdobeFonts() // Adobe Fonts が有効なら Learning Curve を一覧に出す
  ro = new ResizeObserver(() => render())
  if (paperRef.value) ro.observe(paperRef.value)
  document.fonts.ready.then(render)
  reloadFontAndRender()
})
onBeforeUnmount(() => ro?.disconnect())

// フォント・サイズはロードし直してから、テキスト・テーマ・インクはそのまま再描画
watch([fontId, size], reloadFontAndRender)
watch([() => text.value, theme, inkId], render)
// 状態が変わったら共有 URL（ハッシュ）を更新
watch([() => text.value, fontId, size, inkId], writeHash)
</script>

<template>
  <div class="viewer">
    <section class="viewer__panel card">
      <label class="viewer__label" for="viewer-text">
        単語や文を入力（改行で複数行）
      </label>
      <textarea
        id="viewer-text"
        v-model="text"
        class="viewer__input"
        rows="3"
        spellcheck="false"
        autocapitalize="off"
        placeholder="例) Hello&#10;Thank you"
      />

      <div class="viewer__field">
        <span class="viewer__label">フォント</span>
        <div class="viewer__cats" role="tablist" aria-label="フォントの種類">
          <button
            v-for="c in FONT_CATEGORIES"
            :key="c.id"
            type="button"
            class="viewer__cat"
            :class="{ 'is-active': c.id === selectedCategory }"
            role="tab"
            :aria-selected="c.id === selectedCategory"
            @click="selectedCategory = c.id"
          >
            {{ c.label }}
          </button>
        </div>
        <div class="viewer__fonts">
          <button
            v-for="f in visibleFonts"
            :key="f.id"
            type="button"
            class="viewer__font"
            :class="{ 'is-active': f.id === fontId }"
            :style="{ fontFamily: f.family }"
            :aria-pressed="f.id === fontId"
            @click="fontId = f.id"
          >
            {{ f.name }}
          </button>
        </div>
      </div>

      <label class="viewer__field viewer__field--inline">
        <span class="viewer__label">大きさ</span>
        <input
          v-model.number="size"
          class="viewer__size"
          type="range"
          min="32"
          max="140"
          step="1"
        />
        <span class="viewer__size-val">{{ size }}px</span>
      </label>

      <InkPicker v-model="inkId" />

      <button type="button" class="viewer__share" @click="copyUrl">
        {{ copied ? '✓ コピーしました' : '🔗 共有URLをコピー' }}
      </button>
    </section>

    <section ref="paperRef" class="viewer__paper" aria-label="お手本表示">
      <canvas ref="canvasRef" class="viewer__canvas" />
    </section>
  </div>
</template>

<style scoped>
.viewer {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.viewer__panel {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.viewer__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}
.viewer__input {
  width: 100%;
  resize: vertical;
  min-height: 84px;
  padding: var(--space-3);
  font-size: 1.05rem;
  line-height: 1.5;
  color: var(--text);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.viewer__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-weak);
}
.viewer__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.viewer__field--inline {
  flex-direction: row;
  align-items: center;
  gap: var(--space-3);
}
.viewer__cats {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.viewer__cat {
  min-height: 34px;
  padding: var(--space-1) var(--space-4);
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.viewer__cat:hover {
  color: var(--text);
}
.viewer__cat.is-active {
  color: var(--accent-contrast);
  background: var(--accent);
  border-color: var(--accent);
}
.viewer__fonts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.viewer__font {
  min-height: var(--tap);
  padding: var(--space-1) var(--space-4);
  font-size: 1.4rem;
  line-height: 1.1;
  color: var(--text);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.viewer__font:hover {
  border-color: var(--accent);
}
.viewer__font.is-active {
  border-color: var(--accent);
  background: var(--accent-weak);
  box-shadow: 0 0 0 1px var(--accent);
}
.viewer__size {
  flex: 1;
  max-width: 240px;
  height: var(--tap);
  accent-color: var(--accent);
}
.viewer__size-val {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--text);
  min-width: 3.5em;
}
.viewer__share {
  align-self: flex-start;
  min-height: var(--tap);
  padding: 0 var(--space-5);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--accent-contrast);
  background: var(--accent);
  border: 1px solid var(--accent);
  transition: background 0.15s, transform 0.1s;
}
.viewer__share:hover {
  background: var(--accent-hover);
}
.viewer__share:active {
  transform: scale(0.97);
}
.viewer__paper {
  min-height: 200px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: auto;
}
.viewer__canvas {
  display: block;
  width: 100%;
}
</style>
