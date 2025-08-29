// src/config/graphics.js
// グラフィクス系の設定値（PS1 風の表現など）

export const GRAPHICS = {
  PS1_MODE: true,       // PS1 風レンダリングを有効にするか
  AFFINE_STRENGTH: 0.65, // アフィン歪みの強さ 0.0–1.0
  INTERNAL_SCALE: 0.5,  // 内部レンダリング解像度のスケール
  FIXED_FPS: 30,        // 固定ステップの FPS
  RGB_BITS: 3,          // 量子化用の RGB ビット数

  // 色収差 (Chromatic Aberration)
  CA_ENABLED: true,     // 色収差を有効化
  CA_STRENGTH: 50,      // 色収差の強さ（0.3–1.2 目安）
  CA_POWER: 2.25        // 中心からの離れ方の指数（1.5–2.5）
};

export default GRAPHICS;

