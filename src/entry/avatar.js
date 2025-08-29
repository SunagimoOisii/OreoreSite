// avatar.js
// three.js アバターのエントリ: シーン土台・メッシュ・爆散・ループをまとめて初期化
import * as THREE from "three";

import { CONFIG } from "../core/config.js";
import { createControls } from "../core/controls.js";
import { createPostPipeline } from "../effects/postprocess.js";
import { createRenderer, setupResize } from "../core/renderer.js";
import { createSceneBase } from "../core/scene.js";
import { createAvatarMesh, changeAvatarShape } from "../features/avatar/mesh.js";
import { createAvatarExplosion } from "../features/avatar/explode.js";
import { createAvatarUpdater } from "../features/avatar/update.js";
import { runFixedStepLoop } from "../core/loop.js";
import { initBootOverlay } from "../features/boot/overlay.js";

const canvas = document.getElementById("avatar-canvas");
const renderer = createRenderer(THREE, canvas, CONFIG);
const { scene, camera } = createSceneBase(THREE, CONFIG);

// アバターメッシュを生成してシーンに追加
const { mesh: avatarMesh, baseSize, texture: tex } = createAvatarMesh(THREE, CONFIG);
scene.add(avatarMesh);

const controls = createControls(THREE, camera, renderer.domElement, CONFIG);
const post = createPostPipeline(THREE, renderer, CONFIG);

// ブート演出の初期化
initBootOverlay();

// リサイズ連動の設定
setupResize(renderer, canvas, camera, CONFIG, post);

// 爆散制御と更新処理の用意
const explosion = createAvatarExplosion(THREE, scene, avatarMesh, baseSize);
const updater = createAvatarUpdater(THREE, camera, avatarMesh, CONFIG, explosion);

// UI バインド（形状ボタンとクリック爆散）
const shapeButtons = document.querySelectorAll(".avatar-shapes button");
shapeButtons.forEach(btn =>
{
  btn.addEventListener("click", () =>
  {
    explosion.restore();
    updater.setRotating(true);
    changeAvatarShape(THREE, avatarMesh, baseSize, btn.dataset.shape);
  });
});

canvas.addEventListener("click", () =>
{
  if (!explosion.isExploded())
  {
    explosion.explode();
    updater.setRotating(false);
  }
});

// ループ
const updateAvatar = (dt) => updater.update(dt);

if (CONFIG.PS1_MODE)
{
  const STEP = 1000 / CONFIG.FIXED_FPS;
  runFixedStepLoop(
    STEP,
    (dt) => updateAvatar(dt),
    () => { post.render(scene, camera); controls.update(); }
  );
}
else
{
  runFixedStepLoop(
    0,
    (dt) => updateAvatar(dt),
    () => { renderer.render(scene, camera); controls.update(); }
  );
}
