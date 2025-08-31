// title-tricks.js
// h1 の各文字に小ネタを割り当てる

import { increaseBalls, decreaseBalls, switchToSphereMode } from '@features/background/index.js';
import { setRetroEnabled } from '@core/state.js';

const titleElem = document.querySelector('main h1');
const text = titleElem?.textContent || '';
titleElem.textContent = '';

// 文字を1つずつ span に分割
const charElems = [...text].map((ch, index) =>
{
  const span = document.createElement('span');
  span.className = 'title-char';
  span.dataset.index = String(index);
  span.textContent = ch === ' ' ? '\u00A0' : ch;
  titleElem.appendChild(span);
  return span;
});

// 登録されたトリックを管理
const tricks = new Map();
export function registerTrick(index, handler) { tricks.set(index, handler); }

// クリックされた文字に対応するトリックを実行
titleElem.addEventListener('click', (e) =>
{
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains('title-char')) return;
  const index = Number(target.dataset.index);
  const trick = tricks.get(index);
  if (trick) trick();
});

// ユーティリティ
function randomColor() { const hue = Math.floor(Math.random() * 360); return `hsl(${hue}, 80%, 60%)`; }

// 0: S 全文字カラーランダム
registerTrick(0, () => { charElems.forEach((el) => { el.style.color = randomColor(); }); });

// 1: U UFO 大量発生
registerTrick(1, () =>
{
  const count = 20;
  for (let i = 0; i < count; i++)
  {
    const ufo = document.createElement('span');
    ufo.className = 'ufo';
    ufo.textContent = '\u{1F6F8}';
    ufo.style.top = `${Math.random() * 100}vh`;
    ufo.style.animationDelay = `${Math.random()}s`;
    const duration = 2 + Math.random() * 2;
    ufo.style.animationDuration = `${duration}s`;
    document.body.appendChild(ufo);
    ufo.addEventListener('animationend', () => ufo.remove());
  }
});

// 2: N タブタイトル変更
registerTrick(2, () => { document.title = '君ってデバッガー？'; });

// 3: A 画面暗転 +「ビデオ」表示
registerTrick(3, () =>
{
  const overlay = document.createElement('div');
  overlay.id = 'video-overlay';
  overlay.textContent = 'ビデオ';
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 5000);
});

// 4: G 全文字回転（5秒）
registerTrick(4, () =>
{
  charElems.forEach((el) =>
  {
    el.classList.remove('rotate');
    void el.offsetWidth; // reflow
    el.classList.add('rotate');
    setTimeout(() => el.classList.remove('rotate'), 5000);
  });
});

// 5: I 背景の玉を増やす
registerTrick(5, () => { increaseBalls(); });

// 6: M 背景の玉を減らす
registerTrick(6, () => { decreaseBalls(); });

// 7: O h1 以外を 5 秒隠す
registerTrick(7, () =>
{
  document.body.classList.add('hide-all');
  setTimeout(() => document.body.classList.remove('hide-all'), 5000);
});

// 9: 家の絵文字を順番に表示
registerTrick(9, () => 
{
  const emojis = ['\u{1F3E0}', '\u{1F3D8}', '\u{1F3E1}'];
  const count = 100;
  const interval = 25; // 1つ出すごとの間隔（ms）

  for (let i = 0; i < count; i++) 
  {
    setTimeout(() => 
    {
      const house = document.createElement('span');
      house.className = 'house';
      house.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      house.style.left = `${Math.random() * 100}vw`;
      house.style.top = `${Math.random() * 100}vh`;
      house.style.fontSize = `${1 + Math.random() * 2}rem`;
      document.body.appendChild(house);

      // 3秒後に削除
      setTimeout(() => 
      {
        house.remove();
      }, 3000);
    }, i * interval);
  }
});

// 10: O 背景モード切替
registerTrick(10, () => { switchToSphereMode(); });

// 11: U レトロ風（PS1風）エフェクトを全無効化
registerTrick(11, () =>
{
  setRetroEnabled(false);
  document.body.classList.add('no-ps1');
});

// 13: E h1 の文字列を一時的に差し替え
registerTrick(13, () =>
{
  const original = [...charElems];
  titleElem.textContent = 'ネタがもうない';
  setTimeout(() =>
  {
    titleElem.textContent = '';
    original.forEach((el) => titleElem.appendChild(el));
  }, 5000);
});

