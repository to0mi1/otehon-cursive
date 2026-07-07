<script setup lang="ts">
import { computed, ref } from 'vue'
import { layoutText } from '../composables/useGlyphLayout'
import { getGlyph, GLYPH_METRICS } from '../data/glyphs'
import { layoutToSvgPaths } from '../render/drawGlyphs'

// inkId は受け取るが、印刷は白黒前提のため描画には使わない（お手本は薄いグレー）
const props = defineProps<{ text: string; inkId: string }>()

const rows = ref(6)
const withGhost = ref(true)

const m = GLYPH_METRICS
const layout = computed(() => layoutText(props.text || ' ', getGlyph, GLYPH_METRICS))
const viewW = computed(() => layout.value.width)
const viewH = computed(() => layout.value.height)
const ghostPaths = computed(() => layoutToSvgPaths(layout.value))

/** 各行の 4 本罫線の y 座標（viewBox 座標系） */
const guideLines = computed(() =>
  layout.value.lines.map((ln) => ({
    ascender: ln.baselineY - m.ascender,
    midline: ln.baselineY - m.xHeight,
    baseline: ln.baselineY,
    descender: ln.baselineY - m.descender,
  })),
)

const blocks = computed(() => Array.from({ length: rows.value }, (_, i) => i))

function print() {
  window.print()
}
</script>

<template>
  <div class="practice">
    <div class="practice__controls no-print">
      <label class="practice__field">
        行数
        <select v-model.number="rows" class="practice__select">
          <option v-for="n in [4, 6, 8, 10, 12]" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
      <label class="practice__field">
        <input v-model="withGhost" type="checkbox" />
        お手本を薄く敷く
      </label>
      <button class="practice__print" type="button" @click="print">🖨 印刷する</button>
    </div>

    <div class="practice__sheet">
      <div
        v-for="b in blocks"
        :key="b"
        class="practice__row"
      >
        <svg
          class="practice__svg"
          :viewBox="`0 0 ${viewW} ${viewH}`"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="筆記体練習の罫線"
        >
          <template v-for="(g, i) in guideLines" :key="i">
            <line
              :x1="0"
              :y1="g.ascender"
              :x2="viewW"
              :y2="g.ascender"
              class="gl gl--thin"
              vector-effect="non-scaling-stroke"
            />
            <line
              :x1="0"
              :y1="g.midline"
              :x2="viewW"
              :y2="g.midline"
              class="gl gl--mid"
              vector-effect="non-scaling-stroke"
            />
            <line
              :x1="0"
              :y1="g.baseline"
              :x2="viewW"
              :y2="g.baseline"
              class="gl gl--base"
              vector-effect="non-scaling-stroke"
            />
            <line
              :x1="0"
              :y1="g.descender"
              :x2="viewW"
              :y2="g.descender"
              class="gl gl--thin"
              vector-effect="non-scaling-stroke"
            />
          </template>
          <path
            v-for="(d, i) in withGhost ? ghostPaths : []"
            :key="'ghost' + i"
            :d="d"
            class="gl gl--ghost"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.practice {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.practice__controls {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}
.practice__field {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-muted);
}
.practice__select {
  min-height: 36px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text);
}
.practice__print {
  margin-left: auto;
  min-height: var(--tap);
  padding: 0 var(--space-5);
  border-radius: var(--radius-sm);
  font-weight: 700;
  color: var(--accent-contrast);
  background: var(--accent);
  border: 1px solid var(--accent);
  transition: background 0.15s;
}
.practice__print:hover {
  background: var(--accent-hover);
}

.practice__sheet {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}
.practice__row {
  width: 100%;
}
.practice__svg {
  display: block;
  width: 100%;
  height: auto;
}

/* 罫線・お手本（画面表示） */
.gl--thin {
  stroke: #c7cddb;
  stroke-width: 1;
}
.gl--mid {
  stroke: #e2a9a0;
  stroke-width: 1;
  stroke-dasharray: 6 5;
}
.gl--base {
  stroke: #7286ad;
  stroke-width: 1.6;
}
.gl--ghost {
  stroke: #b7c0cf;
  stroke-width: 2;
  fill: none;
}

/* 印刷: A4 縦・白背景・黒線。UI は隠す（.no-print） */
@media print {
  .practice__sheet {
    border: none;
    box-shadow: none;
    padding: 0;
    gap: 10mm;
  }
  .practice__row {
    break-inside: avoid;
  }
  .gl--thin {
    stroke: #888;
  }
  .gl--mid {
    stroke: #aaa;
  }
  .gl--base {
    stroke: #333;
  }
  .gl--ghost {
    stroke: #bbb;
  }
}
</style>
