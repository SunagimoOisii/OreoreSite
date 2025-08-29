// src/core/loop.js
// 固定ステップ/メインループ ユーティリティ

/**
 * 固定ステップのループを開始し、タブの可視状態に応じて一時停止/再開します。
 * @param {number} stepMs 1 ステップあたりのミリ秒(0 なら可変)
 * @param {(dtSec:number) => void} update 更新処理
 * @param {() => void} render 描画処理
 * @returns {{ start: () => void, stop: () => void, dispose: () => void }} 制御用関数
 */
export function runFixedStepLoop(stepMs, update, render)
{
  let raf = 0;
  let acc = 0;
  let last = 0;
  let listening = false;

  const onVisibilityChange = () =>
  {
    if (document.visibilityState === 'hidden')
      loopStop();
    else
      loopStart();
  };

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

  function loopStart()
  {
    last = performance.now();
    acc = 0;
    raf = requestAnimationFrame(frame);
  }

  function loopStop()
  {
    cancelAnimationFrame(raf);
  }

  function start()
  {
    if (!listening)
    {
      document.addEventListener('visibilitychange', onVisibilityChange);
      listening = true;
    }
    loopStart();
  }

  function stop()
  {
    if (listening)
    {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      listening = false;
    }
    loopStop();
  }

  function dispose()
  {
    stop();
  }

  start();
  return { start, stop, dispose };
}

