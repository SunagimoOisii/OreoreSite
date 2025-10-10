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
export function unregisterTrick(index) { tricks.delete(index); }
export function disposeTitleTricks()
{
  if (!titleElem) return;
  titleElem.removeEventListener('click', onTitleClick);
  tricks.clear();
}

// クリックされた文字に対応するトリックを実行
const onTitleClick = (e) =>
{
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains('title-char')) return;
  const index = Number(target.dataset.index);
  const trick = tricks.get(index);
  if (trick) trick();
};

if (titleElem) titleElem.addEventListener('click', onTitleClick);

// ユーティリティ
function randomColor() { const hue = Math.floor(Math.random() * 360); return `hsl(${hue}, 80%, 60%)`; }

function spawnEphemeralElements({
  count,
  className,
  pickContent,
  applyStyles,
  interval = 0,
  removal = {},
})
{
  const timerIds = new Set();

  const schedule = (callback, delay) =>
  {
    if (delay <= 0)
    {
      callback();
      return;
    }
    const id = setTimeout(() =>
    {
      timerIds.delete(id);
      callback();
    }, delay);
    timerIds.add(id);
  };

  const scheduleRemoval = (element, delay) =>
  {
    const id = setTimeout(() =>
    {
      timerIds.delete(id);
      element.remove();
    }, delay);
    timerIds.add(id);
  };

  for (let i = 0; i < count; i += 1)
  {
    schedule(() =>
    {
      const el = document.createElement('span');
      el.className = className;
      const content = typeof pickContent === 'function' ? pickContent(i) : pickContent;
      el.textContent = content;
      applyStyles?.(el, i);
      document.body.appendChild(el);

      if (removal.event)
      {
        const handler = () =>
        {
          el.removeEventListener(removal.event, handler);
          el.remove();
        };
        el.addEventListener(removal.event, handler);
      }

      if (removal.timeout)
      {
        const lifespan = typeof removal.timeout === 'function' ? removal.timeout(i) : removal.timeout;
        scheduleRemoval(el, lifespan);
      }
    }, interval * i);
  }

  return () =>
  {
    timerIds.forEach(clearTimeout);
    timerIds.clear();
  };
}

const trickDefinitions = [
  {
    index: 0,
    label: 'S',
    summary: '全文字カラーランダム',
    handler: () =>
    {
      charElems.forEach((el) =>
      {
        el.style.color = randomColor();
      });
    },
  },
  {
    index: 1,
    label: 'U',
    summary: 'UFO 大量発生',
    handler: () =>
    {
      spawnEphemeralElements({
        count: 20,
        className: 'ufo',
        pickContent: '\u{1F6F8}',
        applyStyles: (element) =>
        {
          element.style.top = `${Math.random() * 100}vh`;
          element.style.animationDelay = `${Math.random()}s`;
          const duration = 2 + Math.random() * 2;
          element.style.animationDuration = `${duration}s`;
        },
        removal: { event: 'animationend' },
      });
    },
  },
  {
    index: 2,
    label: 'N',
    summary: 'タブタイトル変更',
    handler: () => { document.title = '君ってデバッガー？'; },
  },
  {
    index: 3,
    label: 'A',
    summary: '画面暗転 +「ビデオ」表示',
    handler: () =>
    {
      const overlay = document.createElement('div');
      overlay.id = 'video-overlay';
      overlay.textContent = 'ビデオ';
      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), 5000);
    },
  },
  {
    index: 4,
    label: 'G',
    summary: '全文字回転（5秒）',
    handler: () =>
    {
      charElems.forEach((el) =>
      {
        el.classList.remove('rotate');
        void el.offsetWidth; // reflow
        el.classList.add('rotate');
        setTimeout(() => el.classList.remove('rotate'), 5000);
      });
    },
  },
  {
    index: 5,
    label: 'I',
    summary: '背景の玉を増やす',
    handler: () => { increaseBalls(); },
  },
  {
    index: 6,
    label: 'M',
    summary: '背景の玉を減らす',
    handler: () => { decreaseBalls(); },
  },
  {
    index: 7,
    label: 'O',
    summary: 'h1 以外を 5 秒隠す',
    handler: () =>
    {
      document.body.classList.add('hide-all');
      setTimeout(() => document.body.classList.remove('hide-all'), 5000);
    },
  },
  {
    index: 9,
    label: 'O',
    summary: '家の絵文字を順番に表示',
    handler: () =>
    {
      const emojis = ['\u{1F3E0}', '\u{1F3D8}', '\u{1F3E1}'];
      spawnEphemeralElements({
        count: 100,
        className: 'house',
        pickContent: () => emojis[Math.floor(Math.random() * emojis.length)],
        applyStyles: (element) =>
        {
          element.style.left = `${Math.random() * 100}vw`;
          element.style.top = `${Math.random() * 100}vh`;
          element.style.fontSize = `${1 + Math.random() * 2}rem`;
        },
        interval: 25, // 1つ出すごとの間隔（ms）
        removal: { timeout: 3000 },
      });
    },
  },
  {
    index: 10,
    label: 'O',
    summary: '背景モード切替',
    handler: () => { switchToSphereMode(); },
  },
  {
    index: 11,
    label: 'U',
    summary: 'レトロ風（PS1風）エフェクトを全無効化',
    handler: () =>
    {
      setRetroEnabled(false);
      document.body.classList.add('no-ps1');
    },
  },
  {
    index: 13,
    label: 'E',
    summary: 'h1 の文字列を一時的に差し替え',
    handler: () =>
    {
      const original = [...charElems];
      titleElem.textContent = 'ネタがもうない';
      setTimeout(() =>
      {
        titleElem.textContent = '';
        original.forEach((el) => titleElem.appendChild(el));
      }, 5000);
    },
  },
];

function initializeCharacterTricks(definitions)
{
  definitions.forEach(({ index, handler }) =>
  {
    registerTrick(index, handler);
  });
}

initializeCharacterTricks(trickDefinitions);
