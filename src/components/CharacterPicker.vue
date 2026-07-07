<script setup lang="ts">
import { ref } from 'vue'
import { WORD_PRESETS } from '../data/words'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

type Sub = 'lower' | 'upper' | 'number' | 'word'
const SUBS: { id: Sub; label: string }[] = [
  { id: 'lower', label: '小文字' },
  { id: 'upper', label: '大文字' },
  { id: 'number', label: '数字' },
  { id: 'word', label: '単語・文' },
]
const sub = ref<Sub>('lower')

const CHAR_SETS: Record<Exclude<Sub, 'word'>, string[]> = {
  lower: [...'abcdefghijklmnopqrstuvwxyz'],
  upper: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  number: [...'0123456789'],
}

function pickChar(ch: string) {
  emit('update:modelValue', ch)
}
function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
function pickPreset(text: string) {
  emit('update:modelValue', text)
}
</script>

<template>
  <section class="picker" aria-label="お手本にする文字を選ぶ">
    <div class="picker__subs" role="tablist" aria-label="文字の種類">
      <button
        v-for="s in SUBS"
        :key="s.id"
        type="button"
        class="picker__sub"
        :class="{ 'is-active': s.id === sub }"
        role="tab"
        :aria-selected="s.id === sub"
        @click="sub = s.id"
      >
        {{ s.label }}
      </button>
    </div>

    <!-- 文字ごとのお手本（小文字・大文字・数字） -->
    <div v-if="sub !== 'word'" class="picker__grid">
      <button
        v-for="ch in CHAR_SETS[sub]"
        :key="ch"
        type="button"
        class="picker__cell"
        :class="{ 'is-active': ch === modelValue }"
        @click="pickChar(ch)"
      >
        {{ ch }}
      </button>
    </div>

    <!-- 単語・文（複数行対応） -->
    <div v-else class="picker__word">
      <label class="picker__word-label" for="free-text">
        単語や文を入力（改行で複数行）
      </label>
      <textarea
        id="free-text"
        class="picker__textarea"
        :value="modelValue"
        rows="3"
        spellcheck="false"
        autocapitalize="off"
        placeholder="例) Hello&#10;Thank you"
        @input="onInput"
      />
      <div class="picker__presets">
        <button
          v-for="p in WORD_PRESETS"
          :key="p.label"
          type="button"
          class="picker__chip"
          @click="pickPreset(p.text)"
        >
          {{ p.label }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.picker__subs {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.picker__sub {
  min-height: 36px;
  padding: var(--space-1) var(--space-4);
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.picker__sub:hover {
  color: var(--text);
}
.picker__sub.is-active {
  color: var(--accent-contrast);
  background: var(--accent);
  border-color: var(--accent);
}
.picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--tap), 1fr));
  gap: var(--space-2);
}
.picker__cell {
  min-height: var(--tap);
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: transform 0.1s, border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.picker__cell:hover {
  background: var(--surface-hover);
}
.picker__cell.is-active {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-weak);
  box-shadow: 0 0 0 1px var(--accent);
}
.picker__cell:active {
  transform: scale(0.95);
}
.picker__word {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.picker__word-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}
.picker__textarea {
  width: 100%;
  resize: vertical;
  min-height: 84px;
  padding: var(--space-3);
  font-size: 1.05rem;
  line-height: 1.5;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.picker__textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-weak);
}
.picker__presets {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.picker__chip {
  min-height: 34px;
  padding: var(--space-1) var(--space-3);
  font-size: 0.85rem;
  color: var(--text);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.picker__chip:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-weak);
}
</style>
