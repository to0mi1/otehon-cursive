/**
 * Canvas 描画のレイアウト・チューニング定数。
 * グリフ自体の縦メトリクス（ascender/xHeight 等）は
 * data/glyphs.generated.ts の GLYPH_METRICS を使う。ここは見た目の調整値。
 * 値はすべて「em 相当（= フォントの unitsPerEm を 1 とした比率）」で持ち、
 * 描画時に実ピクセルへスケールする。
 */
export const LAYOUT = {
  /** 行間 = 1em に対する比率（複数行の縦の隙間） */
  lineGapEm: 0.35,
  /** 描画領域の左右パディング（em 相当） */
  sidePaddingEm: 0.4,
  /** 描画領域の上下パディング（em 相当） */
  verticalPaddingEm: 0.25,
  /** お手本の線の太さ（em 相当） */
  strokeWidthEm: 0.05,
  /** 書き順アニメのペン先マーカー半径（em 相当） */
  penMarkerRadiusEm: 0.07,
} as const

/** 罫線の見た目（色はテーマパレット側で決定） */
export const GUIDE = {
  /** ミッドライン（x-height）の破線パターン（em 相当） */
  midlineDashEm: [0.18, 0.14],
  /** ベースライン（濃い実線）の太さ（em 相当） */
  baselineWidthEm: 0.025,
  /** アセンダ／ディセンダ（薄い実線）の太さ（em 相当） */
  thinWidthEm: 0.016,
} as const
