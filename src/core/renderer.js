// src/core/renderer.js
// レンダラー生成とキャンバスサイズ合わせ

/**
 * WebGLRenderer を生成します。
 * @param {typeof import('three')} THREE three オブジェクト
 * @param {HTMLCanvasElement} canvas 描画キャンバス
 * @param {object} cfg 設定
 * @param {object} [opts] WebGLRenderer 追加オプション
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
 * Canvas の見た目サイズに合わせてレンダラーを設定します。
 * @param {THREE.WebGLRenderer} renderer 対象レンダラー
 * @param {HTMLCanvasElement} canvas 対象キャンバス
 * @param {object} cfg 設定
 */
export function fitToCanvas(renderer, canvas, cfg)
{
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, rect.width | 0);
  const h = Math.max(1, rect.height | 0);
  if (cfg.RETRO_MODE)
  {
    renderer.setPixelRatio(1);
    const sw = Math.max(1, Math.floor(w * cfg.INTERNAL_SCALE));
    const sh = Math.max(1, Math.floor(h * cfg.INTERNAL_SCALE));
    renderer.setSize(sw, sh, false);
    renderer.domElement.style.imageRendering = "pixelated";
  }
  else
  {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.domElement.style.imageRendering = "";
  }
}

/**
 * リサイズイベントを設定し、レンダラー・カメラ・ポスト処理を更新します。
 * @param {THREE.WebGLRenderer} renderer 対象レンダラー
 * @param {HTMLCanvasElement} canvas 対象キャンバス
 * @param {THREE.Camera} camera 対象カメラ
 * @param {object} cfg 設定
 * @param {{resize:function(THREE.WebGLRenderer):void}} [post] ポスト処理パイプライン
 */
export function setupResize(renderer, canvas, camera, cfg, post)
{
  function onResize()
  {
    fitToCanvas(renderer, canvas, cfg);
    if (post && typeof post.resize === "function")
    {
      post.resize(renderer);
    }
    const rect = canvas.getBoundingClientRect();
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", onResize);
  onResize();

  // cleanup を返して、dispose 時にリスナーを解除できるようにする
  return function cleanupResize()
  {
    try { window.removeEventListener("resize", onResize); } catch { /* noop */ }
  };
}
