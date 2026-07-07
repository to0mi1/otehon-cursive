# 筆記体れんしゅう (otehon-cursive)

英語の筆記体（cursive）を練習するためのお手本サイト。PC・タブレット・スマートフォンに対応し、GitHub Pages で公開できます。

## 機能

- **書き順アニメーション**: ペンが動く様子を再現（再生 / 一時停止 / 速度調整 / ペン先表示）
- **お手本表示**: 4 本罫線つきの静的お手本
- **なぞり書き練習**: お手本を下敷きに、マウス・タッチ・ペンでなぞる（やり直し / 消去、筆圧対応）
- **印刷用練習シート**: A4 縦・4 本罫線のシートを印刷（行数・お手本の有無を選択可）
- **対象文字**: 小文字 a–z / 大文字 A–Z / 数字 0–9 /（複数行対応の）単語・文の自由入力
- **万年筆インク色**: ブルーブラックほか定番色を切り替え
- **ダークモード**: システム連動＋手動トグル

## 技術メモ

- 画面描画はすべて **Canvas**（フォント非依存で Windows でも綺麗）。印刷のみ SVG。
- お手本は **単線（1 本のペン軌跡）データ**を採用し、書き順アニメの二重線問題を回避。
- 罫線位置は **フォントメトリクス**（ascender / x-height / baseline / descender）から算出。
- データは `scripts/gen-glyphs.mjs` で生成し `src/data/glyphs.generated.ts` にコミット済み（本番実行時にフォント/生成ライブラリは不要）。

## 開発

```bash
npm install
npm run dev          # 開発サーバー
npm run build        # 型チェック + 本番ビルド
npm run test:run     # ユニットテスト（幾何・レイアウト・データ）
npm run gen:glyphs   # グリフデータの再生成（必要時のみ）
```

## GitHub Pages へのデプロイ

1. このリポジトリを GitHub に push（ブランチ `main`）。
2. リポジトリの **Settings → Pages → Source** を「GitHub Actions」に設定。
3. `.github/workflows/deploy.yml` が自動でビルド＆デプロイ。
4. 公開 URL: `https://<ユーザー名>.github.io/otehon-cursive/`

> リポジトリ名を変更する場合は `vite.config.ts` の `base`（現在 `/otehon-cursive/`）も合わせて変更してください。

## ライセンス

お手本フォントは **Hershey Script 1-stroke（Hershey Fonts, パブリックドメイン相当）** を使用。
詳細・謝辞は `scripts/font/` 内のライセンスファイルを参照してください。
