const OpenAI = require('openai');

const ENDPOINT = process.env.GITHUB_MODELS_ENDPOINT || 'https://models.github.ai/inference';
const MODEL = process.env.GITHUB_MODELS_MODEL || 'openai/gpt-4o-mini';

let client = null;

/**
 * GitHub Models（OpenAI 互換エンドポイント）用のクライアントを生成する。
 * トークンが未設定の場合は null を返す。
 */
function getClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  if (!client) {
    client = new OpenAI({ baseURL: ENDPOINT, apiKey: token });
  }
  return client;
}

function isConfigured() {
  return Boolean(process.env.GITHUB_TOKEN);
}

/**
 * JSON文字列を安全にパースする。コードフェンス付きにも対応。
 */
function safeParseJson(text) {
  if (!text) return null;
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * ユーザーのプロンプトを LLM に採点させる。
 * @param {object} params
 * @param {object} params.quest 対象クエスト
 * @param {string} params.userPrompt ユーザーが書いたプロンプト
 * @param {string} params.locale 'ja' | 'en'（フィードバックの言語）
 * @returns {Promise<{score:number, feedback:string, strengths:string[], improvements:string[], modelAnswer:string}>}
 */
async function evaluatePrompt({ quest, userPrompt, locale }) {
  const ai = getClient();
  if (!ai) {
    const err = new Error('GITHUB_TOKEN is not configured');
    err.code = 'NOT_CONFIGURED';
    throw err;
  }

  const lang = locale === 'en' ? 'en' : 'ja';
  const objective = quest.objective[lang];
  const scenario = quest.scenario[lang];
  const criteria = quest.criteria[lang];

  const systemPrompt = lang === 'en'
    ? 'You are a strict but encouraging instructor who teaches prompt engineering for generative AI. You evaluate the learner\'s prompt against the mission and criteria, and you always respond in English. Respond ONLY with a valid JSON object, no markdown, no extra text.'
    : 'あなたは生成AIのプロンプトエンジニアリングを教える、厳しくも励ましてくれる講師です。学習者のプロンプトをミッションと評価基準に照らして評価し、必ず日本語で回答します。回答は必ず有効なJSONオブジェクトのみとし、マークダウンや余分な文章を含めないでください。';

  const schemaHint = lang === 'en'
    ? `Return JSON with this shape:
{
  "score": <integer 0-100>,
  "feedback": "<one short paragraph of overall feedback>",
  "strengths": ["<strength>", "..."],
  "improvements": ["<concrete improvement>", "..."],
  "modelAnswer": "<what the AI would likely output if given the learner's prompt, kept brief>"
}`
    : `次の形のJSONを返してください:
{
  "score": <0〜100の整数>,
  "feedback": "<全体的な講評を短い段落で>",
  "strengths": ["<良かった点>", "..."],
  "improvements": ["<具体的な改善点>", "..."],
  "modelAnswer": "<学習者のプロンプトをAIに与えた場合に出力されそうな回答を簡潔に>"
}`;

  const userContent = lang === 'en'
    ? `# Mission\n${objective}\n\n# Scenario\n${scenario}\n\n# Evaluation criteria\n${criteria}\n\n# Learner's prompt\n"""\n${userPrompt}\n"""\n\n${schemaHint}`
    : `# ミッション\n${objective}\n\n# シナリオ\n${scenario}\n\n# 評価基準\n${criteria}\n\n# 学習者のプロンプト\n"""\n${userPrompt}\n"""\n\n${schemaHint}`;

  const completion = await ai.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]
  });

  const content = completion.choices?.[0]?.message?.content || '';
  const parsed = safeParseJson(content);

  if (!parsed) {
    return {
      score: 0,
      feedback: content || (lang === 'en' ? 'Could not parse the evaluation.' : '評価結果を解析できませんでした。'),
      strengths: [],
      improvements: [],
      modelAnswer: ''
    };
  }

  return {
    score: clampScore(parsed.score),
    feedback: typeof parsed.feedback === 'string' ? parsed.feedback : '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
    modelAnswer: typeof parsed.modelAnswer === 'string' ? parsed.modelAnswer : ''
  };
}

module.exports = {
  evaluatePrompt,
  isConfigured,
  safeParseJson,
  clampScore,
  MODEL,
  ENDPOINT
};
