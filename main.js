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

const canvas = document.getElementById("avatar-canvas");
const renderer = createRenderer(THREE, canvas, CONFIG);
const { scene, camera, cube } = createSceneGraph(THREE, CONFIG);
const controls = createControls(THREE, camera, renderer.domElement, CONFIG);
const post = createPostPipeline(THREE, renderer, CONFIG); // { render(scene,camera), resize() }

// ===== Boot Overlay Control (MIN_MS + Progress + WAAPI Fade) =====
(function initBootOverlay() {
  const overlay = document.getElementById('boot-overlay');
  if (!overlay)
    return;

  const skipBtn = document.getElementById('boot-skip');
  const bar = overlay.querySelector('.boot-progress__bar');

  // 進捗バー
  const progress = {
    val: 0,
    set(x) {
      this.val = Math.max(0, Math.min(100, x | 0));
      if (bar)
      {
        bar.style.width = this.val + '%';
        bar.parentElement?.setAttribute('aria-valuenow', String(this.val));
      }
    }
  };

  // ゲート条件
  const MIN_MS = 2400; // ← 最低表示時間(ここを好みで)
  const MAX_MS = 6500; // ← フォールバック上限
  let minElapsed = false, loaded = false, finished = false;
  let maxTimer = null;

  function maybeClose()
  {
    if (!finished && minElapsed && loaded)
      closeOverlay();
  }

  // ★ フェードは WAAPI で必ず発動させる
  function closeOverlay()
  {
    if (finished)
      return;
    finished = true;
    if (maxTimer)
      clearTimeout(maxTimer);

    // ここで CSS に依存しないアニメを走らせる
    const anim = overlay.animate(
        [ { opacity: 1 }, { opacity: 0 } ],
        { duration: 450, easing: 'ease', fill: 'forwards' } // ← 秒数はここで
    );

    // 正常系: アニメ終了で除去
    anim.addEventListener('finish', () => overlay.remove());

    // 非常系: 何かで止まっても除去
    setTimeout(() => { if (overlay.isConnected) overlay.remove(); }, 800);
  }

  // 体感用の自走プログレス(実読込とは独立)
  const startTs = performance.now();
  const TARGET = 90;
  const DURATION = Math.max(1000, Math.floor(MIN_MS * 0.9));
  (function tick() {
    if (finished)
      return;
    const t = Math.min(1, (performance.now() - startTs) / DURATION);
    const eased = 1 - Math.pow(1 - t, 2); // ease-out
    progress.set(Math.floor(TARGET * eased));
    if (t < 1)
      requestAnimationFrame(tick);
  })();

  // MIN_MS 経過でゲート開放
  setTimeout(() => { minElapsed = true; maybeClose(); }, MIN_MS);

  // 実ロード完了で100%
  function markLoaded()
  {
    if (finished)
      return;
    loaded = true;
    progress.set(100);
    setTimeout(maybeClose, 150); // 少し達成感を見せてから
  }
  if (document.readyState === 'complete')
    markLoaded();
  else
    window.addEventListener('load', markLoaded, { once: true });

  // フォールバック (load が来ない場合)
  maxTimer = setTimeout(() => { loaded = true; progress.set(100); maybeClose(); }, MAX_MS);

  // スキップで即閉じ
  skipBtn?.addEventListener('click', closeOverlay);
  window.addEventListener('keydown', closeOverlay, { once: true });
  overlay.addEventListener('click', (e) => { if(e.target === overlay) closeOverlay(); });
})();

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
