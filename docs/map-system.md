# マップシステム設計ドキュメント

## 概要

本ゲームのマップシステムはタイルベースの設計を採用しています。各マップは2次元配列のタイルで構成され、ワープポイント・扉・NPC・宝箱などのオブジェクトを配置できます。カメラ追従により、マップサイズに制限なく大規模なフィールドも表現可能です。

## アーキテクチャ

```
src/
├── types/
│   └── game.ts                 # マップ関連型定義
│
├── models/
│   ├── GameMap.ts              # マップ管理クラス
│   ├── Door.ts                 # 条件付き扉クラス
│   └── conditions/             # 通過条件
│       ├── PassCondition.ts    # インターフェース
│       ├── NoInfluenzaCondition.ts
│       └── ConditionFactory.ts
│
├── data/
│   └── maps.ts                 # マップ定義データ
│
└── engine/
    └── GameEngine.ts           # マップ管理・遷移処理
```

## クラス図

```
┌─────────────────────────────────────────────────────────────────┐
│                         GameMap                                  │
├─────────────────────────────────────────────────────────────────┤
│ - id: string                                                    │
│ - name: string                                                  │
│ - tiles: TileType[][]                                          │
│ - grassDecorations: (GrassDecoration[] | null)[][]             │
│ - warps: WarpPoint[]                                           │
│ - doors: Door[]                                                │
│ - encounter: EncounterConfig | undefined                       │
├─────────────────────────────────────────────────────────────────┤
│ + loadFromDefinition(definition: MapDefinition): void          │
│ + generate(): void                   // ランダム生成（後方互換）  │
│ + getTile(position): TileType | null                           │
│ + setTile(position, tile): void                                │
│ + isValidPosition(position): boolean                           │
│ + isWalkable(position): boolean                                │
│ + getBlockedReason(position): string | null                    │
│ + getWarpAt(position): WarpPoint | undefined                   │
│ + getDoorAt(position): Door | undefined                        │
│ + getEncounter(): EncounterConfig | undefined                  │
│ + getState(): GameMapState                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                           Door                                   │
├─────────────────────────────────────────────────────────────────┤
│ + id: string                                                    │
│ + position: Position                                            │
│ - condition: PassCondition | null                               │
├─────────────────────────────────────────────────────────────────┤
│ + isAt(position): boolean                                       │
│ + canPass(party: Party): boolean                                │
│ + getBlockedMessage(): string                                   │
│ + hasCondition(): boolean                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PassCondition (interface)                    │
├─────────────────────────────────────────────────────────────────┤
│ + type: string                                                  │
│ + canPass(party: Party): boolean                                │
│ + getBlockedMessage(): string                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ implements
                ┌─────────────┴─────────────┐
                │                           │
    ┌───────────────────┐      ┌───────────────────┐
    │NoInfluenzaCondition│      │  (将来拡張用)     │
    └───────────────────┘      └───────────────────┘
```

## 型定義

### TileType（タイル種別）

```typescript
type TileType =
  // 基本タイル
  | 'grass'       // 草地（エンカウントあり）
  | 'path'        // 道（エンカウントなし）
  | 'floor'       // 室内床
  | 'sand'        // 砂地

  // 通行不可タイル
  | 'tree'        // 木
  | 'water'       // 水
  | 'wall'        // 壁

  // 特殊タイル
  | 'stairs'      // 階段（ワープポイント）
  | 'door'        // 扉
  | 'bridge'      // 橋（水上を通過可能）

  // 2x2オブジェクト（村）
  | 'village_tl' | 'village_tr'
  | 'village_bl' | 'village_br'

  // 2x2オブジェクト（洞窟）
  | 'cave_tl' | 'cave_tr'
  | 'cave_bl' | 'cave_br';
```

### MapDefinition（マップ定義）

```typescript
interface MapDefinition {
  id: string;                    // マップ識別子
  name: string;                  // 表示名
  tiles: TileType[][];           // タイル配列
  playerStart: Position;         // プレイヤー初期位置
  npcs?: NPCPlacement[];         // NPC配置
  treasures?: TreasurePlacement[];  // 宝箱配置
  warps?: WarpPoint[];           // ワープポイント
  doors?: DoorPlacement[];       // 条件付き扉
  encounter?: EncounterConfig;   // エンカウント設定（なければ安全地帯）
}
```

### WarpPoint（ワープポイント）

```typescript
interface WarpPoint {
  x: number;       // ワープ元X座標
  y: number;       // ワープ元Y座標
  toMapId: string; // 移動先マップID
  toX: number;     // 移動先X座標
  toY: number;     // 移動先Y座標
}
```

### EncounterConfig（エンカウント設定）

```typescript
interface EncounterConfig {
  rate: number;        // エンカウント率（0.0〜1.0）
  enemyIds: string[];  // 出現する敵の名前リスト
}
```

### DoorPlacement（扉配置）

```typescript
interface DoorPlacement {
  id: string;         // 扉の識別子
  x: number;
  y: number;
  condition?: string; // 通過条件タイプ（'no_influenza' など）
}
```

## GameMapクラス

### 主要メソッド

| メソッド | 説明 |
|---------|------|
| `loadFromDefinition(def)` | MapDefinitionからマップをロード |
| `generate()` | ランダムマップを生成（後方互換用） |
| `getTile(position)` | 指定座標のタイルを取得 |
| `setTile(position, tile)` | 指定座標のタイルを設定 |
| `isValidPosition(position)` | 座標がマップ範囲内かチェック |
| `isWalkable(position)` | 通行可能かチェック |
| `getBlockedReason(position)` | 通行不能な理由メッセージを取得 |
| `getWarpAt(position)` | 指定座標のワープポイントを取得 |
| `getDoorAt(position)` | 指定座標の扉を取得 |
| `getEncounter()` | エンカウント設定を取得 |
| `getState()` | React用の状態を取得 |

### 通行判定

```typescript
public isWalkable(position: Position): boolean {
  const tile = this.getTile(position);
  if (tile === null) return false;

  // 通行不可タイル
  const blockedTiles: TileType[] = ['water', 'tree', 'wall'];
  return !blockedTiles.includes(tile);
}
```

### 草地の装飾

草地タイルには自動的に装飾（小さな草）が生成されます。

```typescript
private generateGrassDecorations(): GrassDecoration[] {
  return [
    { x: Math.random() * TILE_SIZE, y: Math.random() * TILE_SIZE },
    { x: Math.random() * TILE_SIZE, y: Math.random() * TILE_SIZE },
    { x: Math.random() * TILE_SIZE, y: Math.random() * TILE_SIZE },
  ];
}
```

## 扉システム

### Doorクラス

扉は条件付きの通過ポイントです。条件がなければ常に通過可能。

```typescript
class Door {
  constructor(placement: DoorPlacement) {
    this.id = placement.id;
    this.position = { x: placement.x, y: placement.y };
    this.condition = placement.condition
      ? ConditionFactory.create(placement.condition as ConditionType)
      : null;
  }

  canPass(party: Party): boolean {
    if (!this.condition) return true;
    return this.condition.canPass(party);
  }

  getBlockedMessage(): string {
    if (!this.condition) return '';
    return this.condition.getBlockedMessage();
  }
}
```

### PassCondition インターフェース

```typescript
interface PassCondition {
  readonly type: string;
  canPass(party: Party): boolean;
  getBlockedMessage(): string;
}
```

### 実装済み条件

| 条件 | 説明 | 使用例 |
|------|------|--------|
| `no_influenza` | インフルエンザが治っていること | 自宅の扉 |

### ConditionFactory

```typescript
class ConditionFactory {
  static create(type: ConditionType): PassCondition {
    switch (type) {
      case 'no_influenza':
        return new NoInfluenzaCondition();
      // 将来の拡張用:
      // case 'has_key':
      //   return new HasKeyCondition(params.keyId);
    }
  }
}
```

## マップ定義例

### 村マップ（エンカウントなし）

```typescript
// タイル略称
const G = 'grass', T = 'tree', P = 'path';
const F = 'floor', X = 'wall', D = 'door', S = 'stairs';

export const MAP_VILLAGE: MapDefinition = {
  id: 'village',
  name: '始まりの村',
  playerStart: { x: 5, y: 7 },
  tiles: [
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    [T, F, F, F, X, G, G, G, G, G, G, G, G, G, X, F, F, F, F, T],
    // ... 続く
  ],
  npcs: [
    { npcId: 'innkeeper_1', x: 2, y: 2 },
    { npcId: 'shopkeeper_1', x: 16, y: 2 },
  ],
  treasures: [
    { x: 17, y: 3, gold: 50 },
  ],
  warps: [
    { x: 9, y: 13, toMapId: 'field', toX: 24, toY: 6 },
    { x: 10, y: 13, toMapId: 'field', toX: 25, toY: 6 },
  ],
  doors: [
    { id: 'home_door', x: 5, y: 9, condition: 'no_influenza' },
  ],
  encounter: undefined,  // 安全地帯
};
```

### フィールドマップ（大規模）

```typescript
export const MAP_FIELD: MapDefinition = {
  id: 'field',
  name: '広大な草原',
  playerStart: { x: 24, y: 7 },
  tiles: generateLargeField(),  // 50x40のタイル配列を生成
  treasures: [...],
  warps: [
    // 村オブジェクト（2x2全タイル）→ 村内部
    { x: 24, y: 4, toMapId: 'village', toX: 10, toY: 12 },
    { x: 25, y: 4, toMapId: 'village', toX: 10, toY: 12 },
    // ...
  ],
  encounter: {
    rate: 0.10,
    enemyIds: ['スライム', 'バット', 'ゴブリン', 'コボルト'],
  },
};
```

### ダンジョンマップ（高エンカウント）

```typescript
export const MAP_DUNGEON: MapDefinition = {
  id: 'dungeon',
  name: '洞窟',
  playerStart: { x: 10, y: 1 },
  tiles: [...],
  treasures: [
    { x: 4, y: 5, gold: 100 },
    { x: 15, y: 9, gold: 100 },
    { x: 10, y: 7, gold: 200 },
  ],
  encounter: {
    rate: 0.20,  // 高エンカウント率
    enemyIds: ['スケルトン', 'ゾンビ', 'オーク', 'ウルフ'],
  },
};
```

## 新しいマップの追加方法

### Step 1: マップ定義を作成

```typescript
// src/data/maps.ts
export const MAP_FOREST: MapDefinition = {
  id: 'forest',
  name: '深い森',
  playerStart: { x: 5, y: 5 },
  tiles: [
    // タイル配列を定義
    [T, T, T, T, T, T, T, T, T, T],
    [T, G, G, P, P, P, G, G, G, T],
    // ...
  ],
  npcs: [
    { npcId: 'forest_hermit', x: 7, y: 3 },
  ],
  treasures: [
    { x: 2, y: 7, gold: 80 },
  ],
  warps: [
    { x: 5, y: 0, toMapId: 'field', toX: 30, toY: 25 },
  ],
  encounter: {
    rate: 0.15,
    enemyIds: ['ウルフ', 'トレント'],
  },
};
```

### Step 2: MAPSに登録

```typescript
export const MAPS: Record<string, MapDefinition> = {
  village: MAP_VILLAGE,
  field: MAP_FIELD,
  dungeon: MAP_DUNGEON,
  forest: MAP_FOREST,  // 追加
};
```

### Step 3: 既存マップからワープを追加

```typescript
// MAP_FIELDに追加
warps: [
  // ... 既存のワープ
  { x: 30, y: 26, toMapId: 'forest', toX: 5, toY: 1 },
],
```

## 新しい通過条件の追加方法

### Step 1: 条件クラスを作成

```typescript
// src/models/conditions/HasKeyCondition.ts
export class HasKeyCondition implements PassCondition {
  readonly type = 'has_key';

  constructor(private keyId: string) {}

  canPass(party: Party): boolean {
    return party.hasItem(this.keyId);
  }

  getBlockedMessage(): string {
    return '鍵がかかっている...';
  }
}
```

### Step 2: ConditionTypeに追加

```typescript
// src/models/conditions/ConditionFactory.ts
export type ConditionType =
  | 'no_influenza'
  | 'has_key';  // 追加
```

### Step 3: ファクトリーに登録

```typescript
static create(type: ConditionType, params?: Record<string, unknown>): PassCondition {
  switch (type) {
    case 'no_influenza':
      return new NoInfluenzaCondition();
    case 'has_key':
      return new HasKeyCondition(params?.keyId as string);
  }
}
```

### Step 4: マップ定義で使用

```typescript
doors: [
  { id: 'treasure_room', x: 10, y: 5, condition: 'has_key' },
],
```

## マップ遷移フロー

```
1. プレイヤーがワープポイントに移動
   │
2. GameEngine.handleMovement() で getWarpAt() を呼び出し
   │
3. ワープポイントが見つかった場合
   │  └─ loadMap(toMapId) を呼び出し
   │
4. 新しいマップをロード
   │  └─ GameMap.loadFromDefinition(MAPS[mapId])
   │
5. プレイヤー位置を設定
   │  └─ player.transform.setPosition(toX, toY)
   │
6. NPC・宝箱を再配置
   │
7. カメラ位置を更新
```

## 扉通過フロー

```
1. プレイヤーが扉タイルに移動しようとする
   │
2. GameEngine で getDoorAt() を呼び出し
   │
3. 扉が見つかった場合
   │  └─ door.canPass(party) で判定
   │
4-a. 通過可能
   │  └─ 移動を許可
   │
4-b. 通過不可
      └─ door.getBlockedMessage() を表示
         └─ "インフルエンザが治るまで外には出られない..."
```

## 設計の利点

1. **データ駆動設計**: マップはデータとして定義し、ロジックと分離
2. **ストラテジーパターン**: 通過条件を差し替え可能
3. **ファクトリーパターン**: 条件オブジェクトの生成を集約
4. **2x2オブジェクト**: 村や洞窟を複数タイルで表現
5. **カメラ追従**: マップサイズに制限なし

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/types/game.ts` | マップ関連型定義 |
| `src/models/GameMap.ts` | マップ管理クラス |
| `src/models/Door.ts` | 条件付き扉クラス |
| `src/models/conditions/*` | 通過条件 |
| `src/data/maps.ts` | マップ定義データ |
| `src/engine/GameEngine.ts` | マップ遷移処理 |
| `src/components/GameCanvas.tsx` | マップ描画 |
