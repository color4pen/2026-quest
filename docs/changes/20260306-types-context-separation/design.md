# 型定義の境界づけられたコンテキスト分離

## 種別
- [x] リファクタリング

## 概要
`src/types/game.ts` に混在している描画定数・敵ベースステータスを適切なファイルに分離する。

## 現状分析

### `game.ts` の現在の内容
| カテゴリ | 内容 |
|---------|------|
| 描画定数 | `TILE_SIZE`, `VIEWPORT_WIDTH/HEIGHT`, `MAP_WIDTH/HEIGHT`, `MAX_MESSAGES` |
| カメラ | `CameraState` |
| マップ基本型 | `TileType`, `MapObject`, `Position`, `Direction`, `GrassDecoration` |
| UI関連 | `Message`, `MessageType` |
| 敵基本値 | `ENEMY_BASE_STATS` |
| 探索関連 | `EncounterConfig`, `WarpPoint`, `NPCPlacement`, `TreasurePlacement`, `DoorPlacement`, `FixedEnemyPlacement`, `MapDefinition` |
| re-export | `battle.ts`, `npc.ts`, `party.ts` |

### 既存の分離状況
- `battle.ts` - バトル関連型 ✓
- `party.ts` - パーティー、装備、インベントリ ✓
- `npc.ts` - NPC、会話、ショップ ✓
- `rendering.ts` - 描画関連（一部）
- `save.ts` - セーブデータ ✓
- `statusEffect.ts` - 状態異常 ✓

### 問題点
1. 描画定数（`TILE_SIZE` 等）とドメイン概念（`EncounterConfig` 等）が同居
2. `ENEMY_BASE_STATS` は敵ドメインの知識だが `game.ts` にある

### 使用状況
- `MAP_WIDTH/HEIGHT`: 4ファイルで使用中（Transform, NPC, GameMap, Treasure）→ 削除不可
- `TILE_SIZE`, `VIEWPORT_*`: 描画系で使用

## 設計方針

### 対応方針: 最小限の分離
指摘が「軽微」であり「急いで対応する必要はない」とされているため、以下の最小限の整理のみ行う。

### 変更内容

#### 1. 描画専用の定数・型を `rendering.ts` に移動
- `VIEWPORT_WIDTH`, `VIEWPORT_HEIGHT` → `rendering.ts`
- `CameraState` → `rendering.ts`
- `GrassDecoration` → `rendering.ts`
- `TILE_SIZE` は `game.ts` に残す（`GameMap.generateGrassDecorations()` でも使用されており、描画とドメインの両方にまたがる共有定数）
- `MAP_WIDTH/HEIGHT` は `game.ts` に残す（Transform, NPC, GameMap, Treasure で使用）

#### 2. `ENEMY_BASE_STATS` を `battle.ts` に移動
- 敵のベースステータスはバトルドメインの知識

#### 3. `game.ts` で re-export
- 後方互換性のため、移動した定数・型を `game.ts` で re-export
- 既存コードの変更を最小化

## 実装計画

### Step 1: `rendering.ts` に描画専用の定数・型を移動
- `VIEWPORT_WIDTH/HEIGHT`, `CameraState`, `GrassDecoration`

### Step 2: `ENEMY_BASE_STATS` を `battle.ts` に移動

### Step 3: `game.ts` で re-export 追加
- 移動した定数・型を re-export

### Step 4: 型チェック・テスト実行

## 影響範囲

### 変更されるファイル
- `src/types/game.ts` - 定数移動、re-export 追加
- `src/types/rendering.ts` - 描画定数追加
- `src/types/battle.ts` - `ENEMY_BASE_STATS` 追加

### 後方互換性
- `game.ts` からの re-export を維持するため、既存コードへの影響なし
