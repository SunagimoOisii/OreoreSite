// lib/utils.js
// PS1 風のジッター処理など補助関数群
/**
 * 値を指定ステップで丸める。
 * @param {number} v 対象値
 * @param {number} step 丸め単位
 * @returns {number} 丸め後の値
 */
function snap(v, step) { return Math.round(v / step) * step; }

/**
 * カメラとオブジェクトに量子化ジッターを適用し、PS1 風の粗さを再現。
 * @param {typeof import('three')} THREE three 名前空間
 * @param {THREE.Camera} camera 対象カメラ
 * @param {THREE.Object3D} cube 対象オブジェクト
 * @param {object} cfg 設定値
 */
export function applyPS1Jitter(THREE, camera, cube, cfg)
{
  if (!cfg.PS1_MODE)
    return;
  const posStep = 1 / 256;
  const rotStep = THREE.MathUtils.degToRad(1.0);
  camera.position.x = snap(camera.position.x, posStep);
  camera.position.y = snap(camera.position.y, posStep);
  camera.position.z = snap(camera.position.z, posStep);
  cube.rotation.x = snap(cube.rotation.x, rotStep);
  cube.rotation.y = snap(cube.rotation.y, rotStep);
  cube.rotation.z = snap(cube.rotation.z, rotStep);
}

/**
 * 固定ステップのループを開始し、タブの可視状態に応じて停止・再開する。
 * @param {number} stepMs 1 ステップ当たりのミリ秒（0 なら可変）
 * @param {(dtSec:number) => void} update 更新処理
 * @param {() => void} render 描画処理
 * @returns {{ start: () => void, stop: () => void }} 制御関数
 */
export function runFixedStepLoop(stepMs, update, render)
{
  let raf = 0;
  let acc = 0;
  let last = 0;

  function frame(now)
  {
    raf = requestAnimationFrame(frame);
    const delta = now - last;
    last = now;

    if (stepMs > 0)
    {
      acc += delta;
      while (acc >= stepMs)
      {
        update(stepMs / 1000);
        acc -= stepMs;
      }
    }
    else
    {
      update(delta / 1000);
    }

    render();
  }

  function start()
  {
    last = performance.now();
    acc = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop()
  {
    cancelAnimationFrame(raf);
  }

  document.addEventListener('visibilitychange', () =>
  {
    if (document.visibilityState === 'hidden')
      stop();
    else
      start();
  });

  start();
  return { start, stop };
}
