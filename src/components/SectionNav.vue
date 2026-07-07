<script setup lang="ts">
import type { Section } from '../types/ui'

defineProps<{ modelValue: Section }>()
const emit = defineEmits<{ 'update:modelValue': [Section] }>()

const ITEMS: { id: Section; label: string; icon: string; hint: string }[] = [
  { id: 'practice', label: 'れんしゅう', icon: '✍', hint: '書き順・なぞり書き・印刷' },
  { id: 'viewer', label: 'お手本メーカー', icon: '🖋', hint: 'フォントを選んで表示' },
]
</script>

<template>
  <nav class="section-nav" aria-label="機能の切り替え">
    <button
      v-for="it in ITEMS"
      :key="it.id"
      type="button"
      class="section-nav__item"
      :class="{ 'is-active': it.id === modelValue }"
      :aria-pressed="it.id === modelValue"
      @click="emit('update:modelValue', it.id)"
    >
      <span class="section-nav__icon" aria-hidden="true">{{ it.icon }}</span>
      <span class="section-nav__text">
        <span class="section-nav__label">{{ it.label }}</span>
        <span class="section-nav__hint">{{ it.hint }}</span>
      </span>
    </button>
  </nav>
</template>

<style scoped>
.section-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}
.section-nav__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--tap);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius);
  text-align: left;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: color 0.15s, border-color 0.15s, background 0.15s, transform 0.1s;
}
.section-nav__item:hover {
  color: var(--text);
  border-color: var(--border-strong);
}
.section-nav__item:active {
  transform: scale(0.99);
}
.section-nav__item.is-active {
  color: var(--accent);
  background: var(--accent-weak);
  border-color: var(--accent);
}
.section-nav__icon {
  font-size: 1.3rem;
  line-height: 1;
}
.section-nav__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.section-nav__label {
  font-size: 1rem;
  font-weight: 700;
}
.section-nav__hint {
  font-size: 0.72rem;
  color: var(--text-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 599px) {
  .section-nav__hint {
    display: none;
  }
  .section-nav__item {
    justify-content: center;
  }
}
</style>
