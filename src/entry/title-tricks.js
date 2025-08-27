// title-tricks.js
// h1 見出しの各文字に仕掛けを登録するモジュール
// - 先頭の S をクリックすると全体の文字色がランダムに変わる

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
