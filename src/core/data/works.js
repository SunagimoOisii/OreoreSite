// src/core/data/works.js
// WORKS データを定義
// 現状は日本語のみだが、将来的に多言語や JSON 取得へ拡張できる構造

export const WORKS = {
  ja: {
    game: [
      {
        src: 'img/alien-chan.png',
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
        src: 'img/alien-chan.png',
        alt: 'AlienChan',
        desc: [
          '作品1',
          '説明はまだないんだワ'
        ]
      }
    ]
  }
};

/**
 * 作品データを取得する。
 * 今は静的な定義を返す
 * @param {string} lang 言語コード
 * @returns {Promise<object>} 作品データ
 */
export async function fetchWorks(lang = 'ja')
{
  return WORKS[lang] || WORKS.ja;
}

