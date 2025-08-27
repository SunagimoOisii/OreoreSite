// works.js
// 制作物ギャラリーのタブ切替と表示処理
// - WORKS 定義に従い画像と説明を更新
const WORKS = {
  game: [
    {
      src: 'img/AlienChan.png',
      alt: 'AlienChan',
      desc: [
        '作品1',
        '説明はまだないんだワ',
      ]
    },
    {
      src: 'img/me.jpg',
      alt: 'me',
      desc: [
        '作品2',
        '説明はまだないんだワ'
      ]
    }
  ],
  tool: [
    {
      src: 'img/logo.png',
      alt: 'ロゴ',
      desc: [
        '作品1',
        '説明はまだないんだワ'
      ]
    }
  ],
  other: [
    {
      src: 'img/AlienChan.png',
      alt: 'AlienChan',
      desc: [
        '作品1',
        '説明はまだないんだワ'
      ]
    }
  ]
};

const tabs = document.querySelectorAll('.works-tabs button');
const image = document.querySelector('.works-image img');
const descList = document.querySelector('.works-desc');
const left = document.querySelector('.arrow-left');
const right = document.querySelector('.arrow-right');

let currentCategory = 'game';
let index = 0;

/**
 * 現在のカテゴリから作品を1件選んで表示する。
 */
function render() {
  const list = WORKS[currentCategory] || [];
  if (list.length === 0) {
    image.style.display = 'none';
    descList.innerHTML = '<li>作品がありません</li>';
    return;
  }
  image.style.display = '';
  index = (index + list.length) % list.length;
  const item = list[index];
  image.src = item.src;
  image.alt = item.alt || '';
  descList.innerHTML = '';
  item.desc.forEach((line) => {
    const li = document.createElement('li');
    li.textContent = line;
    descList.appendChild(li);
  });
}

tabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabs.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    index = 0;
    render();
  });
});

left.addEventListener('click', () => {
  const list = WORKS[currentCategory] || [];
  if (list.length === 0) return;
  index = (index - 1 + list.length) % list.length;
  render();
});

right.addEventListener('click', () => {
  const list = WORKS[currentCategory] || [];
  if (list.length === 0) return;
  index = (index + 1) % list.length;
  render();
});

render();
