import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export interface CanvasSize {
  w: number
  h: number
}

/**
 * 親要素の幅に追従し、devicePixelRatio を考慮して Canvas を高解像度描画する。
 * - 実ピクセル = CSS px * dpr（Windows の高 DPI でもくっきり）
 * - ctx はあらかじめ dpr スケール済みなので、draw 側は CSS px 座標で描ける
 * - 親のリサイズを ResizeObserver で監視して再描画
 */
export function useResponsiveCanvas(
  canvasRef: Ref<HTMLCanvasElement | null>,
  getAspectRatio: () => number,
  draw: (ctx: CanvasRenderingContext2D, size: CanvasSize) => void,
) {
  const size = ref<CanvasSize>({ w: 0, h: 0 })
  let ro: ResizeObserver | null = null

  function render() {
    const canvas = canvasRef.value
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const w = Math.max(1, parent.clientWidth)
    const aspect = getAspectRatio() || 1
    const h = Math.max(1, w / aspect)
    const dpr = window.devicePixelRatio || 1

    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    size.value = { w, h }
    draw(ctx, { w, h })
  }

  onMounted(() => {
    ro = new ResizeObserver(() => render())
    const parent = canvasRef.value?.parentElement
    if (parent) ro.observe(parent)
    render()
  })

  onBeforeUnmount(() => {
    ro?.disconnect()
    ro = null
  })

  return { render, size }
}
