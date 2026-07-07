<script setup lang="ts">
import { ref, watch } from 'vue'
import AppHeader from './components/AppHeader.vue'
import SectionNav from './components/SectionNav.vue'
import ModeTabs from './components/ModeTabs.vue'
import CharacterPicker from './components/CharacterPicker.vue'
import InkPicker from './components/InkPicker.vue'
import StaticSpecimen from './components/StaticSpecimen.vue'
import StrokeAnimation from './components/StrokeAnimation.vue'
import TracingCanvas from './components/TracingCanvas.vue'
import PracticeSheet from './components/PracticeSheet.vue'
import FontSpecimen from './components/FontSpecimen.vue'
import type { Mode, Section } from './types/ui'
import { DEFAULT_TEXT } from './data/words'
import { DEFAULT_INK_ID } from './data/inks'
import { useTheme } from './composables/useTheme'

// テーマ（ライト/ダーク）を初期化し data-theme を反映
useTheme()

// 共有 URL（お手本メーカー）で開かれた場合はそのセクションを初期表示
function initialSection(): Section {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''))
  return params.get('view') === 'maker' ? 'viewer' : 'practice'
}

const section = ref<Section>(initialSection())

// お手本メーカー以外へ移動したら共有ハッシュを消す
watch(section, (s) => {
  if (s !== 'viewer') {
    history.replaceState(null, '', location.pathname + location.search)
  }
})

// --- 練習セクションの状態 ---
const mode = ref<Mode>('specimen')
const text = ref(DEFAULT_TEXT)
const inkId = ref(DEFAULT_INK_ID)
</script>

<template>
  <div class="app">
    <div class="app__inner">
      <AppHeader class="no-print" />
      <SectionNav v-model="section" class="no-print" />

      <!-- 練習セクション（書き順 / お手本 / なぞり書き / 印刷） -->
      <template v-if="section === 'practice'">
        <ModeTabs v-model="mode" class="no-print" />
        <div class="app__body">
          <section class="app__panel card no-print">
            <CharacterPicker v-model="text" />
            <hr class="app__divider" />
            <InkPicker v-model="inkId" />
          </section>
          <section class="app__stage">
            <StrokeAnimation v-if="mode === 'animation'" :text="text" :ink-id="inkId" />
            <StaticSpecimen v-else-if="mode === 'specimen'" :text="text" :ink-id="inkId" />
            <TracingCanvas v-else-if="mode === 'trace'" :text="text" :ink-id="inkId" />
            <PracticeSheet v-else :text="text" :ink-id="inkId" />
          </section>
        </div>
      </template>

      <!-- お手本メーカー（フォントを選んで単語・文を表示） -->
      <FontSpecimen v-else />

      <footer class="app__footer no-print">
        <p>
          お手本フォント: Hershey Script（練習）／ Google Fonts 各種（お手本メーカー）
        </p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100svh;
  background: var(--bg);
}
.app__inner {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 var(--space-4) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.app__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}
.app__panel {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.app__divider {
  width: 100%;
  height: 1px;
  border: none;
  background: var(--border);
  margin: 0;
}
.app__stage {
  min-width: 0;
}
.app__footer {
  text-align: center;
  color: var(--text-faint);
  font-size: 0.72rem;
  padding-top: var(--space-2);
}

/* PC: パネルを左、ステージを右の 2 カラムに */
@media (min-width: 900px) {
  .app__body {
    display: grid;
    grid-template-columns: 340px 1fr;
    align-items: start;
    gap: var(--space-5);
  }
  .app__panel {
    position: sticky;
    top: var(--space-4);
  }
}

/* 印刷時はステージ（練習シート）だけを 1 カラムで出す */
@media print {
  .app__body {
    display: block !important;
  }
  .app__inner {
    padding: 0;
    max-width: none;
  }
}
</style>
