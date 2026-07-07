<script setup lang="ts">
const props = defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
}>()
const emit = defineEmits<{ 'update:modelValue': [number] }>()

function onInput(e: Event) {
  emit('update:modelValue', Number((e.target as HTMLInputElement).value))
}
</script>

<template>
  <label class="speed">
    <span class="speed__label">速さ</span>
    <input
      class="speed__range"
      type="range"
      :min="min ?? 0.5"
      :max="max ?? 3"
      :step="step ?? 0.1"
      :value="modelValue"
      :aria-valuetext="`${props.modelValue.toFixed(1)}倍速`"
      @input="onInput"
    />
    <span class="speed__value">{{ props.modelValue.toFixed(1) }}×</span>
  </label>
</template>

<style scoped>
.speed {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.85rem;
  color: var(--text-muted);
}
.speed__label {
  font-weight: 600;
  white-space: nowrap;
}
.speed__range {
  width: 120px;
  height: var(--tap);
  accent-color: var(--accent);
  cursor: pointer;
}
.speed__value {
  min-width: 2.6em;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  font-weight: 600;
}
@media (max-width: 599px) {
  .speed__range {
    width: 90px;
  }
}
</style>
