import type { Point } from '../types/glyph'
import type { GlyphLayout } from '../composables/useGlyphLayout'
import type { Theme } from '../composables/useTheme'
import { GUIDE } from '../data/metrics'
import { catmullRomBeziers, polylineLength, strokesLength, takePolyline } from './geometry'

/* -------------------------------------------------------------------------
   このモジュールは Vue 非依存の純粋な Canvas 描画関数群。
   前提: ctx は「フォント単位で描ける」よう呼び出し側で translate/scale 済み。
        （StageCanvas がレイアウト幅に合わせて ctx.scale する）
   座標変換: グリフ点(フォント座標・Y上向き・baseline=0) → canvas は
        x' = ox + p.x,  y' = baselineY - p.y   （Y を反転）
   ------------------------------------------------------------------------- */

/** 4 本罫線の配色（テーマ別） */
export interface GuidePalette {
  ascender: string
  midline: string
  baseline: string
  descender: string
}

export function guidePalette(theme: Theme): GuidePalette {
  return theme === 'dark'
    ? { ascender: '#363b46', midline: '#6b4a4a', baseline: '#566282', descender: '#363b46' }
    : { ascender: '#cdd8e6', midline: '#e2a9a0', baseline: '#7286ad', descender: '#cdd8e6' }
}

/** グリフ描画スタイル（長さはフォント単位） */
export interface DrawStyle {
  ink: string
  lineWidth: number
  /** 指定するとアニメ中のペン先に円を描く */
  penMarker?: string
  penRadius?: number
}

/** レイアウト全体の総ストローク長（アニメの進捗基準） */
export function totalLayoutLength(layout: GlyphLayout): number {
  let t = 0
  for (const line of layout.lines) {
    for (const item of line.items) t += strokesLength(item.glyph.strokes)
  }
  return t
}

/** 各行に 4 本罫線を描く */
export function drawGuideLines(
  ctx: CanvasRenderingContext2D,
  layout: GlyphLayout,
  palette: GuidePalette,
): void {
  const m = layout.metrics
  const em = m.unitsPerEm
  const w = layout.width

  const line = (
    yFromBaseline: number,
    color: string,
    widthEm: number,
    dashEm?: readonly number[],
  ) => {
    ctx.strokeStyle = color
    ctx.lineWidth = widthEm * em
    ctx.setLineDash(dashEm ? dashEm.map((d) => d * em) : [])
    for (const ln of layout.lines) {
      const y = ln.baselineY - yFromBaseline
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  }

  line(m.ascender, palette.ascender, GUIDE.thinWidthEm)
  line(m.xHeight, palette.midline, GUIDE.thinWidthEm, GUIDE.midlineDashEm)
  line(m.baseline, palette.baseline, GUIDE.baselineWidthEm)
  line(m.descender, palette.descender, GUIDE.thinWidthEm)
  ctx.setLineDash([])
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  ox: number,
  oy: number,
): void {
  // フォント座標 → canvas 座標（Y 反転）に変換してから滑らかに結ぶ
  const pts = points.map((p) => ({ x: ox + p.x, y: oy - p.y }))
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  if (pts.length === 2) {
    ctx.lineTo(pts[1].x, pts[1].y)
  } else {
    for (const s of catmullRomBeziers(pts)) {
      ctx.bezierCurveTo(s.c1.x, s.c1.y, s.c2.x, s.c2.y, s.to.x, s.to.y)
    }
  }
  ctx.stroke()
}

/**
 * レイアウト（複数行）を描く。
 * progress(0..1) 未満のときは総長に対する割合まで部分描画し、
 * 打ち切り点にペン先マーカーを描く（アニメ用）。
 */
export function drawGlyphLayout(
  ctx: CanvasRenderingContext2D,
  layout: GlyphLayout,
  style: DrawStyle,
  progress = 1,
): void {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = style.ink
  ctx.lineWidth = style.lineWidth
  ctx.setLineDash([])

  const drawFull = progress >= 1
  let budget = drawFull ? Infinity : progress * totalLayoutLength(layout)
  let penTip: Point | null = null

  done: for (const line of layout.lines) {
    for (const item of line.items) {
      const ox = item.x
      const oy = line.baselineY
      for (const stroke of item.glyph.strokes) {
        if (stroke.length < 2) continue
        if (budget === Infinity) {
          drawStroke(ctx, stroke, ox, oy)
          continue
        }
        const sl = polylineLength(stroke)
        if (budget >= sl) {
          drawStroke(ctx, stroke, ox, oy)
          budget -= sl
        } else if (budget > 0) {
          const { points, end } = takePolyline(stroke, budget)
          if (points.length >= 2) drawStroke(ctx, points, ox, oy)
          penTip = end ? { x: ox + end.x, y: oy - end.y } : null
          budget = 0
          break done
        } else {
          break done
        }
      }
    }
  }

  if (penTip && style.penMarker && !drawFull) {
    ctx.beginPath()
    ctx.fillStyle = style.penMarker
    ctx.arc(penTip.x, penTip.y, style.penRadius ?? style.lineWidth, 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * レイアウトを SVG path の d 文字列（行ごと）に変換（印刷用）。
 * 座標は canvas と同じ Y 下向き（viewBox = 0 0 layout.width layout.height）。
 */
export function layoutToSvgPaths(layout: GlyphLayout): string[] {
  const r = (n: number) => Math.round(n * 10) / 10
  const paths: string[] = []
  for (const line of layout.lines) {
    let d = ''
    for (const item of line.items) {
      for (const stroke of item.glyph.strokes) {
        if (stroke.length < 2) continue
        // canvas と同じ Catmull-Rom スムージングで印刷も滑らかにする
        const pts = stroke.map((p) => ({ x: item.x + p.x, y: line.baselineY - p.y }))
        d += `M${r(pts[0].x)} ${r(pts[0].y)}`
        if (pts.length === 2) {
          d += `L${r(pts[1].x)} ${r(pts[1].y)}`
        } else {
          for (const s of catmullRomBeziers(pts)) {
            d += `C${r(s.c1.x)} ${r(s.c1.y)} ${r(s.c2.x)} ${r(s.c2.y)} ${r(s.to.x)} ${r(s.to.y)}`
          }
        }
      }
    }
    if (d) paths.push(d)
  }
  return paths
}
