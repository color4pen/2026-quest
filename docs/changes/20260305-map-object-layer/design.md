# マップオブジェクトレイヤー分離

## 概要

マップの「見た目」と「通行判定」がTileTypeに一体化している問題を解決する。
オブジェクトレイヤーを分離して、TileTypeを増やさずにテント・車・看板等を配置可能にする。

## 現状分析

### 問題点

1. **TileType肥大化**: 村・洞窟の2x2オブジェクトで8タイル追加
   - `village_tl`, `village_tr`, `village_bl`, `village_br`
   - `dungeon_tl`, `dungeon_tr`, `dungeon_bl`, `dungeon_br`

2. **見た目と判定の一体化**: 新しいオブジェクトを追加するたびに
   - TileTypeに4タイル追加
   - `blockedTiles`に追加（通行不可の場合）
   - `drawTile`にcase追加

3. **表現力の限界**: 同じ場所に地形+オブジェクトを重ねられない

### 対象ファイル

| ファイル | 行数 | 関連する変更 |
|---------|------|-------------|
| `src/types/game.ts` | ~250 | MapObject追加, TileType削減 |
| `src/data/maps.ts` | ~250 | objects配列追加, タイル配列簡略化 |
| `src/models/GameMap.ts` | ~260 | isWalkable拡張 |
| `src/components/GameCanvas.tsx` | ~350 | オブジェクト描画追加, drawTile簡略化 |

## 設計方針

### 1. MapObjectインターフェース

```typescript
interface MapObject {
  id: string;
  x: number;
  y: number;
  image: string;      // 画像パス or 描画ID
  width: number;      // タイル単位
  height: number;
  walkable: boolean;  // false = 通行不可
  warpTo?: {          // ワープ先（村・洞窟入口用）
    mapId: string;
    x: number;
    y: number;
  };
}
```

### 2. 通行判定の2段階化

```typescript
// GameMap.isWalkable()
public isWalkable(position: Position): boolean {
  // 1. 地形タイルが通行可能か
  const tile = this.getTile(position);
  if (tile === null) return false;
  if (blockedTiles.includes(tile)) return false;

  // 2. オブジェクトが通行を阻んでいないか
  if (this.hasBlockingObjectAt(position)) return false;

  return true;
}
```

### 3. TileType簡略化

**削除するTileType（8種類 → MapObject化）:**
- `village_tl`, `village_tr`, `village_bl`, `village_br`
- `cave_tl`, `cave_tr`, `cave_bl`, `cave_br`

**残るTileType（10種類 → 純粋な地形）:**
- `grass` — 草地（エンカウントあり）
- `tree` — 木（通行不可）
- `path` — 道（エンカウントなし）
- `water` — 水（通行不可）
- `floor` — 室内床
- `wall` — 壁（通行不可）
- `door` — 扉
- `sand` — 砂地
- `bridge` — 橋（水上通過可能）
- `stairs` — 階段（ワープポイント表示用、1タイル）

### 4. 描画順序

1. 地形タイル（下層）
2. MapObject（上層）
3. キャラクター（最上層）

## 実装計画

### Step 1: 型定義追加
- `MapObject`インターフェース追加
- `MapDefinition.objects`追加

### Step 2: GameMap拡張
- `objects`フィールド追加
- `hasBlockingObjectAt()`追加
- `isWalkable()`拡張
- `getObjectAt()`追加（ワープ用）

### Step 3: MapManager拡張
- オブジェクトのワープ判定追加

### Step 4: 描画処理
- `drawObjects()`関数追加
- 地形描画後にオブジェクト描画

### Step 5: マップデータ移行
- 村・洞窟をMapObjectとして定義
- タイル配列から2x2オブジェクトを削除
- TileTypeから8タイル削除
- drawTileから8ケース削除

## 期待される効果

| 指標 | Before | After |
|-----|--------|-------|
| TileType数 | 18 | 10 |
| 新オブジェクト追加時の変更箇所 | 3箇所 | 1箇所（maps.ts） |
| 地形+オブジェクト重ね置き | 不可 | 可能 |

## 後方互換性

- 既存のセーブデータへの影響なし（マップ構造はセーブされない）
- ワープ座標は変更なし

## 承認
- [ ] 設計レビュー完了
- [ ] 実装開始
