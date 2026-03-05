# コードベースレビュー: DDD観点

- **日付**: 2026-03-05
- **レビュアー**: ユーザー
- **対象**: コードベース全体（DDD設計原則）

## 指摘事項

### 1. ドメイン層の依存関係（必須修正）✅ 対応済み

`Player`, `Enemy` などがプレゼンテーション層（`components/game/`）に依存していた。

**対応**: PR #7 で `models/base/GameEntity` を作成し、描画ロジックを `GameCanvas` に移動。

### 2. 型定義とデータ定数の混在（推奨修正）✅ 対応済み

`ENEMY_TEMPLATES` が `types/battle.ts` に配置されていた。

**対応**: PR #8 で `data/enemyTemplates.ts` に移動。

### 3. restoreState の引数過多（推奨修正）✅ 対応済み

`PartyMember.restoreState()` が9個のプリミティブ引数を取っていた。

**対応**: PR #10 で `PartyMemberSnapshot` 型を導入。

### 4. ユビキタス言語の不統一（推奨修正）🔄 対応中

以下の命名が揺れている：
- `PartyMemberDefinition` → `PartyMemberTemplate`
- `PartyMemberState` → `PartyMemberView`
- `GameStateManager` → `GameProgressManager`

**対応**: 設計ドキュメント作成済み、承認待ち。

### 5. GameEntity.nextId の静的カウンター（軽微）

ID生成が静的カウンターで、テスト間で状態が共有される可能性。

**対応**: 今後の課題として認識。
