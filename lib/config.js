export const CONFIG = {
  PS1_MODE: true,
  AFFINE_STRENGTH: 0.65,
  INTERNAL_SCALE: 0.5,   // PS1時の内部解像度倍率
  FIXED_FPS: 30,
  RGB_BITS: 3,

  //色収差（Chromatic Aberration）
  CA_ENABLED: true,
  CA_STRENGTH: 50, // 強さ（0.3〜1.2 目安）
  CA_POWER: 2.25      // 端ほど強くする増幅の指数（1.5〜2.5）
};
