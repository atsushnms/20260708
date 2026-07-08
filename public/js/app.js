/* PromptQuest client-side script
 * - モバイルナビの開閉
 * - 進捗（レベル/XP/クリア/バッジ）を localStorage で管理
 * - クエスト採点 API 呼び出しと結果表示
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'promptquest.progress.v1';

  // ---------- 進捗ストア ----------
  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { xp: 0, cleared: {}, badges: {} };
      var data = JSON.parse(raw);
      return {
        xp: typeof data.xp === 'number' ? data.xp : 0,
        cleared: data.cleared && typeof data.cleared === 'object' ? data.cleared : {},
        badges: data.badges && typeof data.badges === 'object' ? data.badges : {}
      };
    } catch (e) {
      return { xp: 0, cleared: {}, badges: {} };
    }
  }

  function saveProgress(p) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch (e) {
      /* ignore quota / privacy errors */
    }
  }

  // レベルは 500XP ごとに1レベル上昇（レベル1始まり）
  function levelFromXp(xp) {
    return Math.floor(xp / 500) + 1;
  }

  function countKeys(obj) {
    return Object.keys(obj || {}).length;
  }

  // ---------- 進捗の反映 ----------
  function renderProgressSummary() {
    var p = loadProgress();
    var values = {
      level: levelFromXp(p.xp),
      xp: p.xp,
      cleared: countKeys(p.cleared),
      badges: countKeys(p.badges)
    };
    document.querySelectorAll('[data-stat]').forEach(function (el) {
      var key = el.getAttribute('data-stat');
      if (key in values) el.textContent = values[key];
    });

    // ランキングの「あなた」行を表示
    var youRow = document.querySelector('[data-you-row]');
    if (youRow && p.xp > 0) youRow.hidden = false;
  }

  function renderClearedCards() {
    var p = loadProgress();
    document.querySelectorAll('[data-quest-card]').forEach(function (card) {
      var id = card.getAttribute('data-quest-id');
      var badge = card.querySelector('[data-cleared-badge]');
      if (p.cleared[id]) {
        card.classList.add('is-cleared');
        if (badge) badge.hidden = false;
      } else {
        card.classList.remove('is-cleared');
        if (badge) badge.hidden = true;
      }
    });
  }

  function renderBadges() {
    var shelf = document.querySelector('[data-badge-shelf]');
    if (!shelf) return;
    var p = loadProgress();
    var badgeIcons = Object.values(p.badges || {});
    var noBadges = shelf.querySelector('[data-no-badges]');
    if (badgeIcons.length === 0) {
      if (noBadges) noBadges.hidden = false;
      return;
    }
    if (noBadges) noBadges.hidden = true;
    // 既存の動的バッジをクリアしてから再描画
    shelf.querySelectorAll('.earned-badge').forEach(function (n) { n.remove(); });
    badgeIcons.forEach(function (icon) {
      var span = document.createElement('span');
      span.className = 'earned-badge';
      span.textContent = icon;
      shelf.appendChild(span);
    });
  }

  function refreshAll() {
    renderProgressSummary();
    renderClearedCards();
    renderBadges();
  }

  // ---------- モバイルナビ ----------
  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-nav]');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // ---------- マイページ: リセット ----------
  function initReset() {
    var btn = document.querySelector('[data-reset-progress]');
    if (!btn) return;
    var i18nEl = document.getElementById('mypage-i18n');
    var msg = i18nEl ? JSON.parse(i18nEl.textContent).reset_confirm : 'Reset?';
    btn.addEventListener('click', function () {
      if (!window.confirm(msg)) return;
      saveProgress({ xp: 0, cleared: {}, badges: {} });
      refreshAll();
    });
  }

  // ---------- クエスト採点 ----------
  function initQuest() {
    var root = document.querySelector('[data-quest]');
    if (!root) return;

    var form = root.querySelector('[data-eval-form]');
    var input = root.querySelector('#prompt-input');
    var submitBtn = root.querySelector('[data-submit-btn]');
    var submitLabel = root.querySelector('[data-submit-label]');
    var spinner = root.querySelector('[data-spinner]');
    var resultBox = root.querySelector('[data-result]');
    var errorBox = root.querySelector('[data-error]');

    var i18nEl = document.getElementById('quest-i18n');
    var i18n = i18nEl ? JSON.parse(i18nEl.textContent) : {};

    var questId = root.getAttribute('data-quest-id');
    var locale = root.getAttribute('data-locale') || 'ja';

    function setLoading(loading) {
      submitBtn.disabled = loading;
      if (spinner) spinner.hidden = !loading;
      if (submitLabel) submitLabel.textContent = loading ? i18n.loading : i18n.submit;
    }

    function showError(msg) {
      if (!errorBox) return;
      errorBox.textContent = msg;
      errorBox.hidden = false;
    }

    function fillList(el, items) {
      el.innerHTML = '';
      (items || []).forEach(function (item) {
        var li = document.createElement('li');
        li.textContent = item;
        el.appendChild(li);
      });
    }

    function renderResult(data) {
      root.querySelector('[data-score]').textContent = data.score;
      var ring = root.querySelector('[data-score-ring]');
      if (ring) ring.style.setProperty('--score', data.score);

      root.querySelector('[data-feedback]').textContent = data.feedback || '';
      fillList(root.querySelector('[data-strengths]'), data.strengths);
      fillList(root.querySelector('[data-improvements]'), data.improvements);

      var maBlock = root.querySelector('[data-model-answer-block]');
      var ma = root.querySelector('[data-model-answer]');
      if (data.modelAnswer) {
        ma.textContent = data.modelAnswer;
        maBlock.hidden = false;
      } else {
        maBlock.hidden = true;
      }

      var xpBox = root.querySelector('[data-xp-earned]');
      if (data.xpEarned > 0) {
        root.querySelector('[data-xp-value]').textContent = data.xpEarned;
        xpBox.hidden = false;
      } else {
        xpBox.hidden = true;
      }

      resultBox.hidden = false;
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // クエストクリア時の進捗更新（XP は初回クリア時のみ加算）
    function applyProgress(data) {
      if (!data.passed) return;
      var p = loadProgress();
      if (!p.cleared[questId]) {
        p.cleared[questId] = true;
        p.xp += (data.xpEarned || 0);
        if (data.badge) p.badges[questId] = data.badge;
        saveProgress(p);
        refreshAll();
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorBox) errorBox.hidden = true;

      var prompt = (input.value || '').trim();
      if (!prompt) {
        showError(i18n.empty_prompt);
        return;
      }

      setLoading(true);

      fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId: questId, prompt: prompt, locale: locale })
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { ok: res.ok, body: body };
          });
        })
        .then(function (r) {
          if (!r.ok) {
            showError(i18n.error);
            return;
          }
          renderResult(r.body);
          applyProgress(r.body);
        })
        .catch(function () {
          showError(i18n.error);
        })
        .finally(function () {
          setLoading(false);
        });
    });

    var retry = root.querySelector('[data-retry]');
    if (retry) {
      retry.addEventListener('click', function () {
        resultBox.hidden = true;
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initReset();
    initQuest();
    refreshAll();
  });
})();
