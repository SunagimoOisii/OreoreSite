// src/core/state.js
// アプリ全体の軽量なグローバル状態とイベントバス

const bus = new EventTarget();

let retroEnabled = true; // PS1風エフェクトの有効/無効

export function getRetroEnabled() { return retroEnabled; }

export function setRetroEnabled(enabled)
{
  const next = !!enabled;
  if (retroEnabled === next) return;
  retroEnabled = next;
  bus.dispatchEvent(new CustomEvent('retro:changed', { detail: { enabled: retroEnabled } }));
}

export function onRetroChanged(handler, options)
{
  const fn = (e) => handler(!!e.detail?.enabled);
  bus.addEventListener('retro:changed', fn, options);
  return () => bus.removeEventListener('retro:changed', fn, options);
}

// 後方互換: 既存の disable-retro イベントが来たら retro OFF に倒す
try
{
  window.addEventListener('disable-retro', () => setRetroEnabled(false));
}
catch {}

