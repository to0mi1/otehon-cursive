import { computed, readonly, ref } from 'vue'

export type Theme = 'light' | 'dark'
export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'otehon-cursive:theme'

// モジュールスコープで状態を共有し、どのコンポーネントから使っても同じテーマになる。
const preference = ref<ThemePreference>('system')
const systemPrefersDark = ref(false)
let initialized = false

function readStoredPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* localStorage 不可の環境は無視 */
  }
  return 'system'
}

// 実際に適用される見た目（system の場合は OS 設定に従う）。
const theme = computed<Theme>(() =>
  preference.value === 'system'
    ? systemPrefersDark.value
      ? 'dark'
      : 'light'
    : preference.value,
)

function applyToDocument() {
  const el = document.documentElement
  if (preference.value === 'system') delete el.dataset.theme
  else el.dataset.theme = preference.value
}

function initTheme() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  preference.value = readStoredPreference()
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  systemPrefersDark.value = mql.matches
  mql.addEventListener('change', (e) => (systemPrefersDark.value = e.matches))
  applyToDocument()
}

function setPreference(p: ThemePreference) {
  preference.value = p
  try {
    localStorage.setItem(STORAGE_KEY, p)
  } catch {
    /* ignore */
  }
  applyToDocument()
}

// 現在の見た目を反転して明示指定する（トグルボタン用）。
function toggleTheme() {
  setPreference(theme.value === 'dark' ? 'light' : 'dark')
}

export function useTheme() {
  initTheme()
  return {
    theme: readonly(theme),
    preference: readonly(preference),
    setPreference,
    toggleTheme,
  }
}
