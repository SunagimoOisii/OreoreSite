// title-tricks.js
// h1 見出しの各文字に仕掛けを登録するモジュール

import { increaseBalls, decreaseBalls } from './background.js';

const titleElem = document.querySelector('main h1');
const text = titleElem.textContent;
titleElem.textContent = '';

// 元のテキストを一文字ずつ span に分割
const charElems = [...text].map((ch, index) => {
  const span = document.createElement('span');
  span.className = 'title-char';
  span.dataset.index = String(index);
  span.textContent = ch === ' ' ? '\u00A0' : ch;
  titleElem.appendChild(span);
  return span;
});

// 登録された仕掛けを管理するマップ
const tricks = new Map();

/**
 * 指定したインデックスの文字に仕掛けを登録する
 * @param {number} index 0 始まりの文字インデックス
 * @param {() => void} handler クリック時に実行する処理
 */
export function registerTrick(index, handler) {
  tricks.set(index, handler);
}

// クリックされた文字に対応する仕掛けを実行
titleElem.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains('title-char')) return;

  const index = Number(target.dataset.index);
  const trick = tricks.get(index);
  if (trick) {
    trick();
  }
});

// 色をランダムに生成
function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 60%)`;
}

// 先頭文字 S の仕掛け登録: 全文字の色をランダムに変更
registerTrick(0, () => {
  charElems.forEach((el) => {
    el.style.color = randomColor();
  });
});

// 2 文字目 U の仕掛け登録: 背景を UFO が横切る
registerTrick(1, () => {
  const count = 20;
  for (let i = 0; i < count; i++) {
    const ufo = document.createElement('span');
    ufo.className = 'ufo';
    ufo.textContent = '\u{1F6F8}';
    ufo.style.top = `${Math.random() * 100}vh`;
    ufo.style.animationDelay = `${Math.random()}s`;
    const duration = 2 + Math.random() * 2;
    ufo.style.animationDuration = `${duration}s`;
    document.body.appendChild(ufo);
    ufo.addEventListener('animationend', () => {
      ufo.remove();
    });
  }
});

// 3 文字目 N の仕掛け登録: タブタイトルを変更
registerTrick(2, () => {
  document.title = '君ってデバッガー？';
});

// 4 文字目 A の仕掛け登録: 画面を暗転させ右上に「ビデオ」を表示
registerTrick(3, () => {
  const overlay = document.createElement('div');
  overlay.id = 'video-overlay';
  overlay.textContent = 'ビデオ';
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.remove();
  }, 5000);
});

// 5 文字目 G の仕掛け登録: 全文字を回転
registerTrick(4, () => {
  charElems.forEach((el) => {
    el.classList.remove('rotate');
    void el.offsetWidth;
    el.classList.add('rotate');
    setTimeout(() => {
      el.classList.remove('rotate');
    }, 5000);
  });
});

// 6 文字目 I の仕掛け登録: 背景の球を増やす
registerTrick(5, () => {
  increaseBalls();
});

// 7 文字目 M の仕掛け登録: 背景の球を減らす
registerTrick(6, () => {
  decreaseBalls();
});

// 8 文字目 O の仕掛け登録: h1 以外を 5 秒間非表示
registerTrick(7, () => {
  document.body.classList.add('hide-all');
  setTimeout(() => {
    document.body.classList.remove('hide-all');
  }, 5000);
});
