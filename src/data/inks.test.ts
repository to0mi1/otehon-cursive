import { describe, expect, it } from 'vitest'
import { DEFAULT_INK_ID, getInk, INKS, inkStroke } from './inks'

describe('inks', () => {
  it('blue-black exists and is the default', () => {
    expect(DEFAULT_INK_ID).toBe('blue-black')
    expect(INKS.some((i) => i.id === 'blue-black')).toBe(true)
  })

  it('getInk returns the matching ink', () => {
    expect(getInk('black').id).toBe('black')
  })

  it('getInk falls back to the first ink for unknown id', () => {
    expect(getInk('does-not-exist')).toBe(INKS[0])
  })

  it('inkStroke picks the theme-specific color', () => {
    const ink = getInk('blue-black')
    expect(inkStroke(ink, 'light')).toBe(ink.light)
    expect(inkStroke(ink, 'dark')).toBe(ink.dark)
  })

  it('every ink defines light and dark hex colors', () => {
    for (const ink of INKS) {
      expect(ink.light).toMatch(/^#[0-9a-fA-F]{3,8}$/)
      expect(ink.dark).toMatch(/^#[0-9a-fA-F]{3,8}$/)
    }
  })

  it('ink ids are unique', () => {
    const ids = INKS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
