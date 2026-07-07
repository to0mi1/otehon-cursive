export interface Point { x: number; y: number }
export interface Glyph { char: string; strokes: Point[][]; advance: number }
export interface GlyphMetrics {
  unitsPerEm: number
  ascender: number
  capHeight: number
  xHeight: number
  baseline: number   // 0
  descender: number  // 負値
}
