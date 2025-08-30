// src/features/works/carousel-util.js
// Works 機能内限定の小ユーティリティ（過度な一般化は避ける）

/** 初期位置クラスを付与し、centerにis-centerを付ける */
function applyInitialPositions(cards, positions)
{
  const posClasses = ['pos--2','pos--1','pos-0','pos-1','pos-2'];
  cards.forEach((card, i) =>
  {
    card.classList.remove(...posClasses, 'is-center');
    const off = positions[i] ?? 0;
    card.classList.add(`pos-${off}`);
    if (off === 0) card.classList.add('is-center');
  });
}

/**
 * Carouselコンテナを生成し、カードをスロット数に揃えて初期位置を設定する。
 * @param {HTMLElement} worksView ルート(.works-view)
 * @param {HTMLElement|null} insertBefore 右矢印など挿入位置の基準要素
 * @param {HTMLElement|null} existingCard 既存の .works-content（任意）
 * @param {number} slots スロット数（例:5）
 * @param {() => HTMLElement} buildCardFn 空スロットを埋めるカード生成関数
 * @returns {{carousel:HTMLElement,cards:HTMLElement[]}}
 */
export function ensureCarousel(worksView, insertBefore, existingCard, slots, buildCardFn)
{
  if (!worksView) return { carousel: null, cards: [] };
  let carousel = worksView.querySelector('.works-carousel');
  if (!carousel)
  {
    carousel = document.createElement('div');
    carousel.className = 'works-carousel';
    if (insertBefore && insertBefore.parentElement === worksView)
      worksView.insertBefore(carousel, insertBefore);
    else
      worksView.appendChild(carousel);
  }

  const cards = Array.from(carousel.querySelectorAll('.works-content'));
  if (existingCard && !cards.includes(existingCard))
  {
    carousel.appendChild(existingCard);
    cards.push(existingCard);
  }
  while (cards.length < slots)
  {
    const c = buildCardFn();
    carousel.appendChild(c);
    cards.push(c);
  }

  applyInitialPositions(cards, [-2, -1, 0, 1, 2]);
  return { carousel, cards };
}

/** 現在の位置オフセット（-2..2）をクラスから取得 */
export function getOffset(card)
{
  if (!card) return null;
  const cls = [...card.classList].find(c => /^pos-/.test(c));
  if (!cls) return null;
  const val = cls.replace('pos-', '');
  return Number(val);
}

/** 位置クラスを一段ローテート（dir=+1で右へ） */
export function rotateClasses(cards, dir)
{
  const posClasses = ['pos--2','pos--1','pos-0','pos-1','pos-2'];
  cards.forEach((card) =>
  {
    const off = getOffset(card);
    if (off == null) return;
    let next = off - (Math.sign(dir) || 1);
    if (next < -2) next = 2;
    if (next > 2) next = -2;
    card.classList.remove(...posClasses, 'is-center');
    card.classList.add(`pos-${next}`);
    if (next === 0) card.classList.add('is-center');
  });
}

