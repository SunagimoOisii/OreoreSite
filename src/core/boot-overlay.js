// ブートオーバーレイ初期化
// - 最低表示時間とロード完了をゲート条件として管理
// - ウィンドウ操作で強制終了も可能

/**
 * ブートオーバーレイを初期化する。
 * @param {Object} [opts]
 * @param {string} [opts.overlaySelector="#boot-overlay"] - オーバーレイのセレクタ
 * @param {string} [opts.skipBtnSelector="#boot-skip"] - スキップボタンのセレクタ
 * @param {string} [opts.progressBarSelector=".boot-progress__bar"] - 進捗バーのセレクタ
 * @param {number} [opts.minMs=2400] - 最低表示時間
 * @param {number} [opts.maxMs=6500] - フォールバックの上限時間
 */
export function initBootOverlay({
  overlaySelector = '#boot-overlay',
  skipBtnSelector = '#boot-skip',
  progressBarSelector = '.boot-progress__bar',
  minMs = 2400,
  maxMs = 6500
} = {})
{
  const overlay = document.querySelector(overlaySelector);
  if (!overlay)
    return;

  const skipBtn = document.querySelector(skipBtnSelector);
  const bar = overlay.querySelector(progressBarSelector);

  // 進捗バー制御
  const progress = {
    val: 0,
    set(x)
    {
      this.val = Math.max(0, Math.min(100, x | 0));
      if (bar)
      {
        bar.style.width = this.val + '%';
        bar.parentElement?.setAttribute('aria-valuenow', String(this.val));
      }
    }
  };

  // ゲート条件
  let minElapsed = false, loaded = false, finished = false;
  let maxTimer = null;

  function maybeClose()
  {
    if (!finished && minElapsed && loaded)
      closeOverlay();
  }

  // フェードを WAAPI で必ず発動させる
  function closeOverlay()
  {
    if (finished)
      return;
    finished = true;
    if (maxTimer)
      clearTimeout(maxTimer);

    const anim = overlay.animate(
      [ { opacity: 1 }, { opacity: 0 } ],
      { duration: 450, easing: 'ease', fill: 'forwards' }
    );

    // 正常系: アニメ終了で除去
    anim.addEventListener('finish', () =>
    {
      overlay.remove();
    });

    // 非常系: 何かで止まっても除去
    setTimeout(() =>
    {
      if (overlay.isConnected) overlay.remove();
    }, 800);
  }

  // 体感用の自走プログレス
  const startTs = performance.now();
  const TARGET = 90;
  const DURATION = Math.max(1000, Math.floor(minMs * 0.9));
  (function tick()
  {
    if (finished)
      return;
    const t = Math.min(1, (performance.now() - startTs) / DURATION);
    const eased = 1 - Math.pow(1 - t, 2);
    progress.set(Math.floor(TARGET * eased));
    if (t < 1)
      requestAnimationFrame(tick);
  })();

  // 最低表示時間経過でゲート開放
  setTimeout(() =>
  {
    minElapsed = true; maybeClose();
  }, minMs);

  // 実ロード完了で100%
  function markLoaded()
  {
    if (finished)
      return;
    loaded = true;
    progress.set(100);
    setTimeout(maybeClose, 150);
  }
  if (document.readyState === 'complete')
    markLoaded();
  else
    window.addEventListener('load', markLoaded, { once: true });

  // フォールバック (load が来ない場合)
  maxTimer = setTimeout(() =>
  {
    loaded = true; progress.set(100); maybeClose();
  }, maxMs);

  // スキップで即閉じ
  skipBtn?.addEventListener('click', closeOverlay);
  window.addEventListener('keydown', closeOverlay, { once: true });
  overlay.addEventListener('click', (e) =>
  {
    if (e.target === overlay) closeOverlay();
  });
}
