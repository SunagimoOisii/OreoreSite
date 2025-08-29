// src/features/works/loader.js
// works データの JSON を読み込み、UI から参照しやすい API を提供

let _data = null;

/**
 * 読み込んだ JSON をざっくり検証し、期待形でなければ false を返す。
 * lang -> { game: Item[], tool: Item[], other: Item[] }
 * Item: { src:string, alt?:string, desc:string[] }
 */
function _validateData(obj)
{
  if (!obj || typeof obj !== 'object') return false;
  const langs = Object.keys(obj);
  if (langs.length === 0) return false;
  for (const lang of langs)
  {
    const d = obj[lang];
    if (!d || typeof d !== 'object') return false;
    for (const cat of ['game', 'tool', 'other'])
    {
      if (!Array.isArray(d[cat])) return false;
      for (const item of d[cat])
      {
        if (!item || typeof item !== 'object') return false;
        if (typeof item.src !== 'string') return false;
        if (item.alt != null && typeof item.alt !== 'string') return false;
        if (!Array.isArray(item.desc)) return false;
        if (!item.desc.every((s) => typeof s === 'string')) return false;
      }
    }
  }
  return true;
}

/**
 * works データを読み込み、メモリにキャッシュします。
 * @param {string} [url]
 */
export async function loadWorks(url = './src/features/works/data.json')
{
  if (_data)
    return;
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok)
  {
    console.warn('[works] データの取得に失敗:', res.status, res.statusText);
    _data = { ja: { game: [], tool: [], other: [] } };
    return;
  }
  try
  {
    const j = await res.json();
    if (_validateData(j))
      _data = j;
    else
    {
      console.warn('[works] JSON 構造が不正なためフォールバックします');
      _data = { ja: { game: [], tool: [], other: [] } };
    }
  }
  catch (e)
  {
    console.error('[works] JSON のパースに失敗:', e);
    _data = { ja: { game: [], tool: [], other: [] } };
  }
}

/**
 * 指定言語のデータを返します。
 * @param {string} lang 言語コード
 */
export function getLang(lang = 'ja')
{
  if (!_data) return { game: [], tool: [], other: [] };
  return _data[lang] || _data.ja || { game: [], tool: [], other: [] };
}

/**
 * 指定言語＋カテゴリのリストを返します。
 * @param {string} lang 言語
 * @param {string} category カテゴリ(game/tool/other)
 */
export function getList(lang = 'ja', category = 'game')
{
  const langData = getLang(lang);
  return langData[category] || [];
}
