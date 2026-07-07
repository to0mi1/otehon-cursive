import type { Point } from '../types/glyph'

/** 2 点間のユークリッド距離 */
export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** 点列（ポリライン）の全長 */
export function polylineLength(points: Point[]): number {
  let len = 0
  for (let i = 1; i < points.length; i++) len += distance(points[i - 1], points[i])
  return len
}

/** 複数ストロークの合計長 */
export function strokesLength(strokes: Point[][]): number {
  let len = 0
  for (const s of strokes) len += polylineLength(s)
  return len
}

export interface TakenPolyline {
  /** 先頭から maxLen の距離まで切り出した点列（終端は線形補間） */
  points: Point[]
  /** 切り出し終端の座標（＝ペン先）。空なら null */
  end: Point | null
  /** maxLen が点列全長以上で、全部描き切ったか */
  fullyConsumed: boolean
}

/**
 * 点列を先頭から距離 maxLen まで切り出す。
 * 書き順アニメで「途中まで描く」ために使う純関数。
 */
export function takePolyline(points: Point[], maxLen: number): TakenPolyline {
  if (points.length === 0 || maxLen <= 0) {
    return { points: [], end: null, fullyConsumed: false }
  }
  if (points.length === 1) {
    return { points: [points[0]], end: points[0], fullyConsumed: true }
  }
  const out: Point[] = [points[0]]
  let remaining = maxLen
  for (let i = 1; i < points.length; i++) {
    const seg = distance(points[i - 1], points[i])
    if (seg <= remaining) {
      out.push(points[i])
      remaining -= seg
    } else {
      const t = remaining / seg
      const end: Point = {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
      }
      out.push(end)
      return { points: out, end, fullyConsumed: false }
    }
  }
  const last = points[points.length - 1]
  return { points: out, end: last, fullyConsumed: true }
}
