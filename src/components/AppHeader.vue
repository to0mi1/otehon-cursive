<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <header class="header">
    <div class="header__brand">
      <span class="header__logo" aria-hidden="true">✒</span>
      <div class="header__titles">
        <h1 class="header__title">筆記体れんしゅう</h1>
        <p class="header__sub">Cursive Writing Practice</p>
      </div>
    </div>
    <button
      class="header__theme"
      type="button"
      @click="toggleTheme"
      :aria-label="theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'"
    >
      <span aria-hidden="true">{{ theme === 'dark' ? '☀' : '☾' }}</span>
    </button>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) 0;
}
.header__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.header__logo {
  font-size: 28px;
  line-height: 1;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.12));
}
.header__titles {
  display: flex;
  flex-direction: column;
}
.header__title {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
}
.header__sub {
  font-size: 0.75rem;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}
.header__theme {
  width: var(--tap);
  height: var(--tap);
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 1.1rem;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: background 0.2s, transform 0.1s;
}
.header__theme:hover {
  background: var(--surface-hover);
}
.header__theme:active {
  transform: scale(0.94);
}
@media (max-width: 599px) {
  .header__title {
    font-size: 1.15rem;
  }
}
</style>
