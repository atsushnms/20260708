/**
 * プロトタイプ用のサンプルランキングデータ。
 * 実際のプロダクトではユーザーのスコアから動的に生成する。
 */
const sampleRanking = [
  { name: 'AoiPrompt', level: 12, xp: 2400, badge: '🏆' },
  { name: 'CodeSensei', level: 10, xp: 2050, badge: '🥈' },
  { name: 'Haruka.dev', level: 9, xp: 1780, badge: '🥉' },
  { name: 'promptNinja', level: 7, xp: 1350, badge: '⭐' },
  { name: 'yuki_ai', level: 6, xp: 1120, badge: '⭐' },
  { name: 'tanuki42', level: 5, xp: 940, badge: '✨' },
  { name: 'ml_otaku', level: 4, xp: 720, badge: '✨' },
  { name: 'devcat', level: 3, xp: 480, badge: '✨' }
];

function getRanking() {
  return sampleRanking;
}

module.exports = { getRanking, sampleRanking };
