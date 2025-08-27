// src/core/renderer.js
// レンダラー生成とキャンバスサイズ合わせ処理
/**
 * WebGLRenderer を初期化。
 * @param {typeof import('three')} THREE three 名前空間
 * @param {HTMLCanvasElement} canvas 描画先キャンバス
 * @param {object} cfg 設定値
 * @param {object} [opts] WebGLRenderer へ渡す追加オプション
 * @returns {THREE.WebGLRenderer}
 */
export function createRenderer(THREE, canvas, cfg, opts = {})
{
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, ...opts, canvas });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  fitToCanvas(renderer, canvas, cfg);
  return renderer;
}

/**
 * Canvas の見た目サイズに合わせてレンダラーを調整。
 * @param {THREE.WebGLRenderer} renderer 対象レンダラー
 * @param {HTMLCanvasElement} canvas 対象キャンバス
 * @param {object} cfg 設定値
 */
export function fitToCanvas(renderer, canvas, cfg)
{
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, rect.width | 0);
  const h = Math.max(1, rect.height | 0);
  if (cfg.PS1_MODE)
  {
    renderer.setPixelRatio(1);
    renderer.setSize((w * cfg.INTERNAL_SCALE) | 0, (h * cfg.INTERNAL_SCALE) | 0, false);
    renderer.domElement.style.imageRendering = "pixelated";
  }
  else
  {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.domElement.style.imageRendering = "";
  }
}
