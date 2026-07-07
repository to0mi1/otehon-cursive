<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import StageCanvas from './StageCanvas.vue'
import SpeedControl from './SpeedControl.vue'
import type { CanvasSize } from '../composables/useResponsiveCanvas'
import { layoutText } from '../composables/useGlyphLayout'
import { getGlyph, GLYPH_METRICS } from '../data/glyphs'
import {
  drawGlyphLayout,
  drawGuideLines,
  guidePalette,
  totalLayoutLength,
} from '../render/drawGlyphs'
import { LAYOUT } from '../data/metrics'
import { useTheme } from '../composables/useTheme'
import { getInk, inkStroke } from '../data/inks'
import { usePlayback } from '../composables/usePlayback'

const props = defineProps<{ text: string; inkId: string }>()
const { theme } = useTheme()

/** 速度 1.0 のときのペン速度（フォント単位/秒） */
const BASE_UNITS_PER_SEC = 1500

const layout = computed(() => layoutText(props.text || ' ', getGlyph, GLYPH_METRICS))
const aspectRatio = computed(() => layout.value.width / layout.value.height)
const totalLen = computed(() => totalLayoutLength(layout.value))

const speed = ref(1)
const durationMs = () =>
  (totalLen.value / (BASE_UNITS_PER_SEC * speed.value)) * 1000

const { progress, playing, play, pause, reset } = usePlayback(durationMs)

function toggle() {
  if (playing.value) pause()
  else play()
}
function restart() {
  reset()
  play()
}

// 文字が変わったら頭から自動再生
watch(() => props.text, restart)
onMounted(play)

const draw = computed(() => {
  const lay = layout.value
  const th = theme.value
  const ink = inkStroke(getInk(props.inkId), th)
  const em = GLYPH_METRICS.unitsPerEm
  const palette = guidePalette(th)
  const p = progress.value
  return (ctx: CanvasRenderingContext2D, size: CanvasSize) => {
    const scale = size.w / lay.width
    ctx.save()
    ctx.scale(scale, scale)
    drawGuideLines(ctx, lay, palette)
    drawGlyphLayout(
      ctx,
      lay,
      {
        ink,
        lineWidth: LAYOUT.strokeWidthEm * em,
        penMarker: ink,
        penRadius: LAYOUT.penMarkerRadiusEm * em,
      },
      p,
    )
    ctx.restore()
  }
})
</script>

<template>
  <div class="anim">
    <StageCanvas :draw="draw" :aspect-ratio="aspectRatio" />
    <div class="anim__controls">
      <button
        class="anim__btn anim__btn--primary"
        type="button"
        @click="toggle"
      >
        {{ playing ? '⏸ 一時停止' : progress >= 1 ? '↻ もう一度' : '▶ 再生' }}
      </button>
      <button class="anim__btn" type="button" @click="restart">⏮ 最初から</button>
      <SpeedControl v-model="speed" />
    </div>
  </div>
</template>

<style scoped>
.anim {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.anim__controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}
.anim__btn {
  min-height: var(--tap);
  padding: 0 var(--space-4);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  background: var(--surface-2);
  border: 1px solid var(--border);
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
}
.anim__btn:hover {
  background: var(--surface-hover);
}
.anim__btn:active {
  transform: scale(0.97);
}
.anim__btn--primary {
  color: var(--accent-contrast);
  background: var(--accent);
  border-color: var(--accent);
}
.anim__btn--primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}
</style>
