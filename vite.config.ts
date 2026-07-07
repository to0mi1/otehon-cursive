import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages（プロジェクトページ）で配信するためのベースパス
  base: '/otehon-cursive/',
  plugins: [vue()],
})
