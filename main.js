// main.js
// three.js アバター表示のエントリーポイント
// - レンダラー・シーングラフ・操作系・ポスト処理を初期化
// - ブートオーバーレイとリサイズ処理を管理
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

import { CONFIG } from "./lib/config.js";
import { createControls } from "./lib/controls.js";
import { createPostPipeline } from "./lib/postprocess.js";
import { createRenderer,
  fitToCanvas } from "./lib/renderer.js";
import { createSceneGraph } from "./lib/scene.js";
import { applyPS1Jitter, runFixedStepLoop } from "./lib/utils.js";
import { initBootOverlay } from "./lib/bootOverlay.js";

const canvas = document.getElementById("avatar-canvas");
const renderer = createRenderer(THREE, canvas, CONFIG);
const { scene, camera, cube } = createSceneGraph(THREE, CONFIG);
const controls = createControls(THREE, camera, renderer.domElement, CONFIG);
const post = createPostPipeline(THREE, renderer, CONFIG); // { render(scene,camera), resize() }

// ブートオーバーレイ初期化
initBootOverlay();

/**
 * Canvas サイズに合わせてレンダラー・ポスト処理・カメラを調整。
 */
function resize()
{
  fitToCanvas(renderer, canvas, CONFIG);
  post.resize(renderer);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

// ループ（PS1_MODE に合わせて分岐）
const ROT_SPEED = 0.007 * 60;
if (CONFIG.PS1_MODE)
{
  const STEP = 1000 / CONFIG.FIXED_FPS;
  runFixedStepLoop(
    STEP,
    (dt) =>
    {
      cube.rotation.y += ROT_SPEED * dt;
      applyPS1Jitter(THREE, camera, cube, CONFIG);
    },
    () =>
    {
      post.render(scene, camera);
      controls.update();
    }
  );
}
else
{
  runFixedStepLoop(
    0,
    (dt) =>
    {
      cube.rotation.y += 0.007 * 60 * dt;
    },
    () =>
    {
      renderer.render(scene, camera); // 直接描画
      controls.update();
    }
  );
}
