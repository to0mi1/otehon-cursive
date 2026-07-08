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

/** 3 次ベジェ 1 区間の制御点（始点→to へ c1,c2 経由で描く） */
export interface BezierSegment {
  c1: Point
  c2: Point
  to: Point
}

/**
 * 点列を Catmull-Rom スプラインとして 3 次ベジェ区間列に変換する。
 * 全点を通りつつ角を丸めるため、直線連結で生じるカクつきを解消できる。
 * 端点は自身を複製して自然な接線にする。区間は各 points[i]→points[i+1]。
 */
export function catmullRomBeziers(points: Point[]): BezierSegment[] {
  const n = points.length
  const segs: BezierSegment[] = []
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < n ? i + 2 : n - 1]
    segs.push({
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      to: { x: p2.x, y: p2.y },
    })
  }
  return segs
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
