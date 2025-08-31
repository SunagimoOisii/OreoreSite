// avatar.entry.js
// three.js アバターのエントリ: ブート表示→初期化→更新ループを起動（再初期化に対応）
import * as THREE from "three";

import { GRAPHICS as CONFIG } from "@config/graphics.js";
import { createThreeApp } from "@core/app.js";
import { createAvatarMesh, changeAvatarShape, createAvatarExplosion, createAvatarUpdater } from "@features/avatar/index.js";
import { initBootOverlay } from "@features/boot/overlay.js";
import { onRetroChanged, getRetroEnabled } from "@core/state.js";
import { retriggerClass } from "../utils/dom.js";

// three.js でアバターを描画し、UI と簡単なインタラクションを結び付けるエントリ。
const canvas = document.getElementById("avatar-canvas");

// 定数（マジックナンバーを避ける）
const ABOUT_LOADING_MS = 1400;

// 再初期化用のハンドル群
let appHandle = null;
let explosion, updater, avatarMesh, baseSize, avatarTexture;
let bootInitialized = false;
let uiBound = false;

function bindUIOnce()
{
  if (uiBound) return;
  uiBound = true;
  const shapeButtons = document.querySelectorAll(".avatar-shapes button");
  const aboutCard = document.querySelector('.profile');
  function triggerAboutLoadingBar()
  {
    retriggerClass(aboutCard, 'loading', ABOUT_LOADING_MS);
  }
  shapeButtons.forEach(btn =>
  {
    btn.addEventListener("click", () =>
    {
      if (!explosion || !updater) return;
      explosion.restore();
      updater.setRotating(true);
      changeAvatarShape(THREE, avatarMesh, baseSize, btn.dataset.shape);
      triggerAboutLoadingBar();
    });
  });

  canvas.addEventListener("click", () =>
  {
    if (!explosion) return;
    if (!explosion.isExploded())
    {
      explosion.explode();
      updater?.setRotating(false);
    }
  });
}

function launchAvatar(ps1Enabled)
{
  // 既存ループを破棄
  try { appHandle?.dispose?.(); } catch {}
  appHandle = null;

  // 参照をクリア
  explosion = undefined; updater = undefined; avatarMesh = undefined; baseSize = undefined;

  const cfg = { ...CONFIG, PS1_MODE: !!ps1Enabled, CA_ENABLED: ps1Enabled ? CONFIG.CA_ENABLED : false };

  appHandle = createThreeApp(THREE, {
    canvas,
    cfg,
    fixedStep: cfg.PS1_MODE ? (1000 / CONFIG.FIXED_FPS) : 0,
    useControls: true,
    usePost: cfg.PS1_MODE,
    init: ({ scene, camera }) =>
    {
      // ブートオーバーレイは初回のみ
      if (!bootInitialized)
      {
        initBootOverlay();
        bootInitialized = true;
      }

      // アバターメッシュを作成して追加（cfg に応じたマテリアル）
      const created = createAvatarMesh(THREE, cfg, avatarTexture);
      avatarMesh = created.mesh;
      baseSize = created.baseSize;
      avatarTexture = created.texture;
      scene.add(avatarMesh);

      // 物理/更新のセットアップ
      explosion = createAvatarExplosion(THREE, scene, avatarMesh, baseSize);
      updater = createAvatarUpdater(THREE, camera, avatarMesh, cfg, explosion);

      // UI は一度だけバインドし、最新の参照を使う
      bindUIOnce();
    },
    update: (dt) => { if (updater) updater.update(dt); },
  });
}

// 初期起動（CONFIG をそのまま尊重）
launchAvatar(!!CONFIG.PS1_MODE);

// レトロ効果の全無効化イベントで再初期化（ポストプロセス含む完全OFF）
// Retro状態の変化でアバターを再初期化
onRetroChanged((enabled) =>
{
  if (!enabled) document.body.classList.add('no-ps1');
  launchAvatar(!!enabled);
});
