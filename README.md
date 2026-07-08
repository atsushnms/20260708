# 🚀 PromptQuest

**遊んで学ぶ、プロンプトの冒険** — ゲーム形式で生成AIのプロンプトスキルを学べる学習Webサイトのプロトタイプです。

エンジニア向けに、クエスト（課題）形式でプロンプト作成を練習し、**LLM（GitHub Models）がその場でプロンプトを採点・フィードバック**します。経験値やバッジを獲得しながら、初級から上級まで段階的にスキルアップできます。

> このリポジトリはプロトタイプです。ユーザー認証はありません。

---

## ✨ 主な機能

- **クエスト形式の課題**: 要約 / ロール設定 / 構造化出力 / 要件整理 / 段階的推論 / Few-shot など、実務に近いシナリオを用意（初級・中級・上級）。
- **AIによる即時フィードバック**: 入力したプロンプトを LLM が採点（0〜100点）し、良かった点・改善点・回答例を提示します。
- **ゲーム要素（報酬システム）**: 経験値（XP）・レベル・バッジを獲得し、成長を可視化。進捗はブラウザの `localStorage` に保存されます。
- **ランキング**: サンプルのランキングを表示（プロトタイプ）。
- **日本語 / 英語の2か国語対応**: ワンクリックで切替可能。**デフォルトは日本語**。
- **モダンで明るいレスポンシブUI**: モバイル対応、アクセシビリティに配慮したデザイン。

---

## 🛠 技術スタック

- **バックエンド**: Node.js + Express
- **ビュー**: EJS（サーバーサイドレンダリング）
- **フロントエンド**: HTML / CSS / Vanilla JavaScript（AJAX / Fetch による非同期採点）
- **LLM**: [GitHub Models](https://github.com/marketplace/models)（OpenAI 互換 API、`openai` SDK を利用）
- **i18n**: JSON リソースファイル（`src/locales/ja.json`, `src/locales/en.json`）

---

## 📁 プロジェクト構成

```
.
├── server.js                 # Express アプリのエントリポイント / ルーティング / 採点API
├── package.json
├── .env.example              # 環境変数のサンプル（コピーして .env を作成）
├── .gitignore
├── src/
│   ├── i18n.js               # 多言語（日本語/英語）のリゾルバと翻訳ヘルパ
│   ├── locales/
│   │   ├── ja.json           # 日本語リソース
│   │   └── en.json           # 英語リソース
│   ├── data/
│   │   ├── quests.js         # クエスト（課題）データ
│   │   └── ranking.js        # サンプルランキング
│   └── services/
│       └── llm.js            # GitHub Models を使ったプロンプト採点
├── views/                    # EJS テンプレート
│   ├── home.ejs
│   ├── quests.ejs
│   ├── quest.ejs
│   ├── ranking.ejs
│   ├── mypage.ejs
│   ├── error.ejs
│   └── partials/             # head / header / footer / quest-card
├── public/                   # 静的ファイル
│   ├── css/style.css         # UI スタイル
│   └── js/app.js             # クライアントJS（採点呼び出し・進捗管理・ナビ）
└── tests/                    # node:test によるテスト
    ├── unit.test.js
    └── routes.test.js
```

---

## 🚀 セットアップと起動

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. GitHub Models トークンの設定

`.env.example` をコピーして `.env` を作成し、GitHub の Personal Access Token を設定します。

```bash
cp .env.example .env
```

`.env` を編集:

```dotenv
# `models:read` 権限を持つ GitHub Personal Access Token
GITHUB_TOKEN=your_github_personal_access_token_here

# GitHub Models の OpenAI 互換エンドポイント
GITHUB_MODELS_ENDPOINT=https://models.github.ai/inference

# 使用するモデル
GITHUB_MODELS_MODEL=openai/gpt-4o-mini

# サーバーのポート
PORT=3000
```

> **トークンの取得方法**
> GitHub の [Personal access tokens](https://github.com/settings/tokens) から、`models:read` 権限を持つトークンを発行してください。
> 詳細は [GitHub Models のドキュメント](https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models)を参照してください。
>
> ⚠️ `.env` は `.gitignore` に含まれており、コミットされません。トークンを絶対にリポジトリに含めないでください。

### 3. サーバーの起動

```bash
npm start
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

開発時はファイル変更を監視して自動再起動できます:

```bash
npm run dev
```

---

## 🧪 テスト

```bash
npm test
```

`node:test` を用いた単体テスト（i18n・クエストデータ・採点ロジック）とルートテスト（HTTP レスポンス）が実行されます。テストはネットワークに依存しません。

---

## 🎮 遊び方

1. ホームまたは「クエスト」からクエストを選びます。
2. ミッションとシナリオを読み、生成AIへの指示（プロンプト）を入力します。
3. **「プロンプトを提出して採点」** を押すと、LLM が採点し、スコア・フィードバック・改善点を表示します。
4. スコアが 60 点以上でクリア。経験値とバッジを獲得できます（進捗はこの端末に保存されます）。
5. マイページで進捗やバッジを確認できます。

---

## 🌐 多言語対応について

- 画面右上の言語スイッチ（`JA` / `EN`）でワンクリック切替が可能です。
- 選択した言語はクッキーに保存され、次回以降も維持されます。
- **明示的に切り替えない限り、デフォルトは日本語**です。
- 採点時のフィードバックも選択言語で返されます。

---

## 📚 参考

- 要件定義要約: [`documents/Summary-Requirements-prompt-learning-site.md`](documents/Summary-Requirements-prompt-learning-site.md)

---

## 📝 ライセンス

MIT