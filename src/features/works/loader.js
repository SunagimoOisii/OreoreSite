// src/features/works/loader.js
// works データの JSON を読み込み、UI から参照しやすい API を提供

let _data = null;

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
    _data = await res.json();
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

