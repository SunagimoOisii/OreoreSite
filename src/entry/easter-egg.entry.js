// イースターエッグ: ↑↑↓↓←→←→BA
(() =>
{
  const sequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
  ];
  let index = 0;

  const isEditable = (el) =>
  {
    if (!el)
    {
      return false;
    }
    const tag = el.tagName;
    return el.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA';
  };

  window.addEventListener('keydown', (e) =>
  {
    if (isEditable(e.target))
    {
      return; // 入力中の邪魔をしない
    }

    const key = e.code.startsWith('Key') ? e.code : e.key;
    const expect = sequence[index];

    if (key === expect)
    {
      index += 1;
      if (index === sequence.length)
      {
        window.location.href = 'game.html';
        index = 0;
      }
    }
    else
    {
      // 先頭キーと一致なら index を 1、その他は 0 にリセット
      index = (key === sequence[0]) ? 1 : 0;
    }
  }, { passive: true });
})();

