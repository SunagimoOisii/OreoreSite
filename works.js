const WORKS = {
  game: [
    {
      src: 'img/AlienChan.png',
      alt: 'AlienChan',
      desc: [
        'ゲーム作品1の説明です',
        'ここに説明を記述する',
        'ここに説明を記述する',
        'ここに説明を記述する'
      ]
    },
    {
      src: 'img/me.jpg',
      alt: 'me',
      desc: [
        'ゲーム作品2の説明です',
        'ここに説明を記述する'
      ]
    }
  ],
  tool: [
    {
      src: 'img/logo.png',
      alt: 'ロゴ',
      desc: [
        'ツール作品1の説明です',
        'ここに説明を記述する'
      ]
    }
  ],
  other: [
    {
      src: 'img/AlienChan.png',
      alt: 'AlienChan',
      desc: [
        'その他作品の説明です',
        'ここに説明を記述する'
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
