import type { Theme } from '../composables/useTheme'

/**
 * 万年筆の定番インク色。
 * お手本の線色として切り替えられる。
 * ダーク背景では暗いインク（ブルーブラック等）が沈むため、
 * テーマ別に視認性を確保した表示色（light / dark）を持たせる。
 */
export interface InkColor {
  id: string
  name: string /** 日本語表示名 */
  swatch: string /** パレット見本に使う代表色（テーマ非依存） */
  light: string /** ライト背景での線色 */
  dark: string /** ダーク背景での線色 */
}

export const INKS: InkColor[] = [
  { id: 'blue-black', name: 'ブルーブラック', swatch: '#26374f', light: '#1c2d49', dark: '#8fb2e2' },
  { id: 'black', name: 'ブラック', swatch: '#1c1c1c', light: '#1a1a1a', dark: '#e8e8ea' },
  { id: 'royal-blue', name: 'ロイヤルブルー', swatch: '#1d4ed8', light: '#1c47b8', dark: '#7ba6f2' },
  { id: 'turquoise', name: 'ターコイズ', swatch: '#0e8fa1', light: '#0d7f90', dark: '#4fd3e0' },
  { id: 'green', name: 'グリーン', swatch: '#1f7a4d', light: '#1c6b45', dark: '#5fc088' },
  { id: 'wine-red', name: 'ワインレッド', swatch: '#8a2540', light: '#7a2338', dark: '#e58097' },
  { id: 'sepia', name: 'セピア', swatch: '#6b4423', light: '#5a3a22', dark: '#ca9c74' },
  { id: 'violet', name: 'バイオレット', swatch: '#6d3ba8', light: '#5c3a94', dark: '#b892e8' },
]

/** 既定はブルーブラック */
export const DEFAULT_INK_ID = 'blue-black'

export function getInk(id: string): InkColor {
  return INKS.find((i) => i.id === id) ?? INKS[0]
}

/** テーマに応じた実際の描画色を返す */
export function inkStroke(ink: InkColor, theme: Theme): string {
  return theme === 'dark' ? ink.dark : ink.light
}
