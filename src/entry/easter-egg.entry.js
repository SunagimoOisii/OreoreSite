// Easter Egg: 秘の入力列で背景カメラを俯瞰に切替
import { background } from '@features/background/index.js';

(() =>
{
  const sequence = 
  [
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

  const hideMainSections = () =>
  {
    const ids = ['about', 'works', 'contact'];
    for (const id of ids)
    {
      const el = document.getElementById(id);
      if (el)
      {
        el.style.display = 'none';
      }
    }

    // 追加で h1 とフッター内文言も非表示
    const title = document.querySelector('main h1');
    if (title)
    {
      title.style.display = 'none';
    }
    const footer = document.querySelector('footer');
    if (footer)
    {
      footer.style.display = 'none';
    }
  };

  window.addEventListener('keydown', (e) =>
  {
    if (isEditable(e.target))
    {
      return; // 入力系はスキップ
    }

    const key = e.code.startsWith('Key') ? e.code : e.key;
    const expect = sequence[index];

    if (key === expect)
    {
      index += 1;
      if (index === sequence.length)
      {
        try
        {
          hideMainSections();
          background.setGridRotationPaused(true);
          background.switchToBirdsEyeView(18);
        }
        catch {}
        index = 0;
      }
    }
    else
    {
      // 先頭キーと同じなら index を 1、それ以外は 0 にリセット
      index = (key === sequence[0]) ? 1 : 0;
    }
  }, { passive: true });
})();
