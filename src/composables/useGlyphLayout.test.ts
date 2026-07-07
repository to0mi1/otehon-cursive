import { describe, expect, it } from 'vitest'
import { layoutText, type GlyphResolver } from './useGlyphLayout'
import type { Glyph, GlyphMetrics } from '../types/glyph'

const metrics: GlyphMetrics = {
  unitsPerEm: 1000,
  ascender: 800,
  capHeight: 500,
  xHeight: 300,
  baseline: 0,
  descender: -200,
}

const mk = (char: string, advance = 500): Glyph => ({
  char,
  strokes: [[{ x: 0, y: 0 }, { x: advance, y: 0 }]],
  advance,
})

// a-z とスペースのみ対応するダミー resolver
const resolve: GlyphResolver = (ch) =>
  ch === ' ' ? mk(' ', 300) : /[a-z]/.test(ch) ? mk(ch) : null

describe('layoutText', () => {
  it('places glyphs left to right by advance', () => {
    const lay = layoutText('ab', resolve, metrics)
    expect(lay.lines).toHaveLength(1)
    const [a, b] = lay.lines[0].items
    expect(a.glyph.char).toBe('a')
    expect(b.x - a.x).toBe(500)
  })

  it('splits on newline into stacked lines', () => {
    const lay = layoutText('a\nb', resolve, metrics)
    expect(lay.lines).toHaveLength(2)
    expect(lay.lines[1].baselineY).toBeGreaterThan(lay.lines[0].baselineY)
  })

  it('stacks lines by lineHeight + lineGap', () => {
    const lay = layoutText('a\nb', resolve, metrics)
    const gap = lay.lines[1].baselineY - lay.lines[0].baselineY
    // lineHeight = ascender - descender = 1000, lineGap = 0.35em = 350
    expect(gap).toBe(1000 + 350)
  })

  it('skips unsupported characters', () => {
    const lay = layoutText('a#b', resolve, metrics)
    expect(lay.lines[0].items.map((i) => i.glyph.char)).toEqual(['a', 'b'])
  })

  it('has positive height and width at least one em', () => {
    const lay = layoutText('', resolve, metrics)
    expect(lay.height).toBeGreaterThan(0)
    expect(lay.width).toBeGreaterThanOrEqual(metrics.unitsPerEm)
  })
})
