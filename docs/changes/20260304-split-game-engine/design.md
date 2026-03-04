# GameEngine分割リファクタリング

## 概要

GameEngine.ts（822行）を責務ごとに小さなコントローラークラスに分割し、保守性と可読性を向上させる。

## 現状分析

### 対象ファイル
- `src/engine/GameEngine.ts`: 822行

### 現在の責務（セクション別）
| セクション | 行数 | 責務 |
|-----------|------|------|
| インポート・型定義 | 1-72 | 依存関係、GamePhase型、GameEngineState |
| コンストラクタ・初期化 | 73-138 | インスタンス生成、initialize() |
| マップ・移動 | 140-276 | loadMap, move, カメラ更新, インタラクション |
| バトル関連 | 278-327 | startBattle, selectCommand, closeBattle |
| 会話関連 | 329-377 | startDialogue, selectChoice, advanceDialogue |
| ショップ関連 | 379-421 | openShop, buyItem, closeShop |
| フィールドアイテム・装備 | 423-474 | useFieldItem, equipItem, unequipItem |
| 回復（宿屋） | 476-487 | handleHeal |
| ユーティリティ | 489-611 | reset, addMessage, getState, subscribe, executeCommands |
| パーティー管理 | 613-638 | recruitMember, getParty |
| セーブ・ロード | 640-820 | save, load, applyRestoreData |

### 問題点
1. **単一責任の原則違反**: 1クラスに多すぎる責務
2. **高い結合度**: バトル・会話・ショップ・セーブが密結合
3. **テスト困難**: 個別機能のユニットテストが難しい
4. **拡張性の低下**: 新機能追加時に肥大化が進む

## 設計方針

### 抽出するコントローラー

既存のサブマネージャー（MapManager, CameraManager等）は維持し、**GameEngine内のフェーズ制御ロジック**を分離する。

```
GameEngine (オーケストレーター: ~250行)
├── BattleController (バトルフェーズ制御: ~80行)
├── DialogueController (会話フェーズ制御: ~80行)
├── ShopController (ショップフェーズ制御: ~60行)
├── ExplorationController (移動・インタラクション: ~100行)
├── PartyController (パーティー・装備・アイテム: ~80行)
└── MessageManager (メッセージログ管理: ~40行)
```

### 新しいアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│  GameEngine (Facade / Orchestrator)                     │
│  - フェーズ管理 (GamePhase)                              │
│  - 状態キャッシュ                                        │
│  - リスナー通知                                          │
│  - コントローラー間の調整                                 │
└─────────────────────────────────────────────────────────┘
         │
         ├── ExplorationController
         │     └── 移動、インタラクション判定、エンカウント
         │
         ├── BattleController
         │     └── バトル開始/終了、コマンド委譲
         │
         ├── DialogueController
         │     └── 会話開始/終了、選択肢処理
         │
         ├── ShopController
         │     └── ショップ開始/終了、購入処理
         │
         ├── PartyController
         │     └── メンバー追加、装備変更、アイテム使用
         │
         └── MessageManager
               └── メッセージ追加、ログ管理
```

### インターフェース設計

```typescript
// 共通コンテキスト（コントローラーに渡す依存）
interface GameContext {
  party: Party;
  player: Player;
  mapManager: MapManager;
  gameStateManager: GameStateManager;
  addMessage: (text: string, type: MessageType) => void;
  executeCommands: (commands: GameCommand[]) => void;
  transitionTo: (phase: GamePhase) => void;
  notifyListeners: () => void;
  markDirty: () => void;
}

// 各コントローラーのインターフェース
interface ExplorationController {
  move(direction: Direction): void;
  getGameObjects(): GameObject[];
}

interface BattleController {
  start(enemies: Enemy[]): void;
  selectCommand(command: BattleCommand): void;
  useSkill(skill: SkillDefinition): void;
  useItem(itemId: string): void;
  cancelSelection(): void;
  selectTarget(targetIndex: number): void;
  close(): void;
  getState(): BattleState | null;
}

interface DialogueController {
  start(npc: NPC): void;
  selectChoice(choice: DialogueChoice): void;
  advance(): void;
  close(): void;
  getState(): DialogueState | null;
}

interface ShopController {
  open(npc: NPC): void;
  buyItem(item: ShopItem): boolean;
  close(): void;
  getState(): ShopState | null;
}

interface PartyController {
  recruitMember(definition: PartyMemberDefinition): boolean;
  useFieldItem(itemId: string, targetMemberId?: string): Result;
  equipItem(memberId: string, itemId: string): Result;
  unequipItem(memberId: string, slot: EquipSlot): Result;
}

interface MessageManager {
  add(text: string, type: MessageType): void;
  getMessages(): Message[];
  clear(): void;
}
```

### 純粋関数 vs 副作用

| コンポーネント | 純粋関数 | 副作用 |
|---------------|---------|--------|
| MessageManager | - | add(), clear() |
| ExplorationController | - | move(), checkEncounter() |
| BattleController | - | start(), close() |
| DialogueController | - | start(), close() |
| ShopController | calculatePurchase() | buyItem() |
| PartyController | - | equipItem(), useItem() |

既存のCalculator（BattleCalculator, ShopCalculator, DialogueCalculator）は純粋関数として維持。

## 実装計画

### Step 1: MessageManager抽出
- メッセージ追加・管理ロジックを分離
- GameEngineから委譲

### Step 2: ExplorationController抽出
- move(), checkEncounter(), getGameObjects()を移動
- インタラクション処理を含む

### Step 3: BattleController抽出
- バトル開始/終了/コマンドをラップ
- BattleEngineへの委譲を管理

### Step 4: DialogueController抽出
- 会話開始/終了/選択をラップ
- DialogueEngineへの委譲を管理

### Step 5: ShopController抽出
- ショップ開始/終了/購入を管理

### Step 6: PartyController抽出
- メンバー追加、装備変更、アイテム使用を管理

### Step 7: GameEngineリファクタリング
- コントローラーを組み合わせるFacadeに変換
- 公開APIは維持（後方互換性）

### Step 8: テスト追加・修正
- 各コントローラーのユニットテスト追加
- 既存GameEngine.test.tsの修正

## 期待される効果

| 指標 | Before | After |
|-----|--------|-------|
| GameEngine.ts行数 | 822行 | ~250行 |
| 最大クラス行数 | 822行 | ~100行 |
| 責務数/クラス | 8+ | 1-2 |
| テストカバレッジ | 低 | 高（個別テスト可能）|

## ファイル構成（After）

```
src/engine/
├── GameEngine.ts              # Facade (~250行)
├── controllers/
│   ├── ExplorationController.ts
│   ├── BattleController.ts
│   ├── DialogueController.ts
│   ├── ShopController.ts
│   ├── PartyController.ts
│   └── index.ts
├── MessageManager.ts
├── BattleEngine.ts           # 既存（変更なし）
├── DialogueEngine.ts         # 既存（変更なし）
├── MapManager.ts             # 既存（変更なし）
├── CameraManager.ts          # 既存（変更なし）
├── ... (その他既存ファイル)
```

## リスク・注意点

1. **後方互換性**: GameEngineの公開APIは維持する
2. **循環依存**: コントローラー間の依存に注意
3. **パフォーマンス**: コンテキスト受け渡しのオーバーヘッドは最小限

## 承認

- [x] 設計レビュー完了
- [x] 実装完了
