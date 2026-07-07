import { defineConfig } from 'vitest/config'

// 純関数（幾何・レイアウト・データ）のユニットテスト用。
// DOM 不要なので node 環境で実行する。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
