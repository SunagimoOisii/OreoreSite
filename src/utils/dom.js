// src/utils/dom.js
// 小粒度のDOMユーティリティ

/**
 * CSSクラスの再トリガを行います（remove→reflow→add）。
 * durationMs を指定すると、その時間後にクラスを外します。
 * @param {HTMLElement|null} el 対象要素
 * @param {string} className 再トリガするクラス名
 * @param {number} [durationMs] 自動でクラスを外すまでの時間(ms)
 */
export function retriggerClass(el, className, durationMs)
{
  if (!el) return;
  el.classList.remove(className);
  // CSS animation/transition を再開する流れ
  void el.offsetWidth;
  el.classList.add(className);
  if (typeof durationMs === 'number' && durationMs >= 0)
  {
    setTimeout(() => {
      try { el.classList.remove(className); } catch { /* noop */ }
    }, durationMs);
  }
}

