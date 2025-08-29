// works-gallery.js
// Works: タブ・左右ナビ + Depth Carousel（3Dリング配置）
import { loadWorks, getList } from '../features/works/loader.js';

const tabs = document.querySelectorAll('.works-tabs button');
const left = document.querySelector('.arrow-left');
const right = document.querySelector('.arrow-right');
const worksView = document.querySelector('.works-view');

// 状態
let currentLang = 'ja';
let currentCategory = 'game';
let index = 0;

// Carousel
const SLOTS = 5; // [-2,-1,0,1,2]
let carousel;       // .works-carousel
let cards = [];     // Array<.works-content>
let animating = false;

function buildCard()
{
  const card = document.createElement('div');
  card.className = 'works-content';
  const imgWrap = document.createElement('div');
  imgWrap.className = 'works-image';
  const img = document.createElement('img');
  imgWrap.appendChild(img);
  const ul = document.createElement('ul');
  ul.className = 'works-desc';
  card.appendChild(imgWrap);
  card.appendChild(ul);
  return card;
}

function ensureCarousel()
{
  if (!worksView) return;
  if (carousel) return;

  const currentCard = document.querySelector('.works-content');
  carousel = document.createElement('div');
  carousel.className = 'works-carousel';

  // 左矢印の直後に挿入（右矢印の前）
  worksView.insertBefore(carousel, right);

  if (currentCard)
  {
    carousel.appendChild(currentCard);
    cards.push(currentCard);
  }
  while (cards.length < SLOTS)
  {
    const c = buildCard();
    carousel.appendChild(c);
    cards.push(c);
  }
  // 初期配置クラス付与
  const initial = [-2, -1, 0, 1, 2];
  cards.forEach((card, i) =>
  {
    card.classList.remove('pos--2','pos--1','pos-0','pos-1','pos-2','is-center');
    const off = initial[i];
    card.classList.add(`pos-${off}`);
    if (off === 0) card.classList.add('is-center');
  });
}

function triggerWorksLoadingBar()
{
  const center = document.querySelector('.works-carousel .works-content.is-center') || document.querySelector('.works-content');
  if (!center) return;
  center.classList.remove('loading');
  void center.offsetWidth; // reflow
  center.classList.add('loading');
  setTimeout(() => center.classList.remove('loading'), 1400);
}

function getCurrentList()
{
  return getList(currentLang, currentCategory);
}

function render()
{
  ensureCarousel();
  const list = getCurrentList();
  if (!carousel || list.length === 0)
  {
    // 既存構造のフォールバック（初期ロード直後など）
    const fallbackImg = document.querySelector('.works-image img');
    const fallbackUl = document.querySelector('.works-desc');
    if (fallbackImg && fallbackUl)
    {
      fallbackImg.style.display = 'none';
      fallbackUl.innerHTML = '<li>項目がありません</li>';
    }
    return;
  }

  // 現在の各カードのoffsetクラスに基づいてコンテンツだけ更新
  cards.forEach((card) =>
  {
    const off = getOffset(card);
    if (off == null) return;
    const itemIdx = (index + off + list.length) % list.length;
    const item = list[itemIdx];
    const img = card.querySelector('img');
    const ul = card.querySelector('.works-desc');
    if (img)
    {
      img.src = item.src;
      img.alt = item.alt || '';
    }
    if (ul)
    {
      ul.innerHTML = '';
      if (off === 0)
      {
        item.desc.forEach((line) =>
        {
          const li = document.createElement('li');
          li.textContent = line;
          ul.appendChild(li);
        });
        card.classList.add('is-center');
      }
      else
      {
        card.classList.remove('is-center');
      }
    }
    card.setAttribute('aria-hidden', off === 0 ? 'false' : 'true');
  });

  const centerCard = carousel.querySelector('.works-content.is-center');
  if (centerCard)
  {
    const h = centerCard.offsetHeight;
    carousel.style.height = h + 'px';
  }
}

tabs.forEach((btn) =>
{
  btn.addEventListener('click', () =>
  {
    tabs.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    index = 0;
    render();
    triggerWorksLoadingBar();
  });
});

function changeIndex(delta)
{
  const list = getCurrentList();
  if (list.length === 0 || animating) return;
  const dir = Math.sign(delta) || 1;
  animating = true;
  // 1ステップずつ回す（|delta|>1は分割）
  const steps = Math.abs(delta);
  let done = 0;
  const stepOnce = () =>
  {
    rotateClasses(dir);
    // アニメ完了後にインデックスを更新して内容を再配置
    setTimeout(() =>
    {
      index = (index + dir + list.length) % list.length;
      render();
      done++;
      if (done < steps)
        stepOnce();
      else
        animating = false;
    }, 320); // CSSのtransitionに合わせる
  };
  stepOnce();
}

left?.addEventListener('click', () => { changeIndex(-1); triggerWorksLoadingBar(); });
right?.addEventListener('click', () => { changeIndex(1); triggerWorksLoadingBar(); });

(async () =>
{
  await loadWorks();
  render();
})();

// 位置クラスからオフセット数値を取得
function getOffset(card)
{
  if (!card) return null;
  const cls = [...card.classList].find(c => /^pos-/.test(c));
  if (!cls) return null;
  const val = cls.replace('pos-', '');
  return Number(val);
}

// 位置クラスを回す（dir=+1 で右矢印: 右のカードが中央へ）
function rotateClasses(dir)
{
  cards.forEach((card) =>
  {
    const off = getOffset(card);
    if (off == null) return;
    let next = off - dir; // 右矢印で左回転: pos-1 -> pos-0
    if (next < -2) next = 2;
    if (next > 2) next = -2;
    card.classList.remove('pos--2','pos--1','pos-0','pos-1','pos-2','is-center');
    card.classList.add(`pos-${next}`);
    if (next === 0) card.classList.add('is-center');
  });
}
