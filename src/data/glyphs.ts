import { GLYPHS, GLYPH_METRICS } from './glyphs.generated'
import type { Glyph } from '../types/glyph'
export { GLYPH_METRICS }
export function hasGlyph(ch: string): boolean { return ch in GLYPHS }
export function getGlyph(ch: string): Glyph | null {
  const g = GLYPHS[ch]; if (!g) return null
  return { char: ch, strokes: g.strokes, advance: g.advance }
}
export const SUPPORTED_CHARS = Object.keys(GLYPHS)
