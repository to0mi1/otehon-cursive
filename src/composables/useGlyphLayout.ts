import { computed, type Ref } from 'vue'
import type { Glyph, GlyphMetrics } from '../types/glyph'
import { LAYOUT } from '../data/metrics'

/** 配置済みの 1 グリフ（行内 x はフォント単位） */
export interface PlacedGlyph {
  glyph: Glyph
  x: number
}

/** 1 行分のレイアウト */
export interface LayoutLine {
  items: PlacedGlyph[]
  /** この行のベースラインの y（レイアウト上端からの Y 下向き・フォント単位） */
  baselineY: number
  /** この行の幅（フォント単位） */
  width: number
}

/** テキスト全体のレイアウト結果（座標はすべてフォント単位） */
export interface GlyphLayout {
  lines: LayoutLine[]
  width: number
  height: number
  metrics: GlyphMetrics
}

export type GlyphResolver = (ch: string) => Glyph | null

/**
 * テキストを改行で行分割し、各行を横に配置、行を縦に積む純関数。
 * 座標系はフォント単位・Y 下向き（上端 = 0）。描画側で em→px スケールする。
 * getGlyph を注入するためテストしやすい。
 */
export function layoutText(
  text: string,
  resolve: GlyphResolver,
  metrics: GlyphMetrics,
): GlyphLayout {
  const em = metrics.unitsPerEm
  const sidePad = LAYOUT.sidePaddingEm * em
  const vPad = LAYOUT.verticalPaddingEm * em
  const lineGap = LAYOUT.lineGapEm * em
  // 1 行の高さ = ascender - descender（descender は負）
  const lineHeight = metrics.ascender - metrics.descender

  // 末尾の空行は無視しつつ、最低 1 行は残す
  const rawLines = text.split('\n')
  const effectiveLines = rawLines.length > 0 ? rawLines : ['']

  const lines: LayoutLine[] = []
  let maxWidth = 0

  effectiveLines.forEach((raw, idx) => {
    const items: PlacedGlyph[] = []
    let x = sidePad
    for (const ch of raw) {
      const glyph = resolve(ch)
      if (!glyph) continue // 未対応文字はスキップ
      items.push({ glyph, x })
      x += glyph.advance
    }
    const width = x + sidePad
    maxWidth = Math.max(maxWidth, width)
    const baselineY = vPad + idx * (lineHeight + lineGap) + metrics.ascender
    lines.push({ items, baselineY, width })
  })

  const height =
    vPad * 2 + effectiveLines.length * lineHeight + (effectiveLines.length - 1) * lineGap

  return { lines, width: Math.max(maxWidth, em), height, metrics }
}

/** リアクティブなテキストからレイアウトを算出する composable */
export function useGlyphLayout(
  text: Ref<string>,
  resolve: GlyphResolver,
  metrics: GlyphMetrics,
) {
  const layout = computed(() => layoutText(text.value, resolve, metrics))
  return { layout }
}
