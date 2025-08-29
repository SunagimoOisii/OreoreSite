// avatar.js
// three.js アバターのエントリ: 共通ブートで初期化～ループを構築
import * as THREE from "three";

import { CONFIG } from "../core/config.js";
import { createThreeApp } from "../core/app.js";
import { createAvatarMesh, changeAvatarShape } from "../features/avatar/mesh.js";
import { createAvatarExplosion } from "../features/avatar/explode.js";
import { createAvatarUpdater } from "../features/avatar/update.js";
import { initBootOverlay } from "../features/boot/overlay.js";

const canvas = document.getElementById("avatar-canvas");

// アプリ共通ブートで初期化～ループまで実行
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

    // UI バインド（形状ボタンとクリック爆発）
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
  },
  update: (dt) => { if (updater) updater.update(dt); },
});

