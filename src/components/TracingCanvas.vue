<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { layoutText } from '../composables/useGlyphLayout'
import { getGlyph, GLYPH_METRICS } from '../data/glyphs'
import { drawGlyphLayout, drawGuideLines, guidePalette } from '../render/drawGlyphs'
import { LAYOUT } from '../data/metrics'
import { useTheme } from '../composables/useTheme'
import { getInk, inkStroke } from '../data/inks'
import { useTracing } from '../composables/useTracing'

const props = defineProps<{ text: string; inkId: string }>()
const { theme } = useTheme()

const stageRef = ref<HTMLDivElement | null>(null)
const guideRef = ref<HTMLCanvasElement | null>(null)
const inkRef = ref<HTMLCanvasElement | null>(null)

const layout = computed(() => layoutText(props.text || ' ', getGlyph, GLYPH_METRICS))
const aspectRatio = computed(() => layout.value.width / layout.value.height)
const inkColor = computed(() => inkStroke(getInk(props.inkId), theme.value))

const tracing = useTracing(inkRef, () => inkColor.value)

let ro: ResizeObserver | null = null

/** 下敷き（罫線＋薄いお手本）を描く */
function redrawGuide() {
  const canvas = guideRef.value
  const stage = stageRef.value
  if (!canvas || !stage) return
  const w = stage.clientWidth
  const h = w / aspectRatio.value
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const lay = layout.value
  ctx.scale(w / lay.width, w / lay.width)
  drawGuideLines(ctx, lay, guidePalette(theme.value))
  const ghost =
    theme.value === 'dark' ? 'rgba(230,235,245,0.20)' : 'rgba(30,40,60,0.18)'
  drawGlyphLayout(ctx, lay, {
    ink: ghost,
    lineWidth: LAYOUT.strokeWidthEm * GLYPH_METRICS.unitsPerEm,
  })
}

/** 全体のサイズを確定（stage 高さ・両 Canvas の実解像度） */
function resize() {
  const stage = stageRef.value
  const ink = inkRef.value
  if (!stage || !ink) return
  const w = stage.clientWidth
  const h = w / aspectRatio.value
  stage.style.height = `${h}px`
  const dpr = window.devicePixelRatio || 1
  ink.width = Math.round(w * dpr)
  ink.height = Math.round(h * dpr)
  tracing.configure(w, h, dpr)
  redrawGuide()
}

onMounted(() => {
  ro = new ResizeObserver(() => resize())
  if (stageRef.value) ro.observe(stageRef.value)
  resize()
})
onBeforeUnmount(() => ro?.disconnect())

// お手本テキストが変わったら、書いた線を消してレイアウトし直す
watch(
  () => props.text,
  () => {
    tracing.clear()
    resize()
  },
)
// テーマ変化: 下敷き＆インク色を再描画
watch(theme, () => {
  redrawGuide()
  tracing.redraw()
})
// インク色変化: 描いた線の色を更新
watch(inkColor, () => tracing.redraw())
</script>

<template>
  <div class="trace">
    <div ref="stageRef" class="trace__stage">
      <canvas ref="guideRef" class="trace__layer" />
      <canvas
        ref="inkRef"
        class="trace__layer trace__ink"
        @pointerdown="tracing.onDown"
        @pointermove="tracing.onMove"
        @pointerup="tracing.onUp"
        @pointercancel="tracing.onUp"
      />
    </div>
    <div class="trace__controls">
      <button class="trace__btn" type="button" @click="tracing.undo">
        ↶ やり直し
      </button>
      <button class="trace__btn" type="button" @click="tracing.clear">
        🗑 消去
      </button>
      <span class="trace__hint">お手本の上を指・ペン・マウスでなぞってね</span>
    </div>
  </div>
</template>

<style scoped>
.trace {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.trace__stage {
  position: relative;
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.trace__layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.trace__ink {
  /* タッチのスクロール/ズームを抑止しないと描けない */
  touch-action: none;
  cursor: crosshair;
}
.trace__controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}
.trace__btn {
  min-height: var(--tap);
  padding: 0 var(--space-4);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  background: var(--surface-2);
  border: 1px solid var(--border);
  transition: background 0.15s, transform 0.1s;
}
.trace__btn:hover {
  background: var(--surface-hover);
}
.trace__btn:active {
  transform: scale(0.97);
}
.trace__hint {
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>
