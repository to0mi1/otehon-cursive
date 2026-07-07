import { describe, expect, it } from 'vitest'
import { distance, polylineLength, strokesLength, takePolyline } from './geometry'

describe('distance', () => {
  it('3-4-5 triangle', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})

describe('polylineLength', () => {
  it('sums segment lengths', () => {
    expect(polylineLength([{ x: 0, y: 0 }, { x: 0, y: 3 }, { x: 4, y: 3 }])).toBe(7)
  })
  it('empty or single point is 0', () => {
    expect(polylineLength([])).toBe(0)
    expect(polylineLength([{ x: 1, y: 1 }])).toBe(0)
  })
})

describe('strokesLength', () => {
  it('sums across strokes', () => {
    const strokes = [
      [{ x: 0, y: 0 }, { x: 0, y: 3 }],
      [{ x: 0, y: 0 }, { x: 4, y: 0 }],
    ]
    expect(strokesLength(strokes)).toBe(7)
  })
})

describe('takePolyline', () => {
  const line = [{ x: 0, y: 0 }, { x: 10, y: 0 }]

  it('interpolates the end point on partial take', () => {
    const r = takePolyline(line, 4)
    expect(r.fullyConsumed).toBe(false)
    expect(r.end).toEqual({ x: 4, y: 0 })
    expect(r.points.at(-1)).toEqual({ x: 4, y: 0 })
  })

  it('returns full polyline when maxLen exceeds length', () => {
    const r = takePolyline(line, 20)
    expect(r.fullyConsumed).toBe(true)
    expect(r.end).toEqual({ x: 10, y: 0 })
    expect(r.points).toHaveLength(2)
  })

  it('returns empty for zero or negative length', () => {
    expect(takePolyline(line, 0).points).toEqual([])
    expect(takePolyline(line, -5).points).toEqual([])
  })

  it('handles multi-segment polylines', () => {
    // 縦 6 + 横 8。maxLen 10 なら 6 消費後、横に 4 進んだ (4,6) で打ち切り
    const r = takePolyline([{ x: 0, y: 0 }, { x: 0, y: 6 }, { x: 8, y: 6 }], 10)
    expect(r.fullyConsumed).toBe(false)
    expect(r.end).toEqual({ x: 4, y: 6 })
  })
})
