// src/data/works.js
// WORKS データを定義
// 現状は日本語のみだが、将来的に多言語や JSON 取得へ拡張できる構造

export const WORKS = {
  ja: {
    game: [
      {
        src: 'assets/img/alien-chan.png',
        alt: 'AlienChan',
        desc: [
          '作品1',
          '説明はまだないんだワ',
        ]
      },
      {
        src: 'assets/img/me.jpg',
        alt: 'me',
        desc: [
          '作品2',
          '説明はまだないんだワ'
        ]
      }
    ],
    tool: [
      {
        src: 'assets/img/logo.png',
        alt: 'ロゴ',
        desc: [
          '作品1',
          '説明はまだないんだワ'
        ]
      }
    ],
    other: [
      {
        src: 'assets/img/me.jpg',
        alt: 'me',
        desc: [
          '自画像',
          'スマホを使って5分程度で作成',
          '5分の割には良い出来だ…'
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

