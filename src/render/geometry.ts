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
 * 点列を centripetal Catmull-Rom スプライン（α=0.5）として 3 次ベジェ区間列に変換する。
 * 全点を通りつつ角を丸めるため、直線連結で生じるカクつきを解消できる。
 * 一様パラメータ化と違い、点の間隔が不均一でも波打ち・オーバーシュートを抑えられる。
 * 端点は隣接点をミラー外挿して自然な接線にする。区間は各 points[i]→points[i+1]。
 */
export function catmullRomBeziers(points: Point[]): BezierSegment[] {
  const n = points.length
  const segs: BezierSegment[] = []
  if (n < 2) return segs

  const EPS = 1e-6
  // centripetal: ノット間隔を距離^0.5 にする（0 は EPS でゼロ割回避）
  const knot = (a: Point, b: Point) =>
    Math.max(Math.sqrt(Math.hypot(b.x - a.x, b.y - a.y)), EPS)

  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    // 端点は隣接点の鏡像を仮想的な制御点として使う
    const p0 = i > 0 ? points[i - 1] : { x: 2 * p1.x - p2.x, y: 2 * p1.y - p2.y }
    const p3 = i + 2 < n ? points[i + 2] : { x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y }

    const d1 = knot(p0, p1)
    const d2 = knot(p1, p2)
    const d3 = knot(p2, p3)

    // 非一様 Catmull-Rom の接線（p1 側 m1 / p2 側 m2）
    const m1x = (p2.x - p1.x) / d2 - (p2.x - p0.x) / (d1 + d2) + (p1.x - p0.x) / d1
    const m1y = (p2.y - p1.y) / d2 - (p2.y - p0.y) / (d1 + d2) + (p1.y - p0.y) / d1
    const m2x = (p3.x - p2.x) / d3 - (p3.x - p1.x) / (d2 + d3) + (p2.x - p1.x) / d2
    const m2y = (p3.y - p2.y) / d3 - (p3.y - p1.y) / (d2 + d3) + (p2.y - p1.y) / d2

    segs.push({
      c1: { x: p1.x + (m1x * d2) / 3, y: p1.y + (m1y * d2) / 3 },
      c2: { x: p2.x - (m2x * d2) / 3, y: p2.y - (m2y * d2) / 3 },
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
