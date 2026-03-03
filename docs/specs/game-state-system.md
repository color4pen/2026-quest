# ゲーム状態管理システム設計ドキュメント

## 概要

クエスト進行・フラグ管理を数値ベースで統一管理するシステム。0 = 未達成/OFF、1以上 = 達成/ON/進行度。会話の条件分岐・固定敵の出現制御・セーブデータの永続化と連携する。

## アーキテクチャ

```
┌──────────────────────────────────────────────────────┐
│                   GameStateManager                    │
│  private state: Map<StateKey, number>                │
│  - get(key) / set(key, value) / isSet(key)          │
│  - increment(key) / reset()                          │
│  - getState() / restoreState()                       │
└──────────────────────┬───────────────────────────────┘
                       │ 利用
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│DialogueEngine│ │  GameEngine  │ │   SaveManager    │
│(条件分岐)    │ │(固定敵出現)  │ │(永続化)          │
└──────────────┘ └──────────────┘ └──────────────────┘
```

## GameStateManager クラス

```typescript
class GameStateManager {
  private state: Map<StateKey, number> = new Map();

  get(key: StateKey): number;           // 未設定は 0
  set(key: StateKey, value: number): void;  // 0 の場合は削除
  isSet(key: StateKey): boolean;        // 値が 1 以上か
  increment(key: StateKey): number;     // 1 増加して返す
  reset(): void;                        // 全クリア

  // セーブ/ロード
  getState(): Record<string, number>;
  restoreState(savedState: Record<string, number>): void;
}
```

### 設計上のポイント

- `set(key, 0)` は `delete` と等価（0 = 未設定）
- `get()` は未設定キーに対して 0 を返す
- `restoreState()` は 0 の値をスキップする

## STATE_KEYS

```typescript
const STATE_KEYS = {
  // クエスト進行度
  QUEST_FOREST: "quest_forest",

  // 重要アイテム取得
  ITEM_ANCIENT_KEY: "item_ancient_key",

  // マップ訪問
  MAP_DUNGEON_VISITED: "map_dungeon_visited",

  // NPC関連
  NPC_ELDER_FIRST_TALK: "npc_elder_first_talk",
} as const;

type StateKey = typeof STATE_KEYS[keyof typeof STATE_KEYS];
```

## 値定義

```typescript
// 汎用フラグ値
const FLAG = { OFF: 0, ON: 1 } as const;

// 森クエストの進行状態
const QUEST_FOREST = {
  NOT_STARTED: 0,   // 未開始
  ACCEPTED: 1,      // 受注済み
  BOSS_DEFEATED: 2, // ボス撃破済み
  COMPLETED: 3,     // 完了（報酬受取済み）
} as const;
```

## 利用パターン

### 会話の条件分岐

DialogueEngine が `getGameState` コールバック経由で状態を取得し、`conditionalStartIds` で開始ノードを切り替える。

```typescript
// NPC定義
conditionalStartIds: [
  { conditions: [{ key: 'quest_forest', op: '>=', value: 3 }], startId: 'completed' },
  { conditions: [{ key: 'quest_forest', op: '==', value: 2 }], startId: 'reward' },
  { conditions: [{ key: 'quest_forest', op: '==', value: 1 }], startId: 'in_progress' },
],

// 会話中の状態変更
{ action: { type: 'set_state', key: 'quest_forest', value: 1 } }
```

### 固定敵の出現制御

```typescript
// マップ定義
fixedEnemies: [
  {
    x: 10, y: 13,
    templateName: '洞窟の主',
    spawnCondition: { key: 'quest_forest', op: '<', value: 2 },
  },
],
```

### セーブ/ロード

```typescript
// セーブ時
const gameState = gameStateManager.getState();
// → { quest_forest: 1 }

// ロード時
gameStateManager.restoreState(saveData.gameState);
```

## 新しいフラグの追加方法

### Step 1: STATE_KEYS に追加

```typescript
// src/data/stateKeys.ts
export const STATE_KEYS = {
  // ... 既存のキー
  QUEST_TOWER: "quest_tower",
} as const;
```

### Step 2: 値定義を追加（進行度がある場合）

```typescript
export const QUEST_TOWER = {
  NOT_STARTED: 0,
  ENTERED: 1,
  CLEARED: 2,
} as const;
```

### Step 3: NPC会話やマップ定義で使用

```typescript
// conditionalStartIds や spawnCondition で参照
{ key: 'quest_tower', op: '>=', value: 2 }
```

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/models/GameStateManager.ts` | 状態管理クラス |
| `src/data/stateKeys.ts` | キー定義・値定義 |
| `src/engine/GameEngine.ts` | GameStateManager の保持・コールバック設定 |
| `src/engine/DialogueEngine.ts` | 条件付き会話分岐 |
| `src/types/save.ts` | gameState のセーブ型 |
