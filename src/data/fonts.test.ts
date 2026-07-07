import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FONT_ID,
  FONT_CATEGORIES,
  FONTS,
  fontsByCategory,
  getFont,
} from './fonts'

describe('fonts', () => {
  it('the default font id exists in the list', () => {
    expect(FONTS.some((f) => f.id === DEFAULT_FONT_ID)).toBe(true)
  })

  it('getFont returns the matching font', () => {
    expect(getFont('sacramento').id).toBe('sacramento')
  })

  it('getFont falls back to the first font for unknown id', () => {
    expect(getFont('does-not-exist')).toBe(FONTS[0])
  })

  it('font ids are unique', () => {
    const ids = FONTS.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every font declares a cursive fallback family', () => {
    for (const f of FONTS) {
      expect(f.family).toContain('cursive')
      expect(f.name.length).toBeGreaterThan(0)
    }
  })

  it('every font has a category listed in FONT_CATEGORIES', () => {
    const ids = FONT_CATEGORIES.map((c) => c.id)
    for (const f of FONTS) {
      expect(ids).toContain(f.category)
    }
  })

  it('each category has at least one font', () => {
    for (const c of FONT_CATEGORIES) {
      expect(fontsByCategory(c.id).length).toBeGreaterThan(0)
    }
  })
})
