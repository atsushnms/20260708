/**
 * クエスト（学習課題）データ。
 * 各クエストは日本語・英語の両方のテキストを持つ。
 * criteria は LLM 採点時の評価観点として使われる。
 */
const quests = [
  {
    id: 'summarize-log',
    difficulty: 'beginner',
    xp: 100,
    badge: '📝',
    category: { ja: '要約', en: 'Summarization' },
    title: {
      ja: 'エラーログを要約せよ',
      en: 'Summarize the error log'
    },
    scenario: {
      ja: '大量のサーバーエラーログが届きました。チームメンバーが状況をすぐ把握できるよう、AIに要約させたいです。',
      en: 'A large batch of server error logs has arrived. You want the AI to summarize them so teammates can grasp the situation quickly.'
    },
    objective: {
      ja: 'AIにエラーログを「原因・影響・推奨される対応」の3点で簡潔に要約させるプロンプトを書いてください。',
      en: 'Write a prompt that makes the AI summarize error logs concisely in three points: cause, impact, and recommended action.'
    },
    hint: {
      ja: '出力の構成（3項目）と、簡潔さ・対象読者を明示すると精度が上がります。',
      en: 'Specify the output structure (3 items), conciseness, and the target reader to improve accuracy.'
    },
    criteria: {
      ja: '出力形式（原因・影響・対応の3点）の指定、簡潔さの要求、対象読者の明示があるか。',
      en: 'Whether it specifies the output format (cause/impact/action), requests conciseness, and states the target reader.'
    }
  },
  {
    id: 'role-persona',
    difficulty: 'beginner',
    xp: 100,
    badge: '🎭',
    category: { ja: 'ロール設定', en: 'Role setting' },
    title: {
      ja: '役割を与えて回答させよ',
      en: 'Assign a role to the AI'
    },
    scenario: {
      ja: 'プログラミング初心者に「再帰関数」を説明してもらいたいです。',
      en: 'You want the AI to explain "recursion" to a programming beginner.'
    },
    objective: {
      ja: 'AIに適切な役割（ペルソナ）と対象読者を設定し、やさしく説明させるプロンプトを書いてください。',
      en: 'Write a prompt that assigns the AI an appropriate role (persona) and audience so it explains gently.'
    },
    hint: {
      ja: '「あなたは〜です」という役割設定と、対象読者のレベル、例え話の指示が有効です。',
      en: 'A role like "You are a ..." plus the audience level and a request for analogies works well.'
    },
    criteria: {
      ja: '役割設定、対象読者のレベル指定、わかりやすさ（例示など）の指示があるか。',
      en: 'Whether it sets a role, specifies the audience level, and asks for clarity (e.g. analogies).'
    }
  },
  {
    id: 'structured-output',
    difficulty: 'intermediate',
    xp: 150,
    badge: '🧩',
    category: { ja: '構造化出力', en: 'Structured output' },
    title: {
      ja: 'JSON形式で出力させよ',
      en: 'Get output in JSON format'
    },
    scenario: {
      ja: '問い合わせメールから「氏名・要望・緊急度」を抽出し、後続システムに渡したいです。',
      en: 'You want to extract "name, request, urgency" from an inquiry email to pass to a downstream system.'
    },
    objective: {
      ja: 'AIに決まったキーを持つJSONだけを出力させ、余計な説明を出さないプロンプトを書いてください。',
      en: 'Write a prompt that makes the AI output only JSON with fixed keys and no extra explanation.'
    },
    hint: {
      ja: 'キー名・型・「JSON以外を出力しない」制約・入力例を明示しましょう。',
      en: 'Specify key names, types, a "no output other than JSON" constraint, and an input example.'
    },
    criteria: {
      ja: 'キー名の指定、JSONのみ出力の制約、抽出対象の明確さがあるか。',
      en: 'Whether it specifies key names, constrains output to JSON only, and clearly defines what to extract.'
    }
  },
  {
    id: 'client-requirements',
    difficulty: 'intermediate',
    xp: 150,
    badge: '📋',
    category: { ja: '要件整理', en: 'Requirements' },
    title: {
      ja: 'クライアント要件を整理せよ',
      en: 'Organize client requirements'
    },
    scenario: {
      ja: '打ち合わせの走り書きメモから、開発チーム向けに要件を整理したいです。',
      en: 'You want to turn rough meeting notes into organized requirements for the dev team.'
    },
    objective: {
      ja: 'AIにメモを「機能要件・非機能要件・不明点（質問リスト）」に分類・整理させるプロンプトを書いてください。',
      en: 'Write a prompt that makes the AI classify notes into functional requirements, non-functional requirements, and open questions.'
    },
    hint: {
      ja: '分類のカテゴリと、曖昧な点を質問として挙げさせる指示を含めましょう。',
      en: 'Include the classification categories and an instruction to raise ambiguities as questions.'
    },
    criteria: {
      ja: '分類カテゴリの指定、不明点の洗い出し指示、抜け漏れ防止の観点があるか。',
      en: 'Whether it specifies categories, instructs surfacing open questions, and considers completeness.'
    }
  },
  {
    id: 'chain-of-thought',
    difficulty: 'advanced',
    xp: 200,
    badge: '🧠',
    category: { ja: '推論設計', en: 'Reasoning' },
    title: {
      ja: '段階的に推論させて誤りを防げ',
      en: 'Guide step-by-step reasoning'
    },
    scenario: {
      ja: '複雑な料金計算（条件分岐あり）をAIに正確に行わせたいです。',
      en: 'You want the AI to accurately perform a complex fee calculation with conditional branches.'
    },
    objective: {
      ja: 'AIに前提条件の確認と段階的な検討を促し、最後に結論を出させるプロンプトを書いてください。',
      en: 'Write a prompt that has the AI verify assumptions, reason step by step, and then give the conclusion.'
    },
    hint: {
      ja: '「手順に分けて考え、各ステップの根拠を示し、最後に結論を述べる」構成を指定しましょう。',
      en: 'Specify a structure: break into steps, show the rationale for each, then state the conclusion.'
    },
    criteria: {
      ja: '段階的推論の指示、前提確認、結論の明示、検証しやすさへの配慮があるか。',
      en: 'Whether it requests step-by-step reasoning, assumption checks, an explicit conclusion, and verifiability.'
    }
  },
  {
    id: 'few-shot',
    difficulty: 'advanced',
    xp: 200,
    badge: '✨',
    category: { ja: 'Few-shot', en: 'Few-shot' },
    title: {
      ja: '例示で出力スタイルを固定せよ',
      en: 'Fix the style with examples'
    },
    scenario: {
      ja: '製品レビューを一定のトーンとフォーマットで返信文に変換したいです。',
      en: 'You want to convert product reviews into replies with a consistent tone and format.'
    },
    objective: {
      ja: 'AIに入力例と理想の出力例（few-shot）を与え、スタイルを固定して変換させるプロンプトを書いてください。',
      en: 'Write a prompt that gives the AI input/ideal-output examples (few-shot) to lock the style.'
    },
    hint: {
      ja: '1〜2組の「入力→出力」例と、守るべきトーン・長さ・禁止事項を示しましょう。',
      en: 'Provide 1–2 "input→output" example pairs and the required tone, length, and prohibitions.'
    },
    criteria: {
      ja: '例示（few-shot）の提示、トーン・フォーマットの明示、一貫性への配慮があるか。',
      en: 'Whether it provides few-shot examples, specifies tone/format, and considers consistency.'
    }
  }
];

const difficultyRank = { beginner: 1, intermediate: 2, advanced: 3 };

function getAllQuests() {
  return quests;
}

function getQuestById(id) {
  return quests.find((q) => q.id === id);
}

function getNextQuestId(id) {
  const idx = quests.findIndex((q) => q.id === id);
  if (idx === -1 || idx === quests.length - 1) return null;
  return quests[idx + 1].id;
}

module.exports = {
  quests,
  difficultyRank,
  getAllQuests,
  getQuestById,
  getNextQuestId
};
