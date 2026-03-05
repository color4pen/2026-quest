# ユビキタス言語の統一

## 種別
- [x] リファクタリング

## 概要

DDD観点で命名が揺れている概念を整理し、ドメインの意図を明確にする。

## 対象

### 1. PartyMemberDefinition → PartyMemberTemplate

**現状**: 「定義」という名前だが、実態は「キャラクターの初期テンプレート」
**問題**: Definition は型定義やスキーマと混同しやすい
**変更後**: `PartyMemberTemplate` — テンプレートからインスタンスを生成するという意図が明確

### 2. ~~PartyMemberState → PartyMemberView~~ （スキップ）

**理由**: プロジェクト全体で `getState()` / `XxxState` パターンが統一されている（`Player`, `Inventory`, `CameraManager`, `BattleEngine` など）。`PartyMember` だけ変更すると一貫性が崩れる。`PartyMemberSnapshot` との区別は Snapshot 側の名前で十分。

### 3. GameStateManager → GameProgressManager

**現状**: 「ゲーム状態管理」という名前だが、実態は「クエスト進行フラグ管理」
**問題**: 名前が汎用的すぎて、何を管理しているか分からない
**変更後**: `GameProgressManager` — ゲーム進行度の管理という意図が明確

## 現状分析

### PartyMemberDefinition の使用箇所（12ファイル）
- `types/party.ts` — 型定義
- `data/partyMembers.ts` — データ定義、`PARTY_MEMBER_DEFINITIONS`
- `models/PartyMember.ts` — コンストラクタ引数
- `models/Party.ts` — `addMember` 引数
- `engine/GameEngine.ts` — `getPartyMemberDefinition()`
- `engine/controllers/PartyController.ts` — 使用
- `engine/SaveLoadHandler.ts` — 使用
- `services/SaveManager.ts` — 使用
- `hooks/useGameEngine.ts` — 使用
- `components/SaveLoadModal.tsx` — 使用
- `src/__test-helpers__/factories.ts` — テスト用
- テストファイル各種

### GameStateManager の使用箇所
- `models/GameStateManager.ts` — クラス定義
- `models/index.ts` — エクスポート
- `engine/GameEngine.ts` — 所有・使用、`executeCommands` 内 `setGameState`
- `engine/GameEngine.test.ts` — テスト
- `engine/calculators/types.ts` — `setGameState` コマンド型
- `engine/controllers/DialogueController.ts` — `getGameState`, `setGameState` コールバック
- `types/save.ts` — `gameState` フィールド（**後方互換性のため変更しない**）

## 設計方針

### リネーム方針

| 現在 | 変更後 | 備考 |
|------|--------|------|
| `PartyMemberDefinition` | `PartyMemberTemplate` | 型名 |
| `PARTY_MEMBER_DEFINITIONS` | `PARTY_MEMBER_TEMPLATES` | 定数名 |
| `getPartyMemberDefinition()` | `getPartyMemberTemplate()` | 関数名 |
| `GameStateManager` | `GameProgressManager` | クラス名・ファイル名 |
| `setGameState` (コマンド型) | `setGameProgress` | コマンド型 |
| `getGameState` (コールバック) | `getGameProgress` | コールバック |
| `setGameState` (コールバック) | `setGameProgress` | コールバック |

### 後方互換性

セーブデータの `gameState` フィールド名は変更しない。シリアライズ/デシリアライズ時のキー名を旧名のまま維持することで、既存セーブデータとの互換性を保つ。

## 実装計画

- Step 1: `PartyMemberDefinition` → `PartyMemberTemplate` のリネーム
- Step 2: `GameStateManager` → `GameProgressManager` のリネーム（ファイル名含む）
- Step 3: コマンド型・コールバック名の変更
- Step 4: 型チェック・テスト実行

## 影響範囲

### Step 1: PartyMemberDefinition → PartyMemberTemplate

| ファイル | 変更内容 |
|---------|---------|
| `types/party.ts` | `PartyMemberDefinition` → `PartyMemberTemplate` |
| `data/partyMembers.ts` | 型名、`PARTY_MEMBER_DEFINITIONS` → `PARTY_MEMBER_TEMPLATES`、`getPartyMemberDefinition` → `getPartyMemberTemplate` |
| `models/PartyMember.ts` | コンストラクタ引数の型名 |
| `models/Party.ts` | `addMember` 引数の型名 |
| `engine/GameEngine.ts` | `getPartyMemberDefinition` → `getPartyMemberTemplate` |
| `engine/controllers/PartyController.ts` | import、使用箇所 |
| `engine/SaveLoadHandler.ts` | import、使用箇所 |
| `services/SaveManager.ts` | import、使用箇所 |
| `hooks/useGameEngine.ts` | import、使用箇所 |
| `components/SaveLoadModal.tsx` | import、使用箇所 |
| `src/__test-helpers__/factories.ts` | 型名 |
| テストファイル | 型名 |

### Step 2-3: GameStateManager → GameProgressManager

| ファイル | 変更内容 |
|---------|---------|
| `models/GameStateManager.ts` | ファイル名変更 → `GameProgressManager.ts`、クラス名変更 |
| `models/index.ts` | エクスポート名 |
| `engine/GameEngine.ts` | import、プロパティ名、`executeCommands` 内 `case 'setGameProgress'` |
| `engine/GameEngine.test.ts` | import、使用箇所 |
| `engine/calculators/types.ts` | `setGameState` → `setGameProgress` |
| `engine/controllers/DialogueController.ts` | コールバック名 `getGameState` → `getGameProgress`、`setGameState` → `setGameProgress` |
| `types/save.ts` | **変更なし**（後方互換性維持） |

## 承認
- [ ] 設計レビュー完了
- [ ] 実装開始
