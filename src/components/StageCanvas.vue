<script setup lang="ts">
import { ref, watch } from 'vue'
import { useResponsiveCanvas, type CanvasSize } from '../composables/useResponsiveCanvas'

/**
 * レスポンシブな Canvas を 1 枚描画する低レベル部品。
 * 描画内容は draw 関数として親から受け取る（このコンポーネントは描画内容を知らない）。
 */
const props = defineProps<{
  draw: (ctx: CanvasRenderingContext2D, size: CanvasSize) => void
  /** 幅 / 高さ の比。高さは幅から算出される */
  aspectRatio: number
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const { render } = useResponsiveCanvas(
  canvasRef,
  () => props.aspectRatio,
  (ctx, size) => props.draw(ctx, size),
)

// 描画関数（＝テキスト/テーマ/インク等の変化）や縦横比が変わったら再描画
watch(() => props.draw, render)
watch(() => props.aspectRatio, render)
</script>

<template>
  <div class="stage">
    <canvas ref="canvasRef" class="stage__canvas" />
  </div>
</template>

<style scoped>
.stage {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.stage__canvas {
  display: block;
  width: 100%;
}
</style>
