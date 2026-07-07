<script setup lang="ts">
import { computed } from 'vue'
import StageCanvas from './StageCanvas.vue'
import type { CanvasSize } from '../composables/useResponsiveCanvas'
import { layoutText } from '../composables/useGlyphLayout'
import { getGlyph, GLYPH_METRICS } from '../data/glyphs'
import { drawGlyphLayout, drawGuideLines, guidePalette } from '../render/drawGlyphs'
import { LAYOUT } from '../data/metrics'
import { useTheme } from '../composables/useTheme'
import { getInk, inkStroke } from '../data/inks'

const props = defineProps<{ text: string; inkId: string }>()
const { theme } = useTheme()

// 空文字だと幅 0 になるためスペースで代替
const layout = computed(() => layoutText(props.text || ' ', getGlyph, GLYPH_METRICS))
const aspectRatio = computed(() => layout.value.width / layout.value.height)

const draw = computed(() => {
  const lay = layout.value
  const th = theme.value
  const ink = inkStroke(getInk(props.inkId), th)
  const em = GLYPH_METRICS.unitsPerEm
  const palette = guidePalette(th)
  return (ctx: CanvasRenderingContext2D, _size: CanvasSize) => {
    const scale = _size.w / lay.width
    ctx.save()
    ctx.scale(scale, scale)
    drawGuideLines(ctx, lay, palette)
    drawGlyphLayout(ctx, lay, { ink, lineWidth: LAYOUT.strokeWidthEm * em })
    ctx.restore()
  }
})
</script>

<template>
  <StageCanvas :draw="draw" :aspect-ratio="aspectRatio" />
</template>
