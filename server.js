require('dotenv').config();

const path = require('path');
const express = require('express');

const i18n = require('./src/i18n');
const questsData = require('./src/data/quests');
const llm = require('./src/services/llm');
const ranking = require('./src/data/ranking');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 軽量なクッキーパーサ（言語設定の保存に利用）
app.use((req, res, next) => {
  const header = req.headers.cookie;
  req.cookies = {};
  if (header) {
    for (const part of header.split(';')) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      req.cookies[key] = decodeURIComponent(value);
    }
  }
  next();
});

// ロケールの解決と、ビューで使えるヘルパの用意
app.use((req, res, next) => {
  const locale = i18n.resolveLocale(req);
  res.locals.locale = locale;
  res.locals.t = (key) => i18n.translate(locale, key);
  res.locals.localeMeta = i18n.translations[locale].meta;
  res.locals.supportedLocales = i18n.SUPPORTED_LOCALES.map(
    (code) => i18n.translations[code].meta
  );
  res.locals.currentPath = req.path;
  res.locals.llmConfigured = llm.isConfigured();
  next();
});

// リダイレクト先はローカルの絶対パスのみ許可（オープンリダイレクト対策）。
// URL を解析してホスト部を切り離し、パス（+クエリ）のみを使う。
// "//evil.com" や "https://evil.com" などの外部ホストは拒否する。
function safeRedirectPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/';
  try {
    const parsed = new URL(value, 'http://localhost');
    if (parsed.origin !== 'http://localhost') return '/';
    return parsed.pathname + parsed.search;
  } catch (_) {
    return '/';
  }
}

// 言語切替: クッキーに保存して元のページへ戻る
app.get('/lang/:code', (req, res) => {
  const code = i18n.normalizeLocale(req.params.code);
  res.cookie('lang', code, {
    maxAge: 1000 * 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: 'lax'
  });
  const back = safeRedirectPath(req.query.redirect);
  res.redirect(back);
});

app.get('/', (req, res) => {
  res.render('home', {
    title: res.locals.t('app.name'),
    quests: questsData.getAllQuests()
  });
});

app.get('/quests', (req, res) => {
  res.render('quests', {
    title: res.locals.t('quests.title'),
    quests: questsData.getAllQuests()
  });
});

app.get('/quests/:id', (req, res, next) => {
  const quest = questsData.getQuestById(req.params.id);
  if (!quest) return next();
  res.render('quest', {
    title: quest.title[res.locals.locale] || quest.title[i18n.DEFAULT_LOCALE],
    quest,
    nextQuestId: questsData.getNextQuestId(quest.id)
  });
});

app.get('/ranking', (req, res) => {
  res.render('ranking', {
    title: res.locals.t('ranking.title'),
    players: ranking.getRanking()
  });
});

app.get('/mypage', (req, res) => {
  res.render('mypage', {
    title: res.locals.t('mypage.title'),
    quests: questsData.getAllQuests()
  });
});

// プロンプト採点 API
app.post('/api/evaluate', async (req, res) => {
  const { questId, prompt } = req.body || {};
  const locale = i18n.normalizeLocale(req.body && req.body.locale) || res.locals.locale;

  const quest = questsData.getQuestById(questId);
  if (!quest) {
    return res.status(404).json({ error: 'quest_not_found' });
  }
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'empty_prompt' });
  }

  try {
    const result = await llm.evaluatePrompt({
      quest,
      userPrompt: prompt.trim(),
      locale
    });
    const passed = result.score >= 60;
    const xpEarned = passed ? quest.xp : Math.round((quest.xp * result.score) / 100 / 10) * 10;
    res.json({
      ...result,
      passed,
      xpEarned,
      badge: quest.badge,
      questXp: quest.xp
    });
  } catch (err) {
    if (err.code === 'NOT_CONFIGURED') {
      return res.status(503).json({ error: 'llm_not_configured' });
    }
    console.error('Evaluation error:', err.message);
    res.status(500).json({ error: 'evaluation_failed' });
  }
});

// 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404',
    message: res.locals.locale === 'en' ? 'Page not found' : 'ページが見つかりません'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`PromptQuest running at http://localhost:${PORT}`);
    if (!llm.isConfigured()) {
      console.warn('[warn] GITHUB_TOKEN is not set. Prompt evaluation will not work until you set it in .env');
    }
  });
}

module.exports = app;
