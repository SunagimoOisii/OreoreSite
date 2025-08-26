const works = [
  { image: 'img/AlienChan.png', description: 'プロジェクトA — 実装がダルい', alt: 'プロジェクトA' },
  { image: 'img/me.jpg', description: 'プロジェクトB — 実装がダルい', alt: 'プロジェクトB' },
  { image: 'img/logo.png', description: 'プロジェクトC — 実装がダルい', alt: 'プロジェクトC' }
];

const preview = document.getElementById('work-preview');
const desc = document.getElementById('work-description');
const thumbs = document.querySelectorAll('.work-thumb');

thumbs.forEach(btn => {
  btn.addEventListener('click', () => {
    const index = Number(btn.dataset.index);
    const work = works[index];
    preview.src = work.image;
    preview.alt = work.alt;
    desc.textContent = work.description;
    thumbs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
