/** 単語・例文のプリセット（改行を含む複数行テキストも可） */
export interface WordPreset {
  label: string
  text: string
}

export const WORD_PRESETS: WordPreset[] = [
  { label: 'cat', text: 'cat' },
  { label: 'dog', text: 'dog' },
  { label: 'love', text: 'love' },
  { label: 'happy', text: 'happy' },
  { label: 'school', text: 'school' },
  { label: 'Hello', text: 'Hello' },
  { label: 'Thank you', text: 'Thank you' },
  { label: 'Good job', text: 'Good job' },
  { label: 'My name is', text: 'My name is' },
  { label: 'アルファベット', text: 'abcdefghij\nklmnopqrst\nuvwxyz' },
  { label: '例文（パングラム）', text: 'The quick brown fox\njumps over the lazy dog' },
]

/** 起動時の既定テキスト */
export const DEFAULT_TEXT = 'a'
