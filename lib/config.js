// lib/config.js
// PS1 風レンダリングのための各種設定値
export const CONFIG = {
  PS1_MODE: true, // PS1 表現を有効にするか
  AFFINE_STRENGTH: 0.65, // アフィン補間の強さ 0.0〜1.0
  INTERNAL_SCALE: 0.5, // 内部レンダリング解像度倍率
  FIXED_FPS: 30, // 固定ステップのFPS
  RGB_BITS: 3, // 減色時のRGB各チャネルビット数

  // 色収差（Chromatic Aberration）
  CA_ENABLED: true, // 色収差を有効化
  CA_STRENGTH: 50, // 色ずれの強さ（0.3〜1.2 目安）
  CA_POWER: 2.25 // 端ほど強くする増幅の指数（1.5〜2.5）
};
