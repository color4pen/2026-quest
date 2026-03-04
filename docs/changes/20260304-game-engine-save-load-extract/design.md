# GameEngine Save/Load 抽出設計

## 概要

GameEngine.ts (821行) から Save/Load 関連処理 (~150行) を抽出し、テスト可能な形に分離する。

## 現状分析

### GameEngine.ts の責務分布

| 責務 | 行数 | 抽出候補 |
|-----|-----|---------|
| Core State Management | ~100 | - |
| Movement & Map | ~100 | 既にMapManager等へ委譲済み |
| Battle Bridge | ~50 | 薄いラッパー、効果小 |
| Dialogue Bridge | ~50 | 薄いラッパー、効果小 |
| Shop | ~45 | 薄いラッパー、効果小 |
| Field Actions | ~50 | Party委譲済み |
| Party Management | ~25 | - |
| Game State | ~25 | - |
| **Save/Load** | **~150** | **✅ 抽出対象** |
| Command Execution | ~30 | - |

### Save/Load 関連メソッド (638-820行)

```
getSaveSlots()           - SaveManager委譲
save()                   - 状態収集 → SaveManager
load()                   - SaveManager → 復元
restoreFromSaveData()    - 状態復元の統括
restorePartyFromSaveData() - パーティ復元（副作用多）
```

## 設計方針

### 抽出クラス: `SaveLoadHandler`

SaveManager（永続化）とGameEngine（状態管理）の中間層として機能。

```
src/engine/
├── SaveLoadHandler.ts      # NEW: Save/Load処理
├── SaveLoadHandler.test.ts # NEW: テスト
└── GameEngine.ts           # 150行削減
```

### インターフェース設計

```typescript
// SaveLoadHandler.ts

interface SaveContext {
  state: GameEngineState;
  currentMapId: string;
  treasureStatesCache: Record<string, TreasureState[]>;
  gameState: Record<string, number>;
}

interface RestoreResult {
  success: boolean;
  error?: string;
  // 復元に必要なデータ（GameEngineが適用）
  data?: {
    treasureStatesCache: Record<string, TreasureState[]>;
    gameState: Record<string, number>;
    mapId: string;
    playerPosition: { x: number; y: number };
    partyData: SavedPartyData;
  };
}

export class SaveLoadHandler {
  // スロット情報取得（純粋委譲）
  getSaveSlots(): SaveSlotInfo[];

  // セーブ（context収集はGameEngine、永続化はSaveManager）
  save(slotId: number, context: SaveContext): boolean;

  // ロード（データ取得と検証）
  load(slotId: number): RestoreResult;

  // パーティ復元コマンド生成（純粋関数）
  createPartyRestoreCommands(partyData: SavedPartyData): PartyRestoreCommand[];
}
```

### 純粋関数の抽出

副作用の多い `restorePartyFromSaveData` を分解:

```typescript
// 純粋関数（テスト可能）
function validateSaveData(data: SaveData): ValidationResult;
function createMemberRestoreData(memberData: SavedMemberData): MemberRestoreData | null;

// 副作用を持つ適用処理（GameEngine側）
function applyRestoreData(party: Party, data: MemberRestoreData): void;
```

## 実装計画

### Step 1: SaveLoadHandler 作成
- SaveManager への委譲
- save() の context 受け取り
- load() の検証とデータ返却

### Step 2: 純粋関数テスト追加
- validateSaveData のテスト
- createMemberRestoreData のテスト

### Step 3: GameEngine 統合
- SaveLoadHandler を使用するよう変更
- 150行削減

## 期待される効果

| 指標 | Before | After |
|-----|--------|-------|
| GameEngine.ts | 821行 | ~670行 |
| テスト可能な純粋関数 | 0 | 3-4関数 |
| Save/Load単体テスト | 0 | 8-10テスト |

## 代替案

### 案A: SaveManager拡張
SaveManager自体に復元ロジックを追加。
→ 却下: SaveManagerは永続化のみに専念すべき

### 案B: Command Pattern完全適用
restorePartyFromSaveData を全てコマンドに変換。
→ 却下: 装備復元など順序依存があり複雑化

### 案C: 現状維持
副作用が多く抽出困難なため見送り。
→ 却下: 150行の削減効果は大きい

## 承認

- [ ] 設計レビュー完了
- [ ] 実装開始
