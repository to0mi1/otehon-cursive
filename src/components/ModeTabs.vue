<script setup lang="ts">
import type { Mode } from '../types/ui'

defineProps<{ modelValue: Mode }>()
const emit = defineEmits<{ 'update:modelValue': [Mode] }>()

const TABS: { id: Mode; label: string; icon: string }[] = [
  { id: 'animation', label: '書き順', icon: '✍' },
  { id: 'specimen', label: 'お手本', icon: '📖' },
  { id: 'trace', label: 'なぞり書き', icon: '🖊' },
  { id: 'sheet', label: '印刷', icon: '🖨' },
]
</script>

<template>
  <nav class="tabs" aria-label="練習モード">
    <button
      v-for="t in TABS"
      :key="t.id"
      type="button"
      class="tabs__tab"
      :class="{ 'is-active': t.id === modelValue }"
      :aria-pressed="t.id === modelValue"
      @click="emit('update:modelValue', t.id)"
    >
      <span class="tabs__icon" aria-hidden="true">{{ t.icon }}</span>
      <span class="tabs__label">{{ t.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-1);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar {
  display: none;
}
.tabs__tab {
  flex: 1 1 0;
  min-width: max-content;
  min-height: var(--tap);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: calc(var(--radius) - 4px);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
  transition: color 0.15s, background 0.15s, box-shadow 0.15s;
}
.tabs__tab:hover {
  color: var(--text);
}
.tabs__tab.is-active {
  color: var(--accent);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}
.tabs__icon {
  font-size: 1rem;
}
@media (max-width: 599px) {
  .tabs__label {
    font-size: 0.85rem;
  }
  .tabs__tab {
    padding: var(--space-2) var(--space-3);
  }
}
</style>
