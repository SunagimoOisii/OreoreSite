// avatar.js
// three.js アバター表示のエントリーポイント
// - レンダラー・シーングラフ・操作系・ポスト処理を初期化
// - ブートオーバーレイとリサイズ処理を管理
import * as THREE from "three";

import { CONFIG } from "../core/config.js";
import { createControls } from "../core/controls.js";
import { createPostPipeline } from "../core/postprocess.js";
import { createRenderer, setupResize } from "../core/renderer.js";
import { createSceneGraph } from "../core/scene.js";
import { applyPS1Jitter, runFixedStepLoop } from "../core/utils.js";
import { initBootOverlay } from "../core/boot-overlay.js";

const canvas = document.getElementById("avatar-canvas");
const renderer = createRenderer(THREE, canvas, CONFIG);
const { scene, camera, cube } = createSceneGraph(THREE, CONFIG);
const controls = createControls(THREE, camera, renderer.domElement, CONFIG);
const post = createPostPipeline(THREE, renderer, CONFIG); // { render(scene,camera), resize() }

// ブートオーバーレイ初期化
initBootOverlay();

// リサイズ処理の設定
setupResize(renderer, canvas, camera, CONFIG, post);

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
