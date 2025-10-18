// src/config/graphics.js
// グラフィックス系の設定値（レトロ調の表現など）

export const GRAPHICS = {
  RETRO_MODE: true,       // レトロ調レンダリングを有効にするか
  AFFINE_STRENGTH: 0.65, // 擬似アフィン補間の強度 0.0〜1.0
  INTERNAL_SCALE: 0.5,   // レトロ調レンダリング用の内部スケール
  FIXED_FPS: 30,         // 固定ステップ用の FPS
  RGB_BITS: 3,           // 量子化に使う RGB ビット数

  // 色収差 (Chromatic Aberration)
  CA_ENABLED: true,      // 色収差を有効にするか
  CA_STRENGTH: 50,       // 色収差の強度（0.3〜1.2 推奨）
  CA_POWER: 2.25         // 周辺部での増幅度の制御（1.5〜2.5）
};

export default GRAPHICS;

