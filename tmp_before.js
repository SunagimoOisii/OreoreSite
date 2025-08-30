// title-tricks.js
// h1 の文字にトリック（小ネタ）を紐づける仕掛け

import { increaseBalls, decreaseBalls, switchToSphereMode } from '@features/background/index.js';

const titleElem = document.querySelector('main h1');
const text = titleElem.textContent;
titleElem.textContent = '';

// 元のテキストを1文字ずつ span に分解
const charElems = [...text].map((ch, index) =>
{
  const span = document.createElement('span');
  span.className = 'title-char';
  span.dataset.index = String(index);
  span.textContent = ch === ' ' ? '\u00A0' : ch;
  titleElem.appendChild(span);
  return span;
});

// 登録されたトリックを管理するマップ
const tricks = new Map();

export function registerTrick(index, handler)
{
  tricks.set(index, handler);
}

export function registerTrickByChar(char, handler)
{
  const target = (char === ' ' ? '\\u00A0' : char);
  charElems.forEach((el) =>
  {
    if (el.textContent === target)
    {
      const idx = Number(el.dataset.index);
      tricks.set(idx, handler);
    }
  });
}

// クリックされた文字に対応するトリックを実行
titleElem.addEventListener('click', (e) =>
{
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains('title-char')) return;

  const index = Number(target.dataset.index);
  const trick = tricks.get(index);
  if (trick)
  {
    trick();
  }
});

// ランダムカラー
function randomColor()
{
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 60%)`;
}

// 1文字目 S: 全文字の色をランダムに
registerTrick(0, () =>
{
  charElems.forEach((el) =>
  {
    el.style.color = randomColor();
  });
});

// 2文字目 U: UFO を大量発生
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
    ufo.addEventListener('animationend', () =>
    {
      ufo.remove();
    });
  }
});

// 3文字目 N: タブタイトル変更
registerTrick(2, () =>
{
  document.title = '君ってデバッガー？';
});

// 4文字目 A: 画面を暗転+「ビデオ」表示
registerTrick(3, () =>
{
  const overlay = document.createElement('div');
  overlay.id = 'video-overlay';
  overlay.textContent = 'ビデオ';
  document.body.appendChild(overlay);

  setTimeout(() =>
  {
    overlay.remove();
  }, 5000);
});

// 5文字目 G: 全文字を回転
registerTrick(4, () =>
{
  charElems.forEach((el) =>
  {
    el.classList.remove('rotate');
    void el.offsetWidth;
    el.classList.add('rotate');
    setTimeout(() =>
    {
      el.classList.remove('rotate');
    }, 5000);
  });
});

// 6文字目 I: 背景の玉を増やす
registerTrick(5, () =>
{
  increaseBalls();
});

// 7文字目 M: 背景の玉を減らす
registerTrick(6, () =>
{
  decreaseBalls();
});

// 8文字目 O: h1 以外を 5 秒隠す
registerTrick(7, () =>
{
  document.body.classList.add('hide-all');
  setTimeout(() =>
  {
    document.body.classList.remove('hide-all');
  }, 5000);
});

// 10文字目 O: 背景モード切替
registerTrick(10, () =>
{
  switchToSphereMode();
});

// 13文字目 E: h1 の文字列を一時的に差し替え
registerTrick(13, () =>
{
  const original = [...charElems];
  titleElem.textContent = 'ネタがもうない';
  setTimeout(() =>
  {
    titleElem.textContent = '';
    original.forEach((el) =>
    {
      titleElem.appendChild(el);
    });
  }, 5000);
});


