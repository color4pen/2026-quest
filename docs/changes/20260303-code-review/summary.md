# コードレビュー対応サマリ

- **レビュー日**: 2026-03-03
- **確認日**: 2026-03-04
- **最終更新**: 2026-03-04
- **レビュー元**: [code-review.md](./code-review.md)

---

## 全体進捗

| カテゴリ | 完了 | 残 | 合計 |
|----------|-----:|---:|-----:|
| バグ修正 (1-x) | 3 | 0 | 3 |
| 設計改善 (2-x) | 8 | 0 | 8 |
| React (3-x) | 8 | 0 | 8 |
| 未使用コード (4) | — | — | 誤り（後述） |
| **合計** | **19** | **0** | **19** |

---

## 完了済み（19件）

| # | 項目 | 修正内容 | 対応日 |
|---|------|----------|--------|
| 1-1 | heal/restoreMp 装備ボーナス | `effectiveMaxHp/Mp` を使用するよう修正 | 03-03 |
| 1-2 | SaveManager leaderName | `getPartyMemberDefinition(id).name` を返すよう修正 | 03-03 |
| 1-3 | BattleEngine 文字列判定 | `processStatusEffectsTurnEnd` に `targetDied` フィールド追加、文字列判定を除去 | 03-04 |
| 2-2 | PartyMember public フィールド | 全フィールドを private + getter に変更、`defend()` メソッド追加 | 03-03 |
| 2-3 | Observer try-catch | GameEngine / BattleEngine / DialogueEngine の `notifyListeners` に追加 | 03-03 |
| 2-4 | BattleEngine setTimeout | `pendingTimers[]` + `scheduleAction()` + `clearPendingTimers()` 実装 | 03-03 |
| 2-1 | GameEngine 責務分割 | MapManager, EncounterManager, InteractionHandler, CameraManager を抽出（998→812行） | 03-04 |
| 2-5 | ステートマシン導入 | `GamePhase` tagged union で battleEngine/dialogueEngine/shopState/isGameOver を統合、`transitionTo` で遷移管理 | 03-04 |
| 2-6 | ItemFactory キャッシュ | インスタンスキャッシュ → 定義データキャッシュに変更、`create()` は毎回新規生成 | 03-04 |
| 2-7 | ManaPoints 負数クランプ | `ManaPoints.of()` に `Math.max(0, current)` 追加 | 03-03 |
| 2-8 | マップ生成のシード化 | `Math.random()` → シード付き疑似乱数（mulberry32, seed=2026）に変更 | 03-04 |
| 2-9 | 防御リセット順序 | `processStatusEffects()` → `resetAllDefend()` の順に修正 | 03-03 |
| 3-1 | 画像ロード管理 | モジュールスコープの `new Image()` → `useImage` カスタムフック（useRef + onload/onerror） | 03-04 |
| 3-2 | GameCanvas 配列ソート | `useMemo` でメモ化 | 03-03 |
| 3-3 | unsafe 型アサーション | `GameObject.zIndex` getter 経由に変更 | 03-03 |
| 3-4 | useEffect 依存配列 | 既に `state.battle, state.dialogue, state.shop, isPaused` に絞り済み（実質完了） | — |
| 3-5 | PauseMenu setTimeout | `useRef` + `useEffect` cleanup 実装 | 03-03 |
| 3-6 | アクセシビリティ | 絵文字に `role="img" aria-label` 付与（PlayerStats, PauseMenu） | 03-04 |
| 3-7 | CSS `--text-muted` | `App.css` の `:root` に `--text-muted: #888` 追加 | 03-03 |
| 3-8 | レスポンシブ対応 | `@media (max-width: 1200px/600px)` メディアクエリ追加済み | 03-03 |

---

## レビュー文書の誤り（セクション4）

| 項目 | レビュー記載 | 実態 |
|------|-------------|------|
| `GrassDecoration` (`game.ts:49-52`) | 未使用 | `GameMap.ts`, `GameCanvas.tsx` で**使用中**。削除不要 |
| `InventoryItem` (`battle.ts:162-165`) | 未使用 | `PauseMenu.tsx`, `BattleModal.tsx`, `party.ts`, `save.ts` で**使用中**。削除不要 |

→ code-review.md のセクション4は誤検知。対応不要。
