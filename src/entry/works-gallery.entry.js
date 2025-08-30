// works-gallery.js
// Works: タブUI（奥行きカルーセル）
import { loadWorks, getList } from '@features/works/index.js';
import { retriggerClass } from '../utils/dom.js';
import { ensureCarousel as ensureCarouselUtil, getOffset as getCardOffset, rotateClasses as rotateClassesUtil } from '@features/works/carousel-util.js';

// 定数（マジックナンバー回避）
const WORKS_LOADING_MS = 1400;
const CAROUSEL_STEP_MS = 320;

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

/** Works のカード要素（.works-content）を構築 */
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

// 機能内ユーティリティでカルーセルを初期化
function setupCarousel()
{
  if (!worksView) return;
  if (carousel) return;
  const currentCard = document.querySelector('.works-content');
  const res = ensureCarouselUtil(worksView, right, currentCard, SLOTS, buildCard);
  carousel = res.carousel;
  cards = res.cards;
}

/** 中央カードのローディングバー演出を再トリガ */
function triggerWorksLoadingBar()
{
  const center = document.querySelector('.works-carousel .works-content.is-center') || document.querySelector('.works-content');
  retriggerClass(center, 'loading', WORKS_LOADING_MS);
}

function getCurrentList()
{
  return getList(currentLang, currentCategory);
}

/** 言語/カテゴリとインデックスに基づいて描画 */
function render()
{
  setupCarousel();
  const list = getCurrentList();
  if (!carousel || list.length === 0)
  {
    const fallbackImg = document.querySelector('.works-image img');
    const fallbackUl = document.querySelector('.works-desc');
    if (fallbackImg && fallbackUl)
    {
      fallbackImg.style.display = 'none';
      fallbackUl.innerHTML = '<li>現在表示できる項目がありません</li>';
    }
    return;
  }

  cards.forEach((card) =>
  {
    const off = getCardOffset(card);
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

/** カルーセルを delta だけ回転（正=右、負=左） */
function changeIndex(delta)
{
  const list = getCurrentList();
  if (list.length === 0 || animating) return;
  const dir = Math.sign(delta) || 1;
  animating = true;
  const steps = Math.abs(delta);
  let done = 0;
  const stepOnce = () =>
  {
    rotateClassesUtil(cards, dir);
    setTimeout(() =>
    {
      index = (index + dir + list.length) % list.length;
      render();
      done++;
      if (done < steps)
        stepOnce();
      else
        animating = false;
    }, CAROUSEL_STEP_MS);
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
