// グリフデータ生成スクリプト
// データソース: Hershey Script 1-stroke（単線筆記体・パブリックドメイン相当）
//   scripts/font/HersheyScript1.svg（SVG フォント形式・M/L 主体のパス）
// 出力: src/data/glyphs.generated.ts
//
// SVG フォントは各グリフを「単線（1本のペン軌跡）」の M/L パスで表現している。
// M=新ストローク開始, L=点追加, C/Q は念のためベジェ分割してサンプリング。
// 座標系はフォント座標系（Y 上向き・baseline=0）のまま保存する（描画側で反転）。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const FONT_PATH = path.join(__dirname, 'font', 'HersheyScript1.svg')
const OUT_PATH = path.join(ROOT, 'src', 'data', 'glyphs.generated.ts')

const BEZIER_STEPS = 16 // 曲線1本あたりの分割数

// 対象文字: a-z, A-Z, 0-9, space
const TARGET_CHARS = []
for (let c = 0x61; c <= 0x7a; c++) TARGET_CHARS.push(String.fromCharCode(c)) // a-z
for (let c = 0x41; c <= 0x5a; c++) TARGET_CHARS.push(String.fromCharCode(c)) // A-Z
for (let c = 0x30; c <= 0x39; c++) TARGET_CHARS.push(String.fromCharCode(c)) // 0-9
TARGET_CHARS.push(' ')

// --- SVG フォントを読み込み、グリフ情報とフォントメトリクスを取得 ---
function loadSvgFont(fontPath) {
  const svg = fs.readFileSync(fontPath, 'utf8')

  // font-face のメトリクス
  const faceMatch = svg.match(/<font-face\b([\s\S]*?)\/>/)
  const face = faceMatch ? faceMatch[1] : ''
  const attr = (block, name, def) => {
    const m = block.match(new RegExp(name + '="([^"]*)"'))
    return m ? Number(m[1]) : def
  }
  const unitsPerEm = attr(face, 'units-per-em', 1000)
  const ascent = attr(face, 'ascent', 800)
  const descent = attr(face, 'descent', -200)
  const capHeight = attr(face, 'cap-height', 0)
  const xHeight = attr(face, 'x-height', 0)

  const fontMatch = svg.match(/<font\b([^>]*)>/)
  const defaultAdv = fontMatch ? attr(fontMatch[1], 'horiz-adv-x', unitsPerEm) : unitsPerEm

  // 各 <glyph .../> をパース。unicode 属性は数値実体参照(&#x22; 等)も解決する。
  const glyphs = {}
  const glyphRe = /<glyph\b([^>]*)\/>/g
  let m
  while ((m = glyphRe.exec(svg))) {
    const attrs = m[1]
    const um = attrs.match(/unicode="(.*?)"/)
    if (!um) continue
    const uni = decodeEntities(um[1])
    const dm = attrs.match(/\bd="([^"]*)"/)
    const advM = attrs.match(/horiz-adv-x="([^"]*)"/)
    glyphs[uni] = {
      d: dm ? dm[1] : '',
      advance: advM ? Number(advM[1]) : defaultAdv,
    }
  }

  return { glyphs, metrics: { unitsPerEm, ascent, descent, capHeight, xHeight }, defaultAdv }
}

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

// --- SVG パスデータ(d)を strokes(Point[][]) に変換 ---
// M=絶対移動(新ストローク), L=絶対直線, C=絶対3次ベジェ, Q=絶対2次ベジェ, Z=閉じる
// Hershey フォントは絶対座標・M/L 主体。念のため相対コマンドと C/Q も対応。
function pathToStrokes(d) {
  if (!d || !d.trim()) return []
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g)
  if (!tokens) return []

  const strokes = []
  let cur = null // 現在のストローク Point[]
  let px = 0, py = 0 // 現在位置
  let startX = 0, startY = 0 // サブパス開始点
  let cmd = null
  let i = 0

  const num = () => Number(tokens[i++])
  const pushPoint = (x, y) => {
    if (!cur) { cur = []; strokes.push(cur) }
    const last = cur[cur.length - 1]
    // 同一点の連続は無視
    if (!last || last.x !== x || last.y !== y) cur.push({ x, y })
  }
  const startStroke = (x, y) => {
    cur = [{ x, y }]
    strokes.push(cur)
    px = x; py = y; startX = x; startY = y
  }

  while (i < tokens.length) {
    const t = tokens[i]
    if (/[a-zA-Z]/.test(t)) { cmd = t; i++ } else if (cmd == null) { break }

    switch (cmd) {
      case 'M': { const x = num(), y = num(); startStroke(x, y); cmd = 'L'; break }
      case 'm': { const x = px + num(), y = py + num(); startStroke(x, y); cmd = 'l'; break }
      case 'L': { const x = num(), y = num(); pushPoint(x, y); px = x; py = y; break }
      case 'l': { const x = px + num(), y = py + num(); pushPoint(x, y); px = x; py = y; break }
      case 'H': { const x = num(); pushPoint(x, py); px = x; break }
      case 'h': { const x = px + num(); pushPoint(x, py); px = x; break }
      case 'V': { const y = num(); pushPoint(px, y); py = y; break }
      case 'v': { const y = py + num(); pushPoint(px, y); py = y; break }
      case 'C': case 'c': {
        const rel = cmd === 'c'
        const x1 = num() + (rel ? px : 0), y1 = num() + (rel ? py : 0)
        const x2 = num() + (rel ? px : 0), y2 = num() + (rel ? py : 0)
        const x = num() + (rel ? px : 0), y = num() + (rel ? py : 0)
        sampleCubic(px, py, x1, y1, x2, y2, x, y, pushPoint)
        px = x; py = y; break
      }
      case 'Q': case 'q': {
        const rel = cmd === 'q'
        const x1 = num() + (rel ? px : 0), y1 = num() + (rel ? py : 0)
        const x = num() + (rel ? px : 0), y = num() + (rel ? py : 0)
        sampleQuad(px, py, x1, y1, x, y, pushPoint)
        px = x; py = y; break
      }
      case 'Z': case 'z': {
        // 単線 open path では終点→始点の戻りは不要。閉じる場合のみ始点を追加。
        pushPoint(startX, startY); px = startX; py = startY; break
      }
      default: { i++; break }
    }
  }

  // 2点未満のストロークは除去
  return strokes.filter((s) => s.length >= 2)
}

function sampleCubic(x0, y0, x1, y1, x2, y2, x3, y3, push) {
  for (let s = 1; s <= BEZIER_STEPS; s++) {
    const t = s / BEZIER_STEPS
    const mt = 1 - t
    const a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t
    push(a * x0 + b * x1 + c * x2 + d * x3, a * y0 + b * y1 + c * y2 + d * y3)
  }
}

function sampleQuad(x0, y0, x1, y1, x2, y2, push) {
  for (let s = 1; s <= BEZIER_STEPS; s++) {
    const t = s / BEZIER_STEPS
    const mt = 1 - t
    const a = mt * mt, b = 2 * mt * t, c = t * t
    push(a * x0 + b * x1 + c * x2, a * y0 + b * y1 + c * y2)
  }
}

// 座標を丸める（小数第2位まで）
const r = (n) => Math.round(n * 100) / 100

// --- メイン ---
function main() {
  console.log('フォント読み込み:', FONT_PATH)
  const { glyphs, metrics, defaultAdv } = loadSvgFont(FONT_PATH)

  // GlyphMetrics 構築
  // baseline=0, ascender>0, descender<0。x-height/cap-height はフォント値、無ければ推定。
  const GLYPH_METRICS = {
    unitsPerEm: metrics.unitsPerEm,
    ascender: metrics.ascent,
    capHeight: metrics.capHeight > 0 ? metrics.capHeight : Math.round(metrics.ascent * 0.7),
    xHeight: metrics.xHeight > 0 ? metrics.xHeight : Math.round(metrics.ascent * 0.5),
    baseline: 0,
    descender: metrics.descent < 0 ? metrics.descent : -Math.abs(metrics.descent),
  }

  const GLYPHS = {}
  const summary = []
  const problems = []

  for (const ch of TARGET_CHARS) {
    const g = glyphs[ch]
    if (ch === ' ') {
      const adv = g ? g.advance : defaultAdv
      GLYPHS[ch] = { strokes: [], advance: adv }
      summary.push({ ch: 'space', strokes: 0, advance: adv })
      continue
    }
    if (!g) {
      problems.push(`グリフが見つかりません: '${ch}'`)
      GLYPHS[ch] = { strokes: [], advance: defaultAdv }
      continue
    }
    const raw = pathToStrokes(g.d)
    const strokes = raw.map((s) => s.map((p) => ({ x: r(p.x), y: r(p.y) })))
    GLYPHS[ch] = { strokes, advance: g.advance }
    summary.push({ ch, strokes: strokes.length, advance: g.advance })

    // 検査: スペース以外は strokes>=1, 各 stroke>=2点
    if (strokes.length < 1) problems.push(`ストローク無し: '${ch}'`)
    for (let k = 0; k < strokes.length; k++) {
      if (strokes[k].length < 2) problems.push(`2点未満のストローク: '${ch}' stroke[${k}]`)
    }
  }

  // メトリクス検査
  if (!(GLYPH_METRICS.ascender > 0)) problems.push('ascender が正でない')
  if (!(GLYPH_METRICS.descender < 0)) problems.push('descender が負でない')
  if (!(GLYPH_METRICS.xHeight > 0)) problems.push('xHeight が正でない')

  // --- TS 出力 ---
  const header =
    `// AUTO-GENERATED by scripts/gen-glyphs.mjs — 手で編集しないでください。\n` +
    `// データソース: Hershey Script 1-stroke（単線筆記体・パブリックドメイン相当）\n` +
    `// ライセンス: scripts/font/HersheyFonts-LICENSE.txt を参照。\n` +
    `import type { GlyphMetrics } from '../types/glyph'\n\n`

  const metricsStr =
    `export const GLYPH_METRICS: GlyphMetrics = ${JSON.stringify(GLYPH_METRICS, null, 2)}\n\n`

  // GLYPHS を1文字1行でコンパクトに出力
  let glyphsStr =
    `export const GLYPHS: Record<string, { strokes: { x: number; y: number }[][]; advance: number }> = {\n`
  for (const ch of TARGET_CHARS) {
    const g = GLYPHS[ch]
    const key = JSON.stringify(ch)
    const strokesJson = JSON.stringify(g.strokes)
    glyphsStr += `  ${key}: { strokes: ${strokesJson}, advance: ${g.advance} },\n`
  }
  glyphsStr += `}\n`

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, header + metricsStr + glyphsStr)

  // --- ログ ---
  console.log('\n=== GLYPH_METRICS ===')
  console.log(JSON.stringify(GLYPH_METRICS))

  console.log('\n=== 各文字のストローク数 ===')
  const line = (arr) => arr.map((s) => `${s.ch}:${s.strokes}`).join('  ')
  console.log('小文字:', line(summary.filter((s) => /^[a-z]$/.test(s.ch))))
  console.log('大文字:', line(summary.filter((s) => /^[A-Z]$/.test(s.ch))))
  console.log('数字  :', line(summary.filter((s) => /^[0-9]$/.test(s.ch))))
  console.log('スペース: advance=' + GLYPHS[' '].advance)

  console.log('\n=== サンプル座標 ===')
  for (const ch of ['a', 'g', 'A', '5']) {
    const g = GLYPHS[ch]
    const first = g.strokes[0] || []
    console.log(`'${ch}': strokes=${g.strokes.length}, advance=${g.advance}, ` +
      `stroke0(${first.length}pt) 先頭3点=` +
      JSON.stringify(first.slice(0, 3)))
  }

  console.log('\n=== 検査結果 ===')
  console.log(`対象文字数: ${TARGET_CHARS.length}, 生成グリフ数: ${Object.keys(GLYPHS).length}`)
  if (problems.length === 0) {
    console.log('OK: すべての検査に合格しました。')
  } else {
    console.log('NG: 以下の問題があります:')
    for (const p of problems) console.log('  - ' + p)
    process.exitCode = 1
  }
  console.log('\n出力:', OUT_PATH)
}

main()
