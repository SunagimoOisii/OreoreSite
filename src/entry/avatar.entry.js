// avatar.entry.js
// three.js アバターのエントリ: ブート表示→初期化→更新ループを起動
import * as THREE from "three";

import { GRAPHICS as CONFIG } from "@config/graphics.js";
import { createThreeApp } from "@core/app.js";
import { createAvatarMesh, changeAvatarShape, createAvatarExplosion, createAvatarUpdater } from "@features/avatar/index.js";
import { initBootOverlay } from "@features/boot/overlay.js";

const canvas = document.getElementById("avatar-canvas");

// 初期化時に必要なハンドル
let explosion, updater, avatarMesh, baseSize;

createThreeApp(THREE, {
  canvas,
  cfg: CONFIG,
  fixedStep: CONFIG.PS1_MODE ? (1000 / CONFIG.FIXED_FPS) : 0,
  useControls: true,
  usePost: CONFIG.PS1_MODE,
  init: ({ scene, camera }) =>
  {
    // ブートオーバーの初期化
    initBootOverlay();

    // アバターメッシュを作成して追加
    const created = createAvatarMesh(THREE, CONFIG);
    avatarMesh = created.mesh;
    baseSize = created.baseSize;
    scene.add(avatarMesh);

    // 爆発/更新のセットアップ
    explosion = createAvatarExplosion(THREE, scene, avatarMesh, baseSize);
    updater = createAvatarUpdater(THREE, camera, avatarMesh, CONFIG, explosion);

    // UI バインド（形状ボタンとクリック反応）
    const shapeButtons = document.querySelectorAll(".avatar-shapes button");
    const aboutCard = document.querySelector('.profile');
    function triggerAboutLoadingBar()
    {
      if (!aboutCard) return;
      aboutCard.classList.remove('loading');
      void aboutCard.offsetWidth;
      aboutCard.classList.add('loading');
      setTimeout(() => aboutCard.classList.remove('loading'), 1400);
    }
    shapeButtons.forEach(btn =>
    {
      btn.addEventListener("click", () =>
      {
        explosion.restore();
        updater.setRotating(true);
        changeAvatarShape(THREE, avatarMesh, baseSize, btn.dataset.shape);
        triggerAboutLoadingBar();
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
  },
  update: (dt) => { if (updater) updater.update(dt); },
});

