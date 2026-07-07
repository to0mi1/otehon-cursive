import { describe, expect, it } from 'vitest'
import { getGlyph, hasGlyph, GLYPH_METRICS, SUPPORTED_CHARS } from './glyphs'

const LOWER = [...'abcdefghijklmnopqrstuvwxyz']
const UPPER = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
const DIGITS = [...'0123456789']

describe('glyph data', () => {
  it('covers all lowercase, uppercase and digits', () => {
    for (const ch of [...LOWER, ...UPPER, ...DIGITS]) {
      expect(hasGlyph(ch), `missing glyph: ${ch}`).toBe(true)
    }
  })

  it('every non-space glyph has at least one stroke with 2+ points', () => {
    for (const ch of SUPPORTED_CHARS) {
      if (ch === ' ') continue
      const g = getGlyph(ch)!
      expect(g.strokes.length, `no strokes: ${ch}`).toBeGreaterThan(0)
      for (const s of g.strokes) {
        expect(s.length, `stroke too short: ${ch}`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('space glyph has advance but no strokes', () => {
    const sp = getGlyph(' ')
    expect(sp).not.toBeNull()
    expect(sp!.strokes).toEqual([])
    expect(sp!.advance).toBeGreaterThan(0)
  })

  it('all advances are positive', () => {
    for (const ch of SUPPORTED_CHARS) {
      expect(getGlyph(ch)!.advance, `bad advance: ${ch}`).toBeGreaterThan(0)
    }
  })

  it('metrics are consistent (ascender > xHeight > baseline > descender)', () => {
    const m = GLYPH_METRICS
    expect(m.ascender).toBeGreaterThan(m.xHeight)
    expect(m.xHeight).toBeGreaterThan(m.baseline)
    expect(m.baseline).toBeGreaterThan(m.descender)
    expect(m.unitsPerEm).toBeGreaterThan(0)
  })
})
