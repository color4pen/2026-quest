# セーブ/ロードシステム設計ドキュメント

## 概要

localStorage を使用したセーブ/ロードシステム。最大5スロットに対応し、パーティー状態・マップ位置・宝箱開封状態・ゲーム進行フラグを永続化する。バージョニングによる将来のデータ移行にも対応。

## アーキテクチャ

```
┌──────────────────┐      ┌──────────────────┐
│   SaveLoadModal  │      │    PauseMenu     │
│   (タイトル画面) │      │  (ゲーム中セーブ)│
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         ▼                         ▼
┌─────────────────────────────────────────────┐
│              GameEngine                      │
│  save(slotId) / load(slotId)                │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│              SaveManager (static)            │
│  - save() → localStorage.setItem()         │
│  - load() → localStorage.getItem()         │
│  - getSaveSlots() → UI表示用情報           │
│  - migrateSaveData() → バージョン移行      │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│              localStorage                    │
│  key: "rpg_save_slot_0" 〜 "rpg_save_slot_4"│
└─────────────────────────────────────────────┘
```

## 定数

```typescript
const SAVE_VERSION = 1;
const MAX_SAVE_SLOTS = 5;
const SAVE_SLOT_KEY_PREFIX = 'rpg_save_slot_';
```

## データ構造

### SaveData（セーブデータ本体）

```typescript
interface SaveData {
  version: number;
  timestamp: number;
  currentMapId: string;
  playerPosition: { x: number; y: number };
  treasureStates: Record<string, SavedTreasureData[]>;
  party: {
    members: SavedMemberData[];
    gold: number;
    inventory: SavedInventoryItem[];
  };
  gameState: Record<string, number>;
}
```

### SavedMemberData

```typescript
interface SavedMemberData {
  definitionId: string;
  hp: number;
  mp: number;
  level: number;
  xp: number;
  xpToNext: number;
  baseMaxHp: number;
  baseMaxMp: number;
  baseAttack: number;
  baseDefense: number;
  statusEffects: SavedStatusEffectData[];
  equipment: SavedEquipmentData;
}
```

### その他の型

```typescript
interface SavedStatusEffectData {
  type: StatusEffectType;
  remainingTurns: number;
}

interface SavedEquipmentData {
  weapon: string | null;    // アイテムID
  armor: string | null;
  accessory: string | null;
}

interface SavedInventoryItem {
  itemId: string;
  quantity: number;
}

interface SavedTreasureData {
  x: number;
  y: number;
  opened: boolean;
}
```

### SaveSlotInfo（UI表示用）

```typescript
interface SaveSlotInfo {
  slotId: number;
  isEmpty: boolean;
  timestamp: number | null;
  mapName: string | null;
  leaderName: string | null;
  leaderLevel: number | null;
}
```

## SaveManager クラス

全メソッドが `static`。インスタンス不要。

| メソッド | 説明 |
|---------|------|
| `getSaveSlots()` | 全5スロットの情報を取得（UI表示用） |
| `save(slotId, state, mapId, treasureCache, gameState)` | セーブ実行 |
| `load(slotId)` | ロード実行。バージョン不一致時は移行処理 |
| `deleteSave(slotId)` | スロットを削除 |
| `hasData(slotId)` | スロットにデータがあるか |
| `hasSaveData()` | いずれかのスロットにデータがあるか |

## 宝箱状態のキャッシュ

マップ間移動時、現在のマップの宝箱開封状態をキャッシュに保存する。セーブ時にはキャッシュ全体 + 現在マップの状態を結合して保存。

```typescript
// GameEngine 内部
private treasureStatesCache: Record<string, SavedTreasureData[]>;

// マップ切り替え時
this.treasureStatesCache[oldMapId] = currentTreasures.map(t => ({
  x: t.x, y: t.y, opened: t.opened,
}));
```

## バージョン移行

```typescript
private static migrateSaveData(saveData: SaveData): SaveData {
  // 将来のバージョン移行処理をここに追加
  return { ...saveData, version: SAVE_VERSION };
}
```

現在は v1 のみ。将来フィールド追加時に `version` を見て移行処理を分岐する設計。

## セーブ/ロードフロー

```
セーブ:
1. PauseMenu → saveGame(slotId)
2. GameEngine.save(slotId)
3. SaveManager.save(slotId, state, mapId, treasureCache, gameState)
4. JSON.stringify → localStorage.setItem

ロード:
1. SaveLoadModal → loadGame(slotId)
2. GameEngine.load(slotId)
3. SaveManager.load(slotId) → SaveData | null
4. バージョンチェック → migrateSaveData (必要時)
5. GameEngine がマップ・パーティー・宝箱・ゲーム状態を復元
```

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/services/SaveManager.ts` | セーブ/ロードロジック |
| `src/types/save.ts` | セーブデータ型定義・定数 |
| `src/engine/GameEngine.ts` | セーブ/ロードの呼び出し・復元処理 |
| `src/components/SaveLoadModal.tsx` | セーブ/ロードUI |
| `src/components/PauseMenu.tsx` | ポーズメニューからのセーブ |
| `src/components/TitleScreen.tsx` | タイトル画面からのロード |
