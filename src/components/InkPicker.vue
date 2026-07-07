<script setup lang="ts">
import { computed } from 'vue'
import { INKS, getInk } from '../data/inks'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const currentName = computed(() => getInk(props.modelValue).name)
</script>

<template>
  <div class="inks">
    <span class="inks__label">
      インク<span class="inks__current"> · {{ currentName }}</span>
    </span>
    <div class="inks__swatches" role="radiogroup" aria-label="インク色">
      <button
        v-for="ink in INKS"
        :key="ink.id"
        type="button"
        class="inks__swatch"
        :class="{ 'is-active': ink.id === modelValue }"
        :style="{ '--ink': ink.swatch }"
        role="radio"
        :aria-checked="ink.id === modelValue"
        :aria-label="ink.name"
        :title="ink.name"
        @click="emit('update:modelValue', ink.id)"
      />
    </div>
  </div>
</template>

<style scoped>
.inks {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.inks__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}
.inks__current {
  color: var(--text);
}
.inks__swatches {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.inks__swatch {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--ink);
  border: 2px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: transform 0.12s, border-color 0.12s, box-shadow 0.12s;
  position: relative;
}
.inks__swatch:hover {
  transform: scale(1.1);
}
.inks__swatch.is-active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-weak), var(--shadow-sm);
}
.inks__swatch.is-active::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  mix-blend-mode: difference;
}
/* タッチ端末では見本を少し大きく＝押しやすく */
@media (pointer: coarse) {
  .inks__swatch {
    width: 34px;
    height: 34px;
  }
}
</style>
