const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, 'locales');
const DEFAULT_LOCALE = 'ja';
const SUPPORTED_LOCALES = ['ja', 'en'];

const translations = {};
for (const code of SUPPORTED_LOCALES) {
  const file = path.join(LOCALES_DIR, `${code}.json`);
  translations[code] = JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * ドット区切りのキー（例: "nav.home"）で翻訳を取得する。
 * 見つからない場合はキーそのものを返す。
 */
function translate(locale, key) {
  const dict = translations[locale] || translations[DEFAULT_LOCALE];
  const value = key.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) return acc[part];
    return undefined;
  }, dict);
  return value === undefined ? key : value;
}

function normalizeLocale(locale) {
  if (!locale) return DEFAULT_LOCALE;
  const lower = String(locale).toLowerCase();
  if (SUPPORTED_LOCALES.includes(lower)) return lower;
  const base = lower.split('-')[0];
  if (SUPPORTED_LOCALES.includes(base)) return base;
  return DEFAULT_LOCALE;
}

/**
 * リクエストからロケールを決定する。
 * 要件により日本語をデフォルトとするため、明示的な切替（?lang / クッキー）が
 * ない限り常にデフォルト（日本語）を返す。
 * 優先順位: ?lang クエリ > lang クッキー > デフォルト（日本語）
 */
function resolveLocale(req) {
  if (req.query && req.query.lang) return normalizeLocale(req.query.lang);
  if (req.cookies && req.cookies.lang) return normalizeLocale(req.cookies.lang);
  return DEFAULT_LOCALE;
}

module.exports = {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  translations,
  translate,
  normalizeLocale,
  resolveLocale
};
