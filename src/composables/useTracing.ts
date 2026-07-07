import { ref, type Ref } from 'vue'

/** 描画点。座標は 0..1 の正規化（リサイズしても相対位置を保つため）。p は筆圧 */
interface TracePoint {
  x: number
  y: number
  p: number
}

/** なぞり書きの基準線幅（CSS px） */
const BASE_WIDTH = 4

/**
 * インクレイヤ（前面 Canvas）への手書き入力を扱う。
 * Pointer Events でマウス・タッチ・ペンを統一的に処理し、
 * ストロークを正規化座標で保持して undo / clear / 再描画できる。
 */
export function useTracing(
  canvasRef: Ref<HTMLCanvasElement | null>,
  getInkColor: () => string,
) {
  const strokes = ref<TracePoint[][]>([])
  let current: TracePoint[] = []
  let drawing = false
  let cssW = 1
  let cssH = 1
  let dpr = 1

  function ctx(): CanvasRenderingContext2D | null {
    return canvasRef.value?.getContext('2d') ?? null
  }

  /** サイズ確定・変更時に呼ぶ（実解像度は呼び出し側で設定済み前提） */
  function configure(w: number, h: number, ratio: number) {
    cssW = Math.max(1, w)
    cssH = Math.max(1, h)
    dpr = ratio
    const c = ctx()
    if (c) c.setTransform(dpr, 0, 0, dpr, 0, 0)
    redraw()
  }

  function toPoint(e: PointerEvent): TracePoint {
    const rect = canvasRef.value!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      p: e.pressure > 0 ? e.pressure : 0.5,
    }
  }

  function onDown(e: PointerEvent) {
    const c = canvasRef.value
    if (!c) return
    c.setPointerCapture(e.pointerId)
    drawing = true
    current = [toPoint(e)]
    redraw()
  }
  function onMove(e: PointerEvent) {
    if (!drawing) return
    current.push(toPoint(e))
    redraw()
  }
  function onUp() {
    if (!drawing) return
    drawing = false
    if (current.length > 0) strokes.value.push(current)
    current = []
    redraw()
  }

  function strokePath(c: CanvasRenderingContext2D, pts: TracePoint[]) {
    if (pts.length === 1) {
      const p = pts[0]
      c.beginPath()
      c.arc(p.x * cssW, p.y * cssH, (BASE_WIDTH * (0.4 + p.p * 1.2)) / 2, 0, Math.PI * 2)
      c.fill()
      return
    }
    // 筆圧に応じて区間ごとに線幅を変える
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      c.lineWidth = BASE_WIDTH * (0.4 + b.p * 1.2)
      c.beginPath()
      c.moveTo(a.x * cssW, a.y * cssH)
      c.lineTo(b.x * cssW, b.y * cssH)
      c.stroke()
    }
  }

  function redraw() {
    const c = ctx()
    if (!c) return
    c.clearRect(0, 0, cssW, cssH)
    c.lineCap = 'round'
    c.lineJoin = 'round'
    const color = getInkColor()
    c.strokeStyle = color
    c.fillStyle = color
    for (const s of strokes.value) strokePath(c, s)
    if (current.length) strokePath(c, current)
  }

  function undo() {
    strokes.value.pop()
    redraw()
  }
  function clear() {
    strokes.value = []
    current = []
    redraw()
  }

  return { strokes, configure, redraw, undo, clear, onDown, onMove, onUp }
}
