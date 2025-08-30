// src/features/background/config.js
// 背景機能のローカル設定（描画系とは分離）

export const BACKGROUND_DEFAULTS = Object.freeze({
  FPS: Object.freeze({ poly: 20, grid: 24, inner: 15 }),
  INST_MAX: 120,
  INNER_Y_OFFSET: 1.0,
});

export default BACKGROUND_DEFAULTS;

