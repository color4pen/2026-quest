# プロジェクトルール

## 言語
- コミットメッセージ: 英語
- PRタイトル・本文: 日本語
- コードコメント: 日本語

## コーディング規約
- テストファイルは対象ファイルと同じディレクトリに `*.test.ts` として配置
- 型定義は `src/types/` に集約
- Actionクラスは `src/models/actions/` に配置

## レビュー
- レビュー時は `docs/reviews/REVIEW_GUIDELINES.md` の観点を参照
- 過去のレビュー履歴は `docs/reviews/YYYYMMDD-{機能名}.md` を参照
- レビュー完了後は履歴を `docs/reviews/` に保存
- レビューは設計と実装でディレクトリを分けて記録:
  - 設計レビュー: `docs/reviews/design/YYYYMMDD-{機能名}.md`
  - 実装レビュー: `docs/reviews/impl/YYYYMMDD-{機能名}.md`
  - コードベースレビュー: `docs/reviews/codebase/YYYYMMDD-{テーマ}.md`
- 設計レビューで指摘があった場合のみ `design/` に履歴を作成
- 実装レビュー（PRレビュー）で指摘があった場合のみ `impl/` に履歴を作成
- **レビュー指摘で新しい観点が追加された場合は `REVIEW_GUIDELINES.md` も更新すること**

### コードベースレビューの更新ルール
- コードベースレビュー（`codebase/`）の指摘事項を対応した場合は、**必ず元のレビューファイルを更新する**
- ステータス: `🔄 対応中` → `✅ 対応済み`（PR番号を記載）
- 新しい指摘が出た場合は該当するレビューファイルに追記する
- 設計レビューを行った場合は `design/` にも記録を残す

## 技術的意思決定（ADR）
- 「後から"なぜこうしたの？"と聞かれそうな判断」は `docs/decisions/` に記録
- フォーマット: ADR（Architecture Decision Records）
- 必須セクション: コンテキスト、決定、検討した代替案、結果
- ADR一覧は `docs/decisions/README.md` を参照
