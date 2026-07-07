/**
 * お手本メーカーで選べる筆記体・手書き Web フォント。
 * すべて Google Fonts の OFL ライセンス。index.html で読み込む。
 * カテゴリで絞り込めるようにして、画面の占有を抑える。
 */
export type FontCategory = 'script' | 'casual' | 'learning'

export interface HandFont {
  id: string
  name: string /** 表示名（＝フォント名） */
  family: string /** CSS font-family */
  category: FontCategory
}

export const FONT_CATEGORIES: { id: FontCategory; label: string }[] = [
  { id: 'script', label: 'エレガント' },
  { id: 'casual', label: 'カジュアル' },
  { id: 'learning', label: '学習用' },
]

const f = (id: string, name: string, category: FontCategory): HandFont => ({
  id,
  name,
  family: `'${name}', cursive`,
  category,
})

export const FONTS: HandFont[] = [
  // オシャレ（筆記体・スクリプト）
  f('dancing', 'Dancing Script', 'script'),
  f('great-vibes', 'Great Vibes', 'script'),
  f('sacramento', 'Sacramento', 'script'),
  f('parisienne', 'Parisienne', 'script'),
  f('allura', 'Allura', 'script'),
  f('pacifico', 'Pacifico', 'script'),
  f('petit', 'Petit Formal Script', 'script'),
  f('tangerine', 'Tangerine', 'script'),
  f('pinyon', 'Pinyon Script', 'script'),
  f('alex-brush', 'Alex Brush', 'script'),
  f('cookie', 'Cookie', 'script'),
  f('satisfy', 'Satisfy', 'script'),
  f('yellowtail', 'Yellowtail', 'script'),
  // カジュアル（ラフな手書き）
  f('caveat', 'Caveat', 'casual'),
  f('shadows', 'Shadows Into Light', 'casual'),
  f('indie', 'Indie Flower', 'casual'),
  f('architects', 'Architects Daughter', 'casual'),
  f('gochi', 'Gochi Hand', 'casual'),
  f('patrick', 'Patrick Hand', 'casual'),
  // 学習用（教科書・鉛筆風の読みやすい手書き）
  f('homemade', 'Homemade Apple', 'learning'),
  f('schoolbell', 'Schoolbell', 'learning'),
  f('coming-soon', 'Coming Soon', 'learning'),
  f('kalam', 'Kalam', 'learning'),
  f('reenie', 'Reenie Beanie', 'learning'),
]

export const DEFAULT_FONT_ID = 'dancing'

export function getFont(id: string): HandFont {
  return FONTS.find((font) => font.id === id) ?? FONTS[0]
}

export function fontsByCategory(category: FontCategory): HandFont[] {
  return FONTS.filter((font) => font.category === category)
}
