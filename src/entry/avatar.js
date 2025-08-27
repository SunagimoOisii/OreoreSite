// avatar.js
// three.js アバター表示のエントリーポイント
// - レンダラー・シーングラフ・操作系・ポスト処理を初期化
// - ブートオーバーレイとリサイズ処理を管理
import * as THREE from "three";
const { BoxGeometry, TetrahedronGeometry, SphereGeometry, TorusGeometry } = THREE;

import { CONFIG } from "../core/config.js";
import { createControls } from "../core/controls.js";
import { createPostPipeline } from "../core/postprocess.js";
import { createRenderer, setupResize } from "../core/renderer.js";
import { createSceneGraph } from "../core/scene.js";
import { applyPS1Jitter, runFixedStepLoop } from "../core/utils.js";
import { initBootOverlay } from "../core/boot-overlay.js";

const canvas = document.getElementById("avatar-canvas");
const renderer = createRenderer(THREE, canvas, CONFIG);
const { scene, camera, avatarMesh, tex, baseSize } = createSceneGraph(THREE, CONFIG);
const controls = createControls(THREE, camera, renderer.domElement, CONFIG);
const post = createPostPipeline(THREE, renderer, CONFIG); // { render(scene,camera), resize() }

// ブートオーバーレイ初期化
initBootOverlay();

// リサイズ処理の設定
setupResize(renderer, canvas, camera, CONFIG, post);

const shapeButtons = document.querySelectorAll(".avatar-shapes button");
shapeButtons.forEach(btn =>
{
  btn.addEventListener("click", () =>
  {
    changeAvatarShape(btn.dataset.shape);
  });
});

function changeAvatarShape(type)
{
  avatarMesh.geometry.dispose();

  let geo;
  switch (type)
  {
    case "cube":
      geo = new BoxGeometry(baseSize, baseSize, baseSize);
      break;
    case "tetra":
      geo = new TetrahedronGeometry(baseSize * Math.sqrt(3 / 8));
      break;
    case "sphere":
      geo = new SphereGeometry(baseSize / 2, 16, 12);
      break;
    case "torus":
      geo = new TorusGeometry(baseSize * 0.35, baseSize * 0.15, 16, 48);
      break;
    default:
      geo = new BoxGeometry(baseSize, baseSize, baseSize);
  }

  avatarMesh.geometry = geo;
}

// ループ（PS1_MODE に合わせて分岐）
const ROT_SPEED = 0.007 * 60;
if (CONFIG.PS1_MODE)
{
  const STEP = 1000 / CONFIG.FIXED_FPS;
  runFixedStepLoop(
    STEP,
    (dt) =>
    {
      avatarMesh.rotation.y += ROT_SPEED * dt;
      applyPS1Jitter(THREE, camera, avatarMesh, CONFIG);
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
      avatarMesh.rotation.y += 0.007 * 60 * dt;
    },
    () =>
    {
      renderer.render(scene, camera); // 直接描画
      controls.update();
    }
  );
}
