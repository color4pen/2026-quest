# 設計レビュー: ユビキタス言語に基づく命名リファクタリング

- **日付**: 2026-03-05
- **対象**: `docs/changes/20260305-ubiquitous-language/design.md`
- **レビュアー**: ユーザー
- **結果**: 承認（修正後）

---

## 初回レビュー指摘事項

### 1. `PartyMemberState → PartyMemberView` は `getState()` パターンとの一貫性を壊す（必須修正）

**問題**: コードベース全体で `getState()` が `XxxState` 型を返すパターンが確立している。
`PartyMemberState` だけを `PartyMemberView` に変更すると、このパターンが崩れる。

**解決**: `PartyMemberState → PartyMemberView` の変更をスキップ。

### 2. `GameProgressManager` の影響範囲が不足（必須修正）

**問題**: 設計書に以下の影響箇所が漏れていた:
- コマンド型 (`setGameState` → `setGameProgress`)
- コールバック名 (`getGameState`/`setGameState` → `getGameProgress`/`setGameProgress`)
- `types/save.ts` の `gameState` フィールド（後方互換性）

**解決**: 影響範囲を追記。`types/save.ts` の `gameState` フィールドは後方互換性のため変更しない方針を明記。

---

## 最終設計

- `PartyMemberDefinition` → `PartyMemberTemplate`
- `GameStateManager` → `GameProgressManager`
- コマンド型・コールバック名も統一
- `PartyMemberState` は変更しない
- セーブデータの `gameState` フィールドは互換性維持

---

## 承認

設計レビュー指摘2点が適切に反映され、LGTM となった。
