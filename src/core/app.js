// src/core/app.js
// three.js アプリの共通ブートストラップ（renderer/scene/camera/loop/resize）

import { createRenderer, setupResize } from "@core/renderer.js";
import { createSceneBase } from "@core/scene.js";
import { runFixedStepLoop } from "@core/loop.js";
import { createControls } from "@core/controls.js";
import { createPostPipeline } from "@effects/index.js";

/**
 * three.js アプリの初期化と実行をまとめます。
 * - 可変/固定ステップのメインループ
 * - OrbitControls/ポストプロセスの有効化
 * - リサイズ対応
 *
 * @param {typeof import('three')} THREE
 * @param {Object} options
 * @param {HTMLCanvasElement} options.canvas - ターゲットのキャンバス
 * @param {object} options.cfg - 設定（PS1_MODE など）
 * @param {number} [options.fixedStep=0] - 固定ステップ(ms)。0 で可変
 * @param {boolean} [options.useControls=false] - OrbitControls を使うか
 * @param {boolean} [options.usePost=false] - ポストプロセスを使うか
 * @param {object} [options.rendererOpts] - WebGLRenderer 追加オプション
 * @param {(ctx:{scene:import('three').Scene,camera:import('three').Camera,renderer:import('three').WebGLRenderer,controls?:any,post?:{render:Function,resize:Function}})=>void|{dispose?:Function}} [options.init]
 * @param {(dt:number)=>void} [options.update] - 毎フレーム更新（秒）
 * @param {(ctx:{renderer:import('three').WebGLRenderer,scene:import('three').Scene,camera:import('three').Camera,controls?:any,post?:{render:Function,resize:Function}})=>void} [options.render]
 * @param {(THREE:typeof import('three'), cfg:object)=>{scene:import('three').Scene,camera:import('three').Camera}} [options.createScene]
 * @returns {{ dispose: () => void }}
 */
export function createThreeApp(THREE, options)
{
  const {
    canvas,
    cfg,
    fixedStep = 0,
    useControls = false,
    usePost = false,
    rendererOpts = {},
    init,
    update,
    render,
    createScene
  } = options;

  const renderer = createRenderer(THREE, canvas, cfg, rendererOpts);
  const { scene, camera } = (typeof createScene === 'function')
    ? createScene(THREE, cfg)
    : createSceneBase(THREE, cfg);

  const controls = useControls ? createControls(THREE, camera, renderer.domElement, cfg) : undefined;
  const post = usePost ? createPostPipeline(THREE, renderer, cfg) : undefined;

  // リサイズ設定
  const cleanupResize = setupResize(renderer, canvas, camera, cfg, post);

  const ctx = { scene, camera, renderer, controls, post };
  const initResult = typeof init === 'function' ? (init(ctx) || {}) : {};

  const doRender = () =>
  {
    if (typeof render === 'function')
    {
      render(ctx);
    }
    else
    {
      if (post) post.render(scene, camera);
      else renderer.render(scene, camera);
      if (controls && typeof controls.update === 'function') controls.update();
    }
  };

  const stepMs = (fixedStep && fixedStep > 0) ? fixedStep : 0;
  const loop = runFixedStepLoop(stepMs, (dt) => { if (update) update(dt); }, doRender);

  function dispose()
  {
    try { cleanupResize?.(); } catch { /* noop */ }
    try { loop.dispose?.(); } catch { /* noop */ }
    try { initResult.dispose?.(); } catch { /* noop */ }
    try { controls?.dispose?.(); } catch { /* noop */ }
    try { renderer?.dispose?.(); } catch { /* noop */ }
  }

  return { dispose };
}
