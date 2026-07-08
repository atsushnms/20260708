const test = require('node:test');
const assert = require('node:assert');

const i18n = require('../src/i18n');
const quests = require('../src/data/quests');
const llm = require('../src/services/llm');

test('i18n: defaults to Japanese and translates keys', () => {
  assert.strictEqual(i18n.DEFAULT_LOCALE, 'ja');
  assert.strictEqual(i18n.translate('ja', 'nav.home'), 'ホーム');
  assert.strictEqual(i18n.translate('en', 'nav.home'), 'Home');
});

test('i18n: unknown key returns the key itself', () => {
  assert.strictEqual(i18n.translate('ja', 'does.not.exist'), 'does.not.exist');
});

test('i18n: normalizeLocale handles variants and fallbacks', () => {
  assert.strictEqual(i18n.normalizeLocale('EN'), 'en');
  assert.strictEqual(i18n.normalizeLocale('en-US'), 'en');
  assert.strictEqual(i18n.normalizeLocale('fr'), 'ja');
  assert.strictEqual(i18n.normalizeLocale(undefined), 'ja');
});

test('i18n: resolveLocale prefers query, then cookie, else Japanese default', () => {
  assert.strictEqual(i18n.resolveLocale({ query: { lang: 'en' } }), 'en');
  assert.strictEqual(i18n.resolveLocale({ query: {}, cookies: { lang: 'en' } }), 'en');
  assert.strictEqual(
    i18n.resolveLocale({ query: {}, cookies: {}, headers: { 'accept-language': 'en-US,en' } }),
    'ja'
  );
  assert.strictEqual(i18n.resolveLocale({ query: {}, cookies: {}, headers: {} }), 'ja');
});

test('i18n: both locales share the same key structure', () => {
  const flatten = (obj, prefix = '') =>
    Object.entries(obj).flatMap(([k, v]) =>
      v && typeof v === 'object'
        ? flatten(v, `${prefix}${k}.`)
        : [`${prefix}${k}`]
    );
  const ja = flatten(i18n.translations.ja).sort();
  const en = flatten(i18n.translations.en).sort();
  assert.deepStrictEqual(ja, en);
});

test('quests: lookup and next quest navigation', () => {
  const all = quests.getAllQuests();
  assert.ok(all.length > 0);
  const first = all[0];
  assert.strictEqual(quests.getQuestById(first.id).id, first.id);
  assert.strictEqual(quests.getNextQuestId(first.id), all[1].id);
  assert.strictEqual(quests.getNextQuestId(all[all.length - 1].id), null);
  assert.strictEqual(quests.getQuestById('missing'), undefined);
});

test('quests: each quest has bilingual fields and criteria', () => {
  for (const q of quests.getAllQuests()) {
    for (const field of ['title', 'scenario', 'objective', 'hint', 'criteria', 'category']) {
      assert.ok(q[field] && q[field].ja && q[field].en, `${q.id} missing ${field}`);
    }
    assert.ok(typeof q.xp === 'number' && q.xp > 0);
  }
});

test('llm: clampScore bounds values to 0-100 integers', () => {
  assert.strictEqual(llm.clampScore(150), 100);
  assert.strictEqual(llm.clampScore(-5), 0);
  assert.strictEqual(llm.clampScore(72.6), 73);
  assert.strictEqual(llm.clampScore('abc'), 0);
});

test('llm: safeParseJson handles fenced and embedded JSON', () => {
  assert.deepStrictEqual(llm.safeParseJson('{"score":80}'), { score: 80 });
  assert.deepStrictEqual(llm.safeParseJson('```json\n{"score":80}\n```'), { score: 80 });
  assert.deepStrictEqual(llm.safeParseJson('prefix {"a":1} suffix'), { a: 1 });
  assert.strictEqual(llm.safeParseJson('not json'), null);
});

test('llm: evaluatePrompt throws NOT_CONFIGURED without token', async () => {
  const original = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;
  try {
    await assert.rejects(
      () => llm.evaluatePrompt({ quest: quests.getAllQuests()[0], userPrompt: 'x', locale: 'ja' }),
      (err) => err.code === 'NOT_CONFIGURED'
    );
  } finally {
    if (original !== undefined) process.env.GITHUB_TOKEN = original;
  }
});
