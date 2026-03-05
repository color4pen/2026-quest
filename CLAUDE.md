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
- レビュー観点は `docs/reviews/REVIEW_GUIDELINES.md` を参照
- レビュー記録の保存先:
  - 設計レビュー: `docs/reviews/design/YYYYMMDD-{機能名}.md`
  - 実装レビュー: `docs/reviews/impl/YYYYMMDD-{機能名}.md`
  - コードベースレビュー: `docs/reviews/codebase/YYYYMMDD-{テーマ}.md`
- **レビュー記録は指摘があった場合のみ作成**（LGTMのみの場合は不要）
- **レビュー記録に途中状態（「対応中」等）を書き込まない** - 完了時にのみ記録
- コードベースレビュー起点のタスク完了時は、元のレビューファイルを `✅ 対応済み` に更新しPR番号を記載
- レビュー指摘で新しい観点が追加された場合は `REVIEW_GUIDELINES.md` も更新

## 技術的意思決定（ADR）
- 「後から"なぜこうしたの？"と聞かれそうな判断」は `docs/decisions/` に記録
- フォーマット: ADR（Architecture Decision Records）
- 必須セクション: コンテキスト、決定、検討した代替案、結果
- ADR一覧は `docs/decisions/README.md` を参照
