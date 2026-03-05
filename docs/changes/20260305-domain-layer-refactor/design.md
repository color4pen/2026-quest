# ドメイン層の依存関係修正

## 種別
- [x] リファクタリング
- [ ] 機能追加
- [ ] コンテンツ実装
- [ ] バグ修正
- [ ] その他

## 概要

`Player` と `Enemy` がプレゼンテーション層（`components/game/`）に依存している問題を修正する。
DDDの依存方向の原則に従い、ドメイン層がプレゼンテーション層を知らない設計に変更。

## 現状分析

### 現在の依存関係（問題あり）

```
models/Player.ts   → components/game/GameObject.ts, PlayerRenderer
models/Enemy.ts    → components/game/GameObject.ts, EnemyRenderer
models/NPC.ts      → components/game/GameObject.ts, NPCRenderer, ComputerRenderer
models/Treasure.ts → components/game/GameObject.ts, TreasureRenderer

つまり: ドメイン層 → プレゼンテーション層（逆方向）
```

### 問題点

1. **ドメインモデルが描画に引きずられる**
   - 描画方式を変更（Canvas→WebGL）するとドメイン層を編集する必要がある

2. **テストが重くなる**
   - `Player` のテストに `Renderer` 関連が付いてくる

3. **再利用性が下がる**
   - CLI版やサーバーサイドで使う場合に描画コードが邪魔

### 関連ファイル

| ファイル | 行数 | 現状 |
|---------|------|------|
| `models/Player.ts` | 57行 | `GameObject` を継承、`PlayerRenderer` を生成 |
| `models/Enemy.ts` | 264行 | `GameObject` を継承、`EnemyRenderer` を生成、`Interactable` 実装 |
| `models/NPC.ts` | 143行 | `GameObject` を継承、`NPCRenderer`/`ComputerRenderer` を生成、`Interactable` 実装 |
| `models/Treasure.ts` | 142行 | `GameObject` を継承、`TreasureRenderer` を生成、`Interactable` 実装 |
| `components/game/GameObject.ts` | 99行 | `Transform` と `Renderer` を所有 |
| `components/game/Renderer.ts` | 294行 | 各種Renderer定義、`Transform` をインポート |
| `components/game/Transform.ts` | 125行 | 座標・移動ロジック |
| `components/game/Interactable.ts` | 41行 | インタラクションIF、`GameObject` を参照 |
| `components/game/index.ts` | 18行 | 一括エクスポート |

## 設計方針

### 依存関係の修正

```
Before:
  models/Player.ts   → components/game/GameObject.ts
  models/Enemy.ts    → components/game/GameObject.ts
  models/NPC.ts      → components/game/GameObject.ts
  models/Treasure.ts → components/game/GameObject.ts

After:
  components/GameCanvas.tsx → models/Player.ts, models/Enemy.ts, models/NPC.ts, models/Treasure.ts
  components/game/Renderer.ts → models/base/Transform.ts
  （プレゼンテーション層 → ドメイン層）
```

### 描画の接続方針: A案（型判定による外部マッピング）を採用

`GameCanvas` 側でエンティティの型を見て描画を切り替える。

```typescript
// GameCanvas.tsx
function renderEntity(entity: GameEntity, ctx: CanvasRenderingContext2D, camera: CameraState) {
  if (entity instanceof Player) {
    renderPlayer(entity, ctx, camera);
  } else if (entity instanceof Enemy) {
    renderEnemy(entity, ctx, camera);
  } else if (entity instanceof NPC) {
    renderNPC(entity, ctx, camera);
  } else if (entity instanceof Treasure) {
    renderTreasure(entity, ctx, camera);
  }
}
```

**理由:**
- 現状の `Renderer` クラスの描画ロジックをそのまま関数化できる
- 新しい抽象化（Registry）を導入せずシンプルに移行可能
- `PartyMember` の戦闘画面描画も同じパターンで実装されている

### `ExplorationController.getGameObjects()` の変更

```typescript
// Before: GameObject[] を返す
getGameObjects(): GameObject[]

// After: GameEntity[] を返す
getGameObjects(): GameEntity[]
```

`GameCanvas` が `GameEntity[]` を受け取り、型判定で描画を振り分ける。

### 新規ファイル

1. **`models/base/GameEntity.ts`** - 座標と状態のみを持つドメインクラス
2. **`models/base/Transform.ts`** - 座標・移動ロジック（`components/game/Transform.ts` から移動）
3. **`models/base/Interactable.ts`** - インタラクションIF（`components/game/Interactable.ts` から移動、`GameObject` 参照を `GameEntity` に変更）
4. **`models/base/index.ts`** - バレルファイル

### 構造の変化

```
Before:
  components/game/
  ├── GameObject.ts      ← Transform + Renderer
  ├── Transform.ts
  ├── Renderer.ts
  ├── Interactable.ts
  └── index.ts           ← 全て re-export

  models/
  ├── Player.ts          ← extends GameObject (依存逆転!)
  ├── Enemy.ts           ← extends GameObject (依存逆転!)
  ├── NPC.ts             ← extends GameObject (依存逆転!)
  └── Treasure.ts        ← extends GameObject (依存逆転!)

After:
  models/
  ├── base/
  │   ├── GameEntity.ts  ← 座標 + 状態のみ（純粋なドメイン）
  │   ├── Transform.ts   ← 移動ロジック
  │   ├── Interactable.ts
  │   └── index.ts       ← re-export
  ├── Player.ts          ← extends GameEntity
  ├── Enemy.ts           ← extends GameEntity, implements Interactable
  ├── NPC.ts             ← extends GameEntity, implements Interactable
  └── Treasure.ts        ← extends GameEntity, implements Interactable

  components/game/
  ├── Renderer.ts        ← Transform を models/base/ からインポート
  └── index.ts           ← Renderer のみ re-export（GameObject削除）
```

## 実装計画

### Step 1: `models/base/` に基底クラスを作成
- `Transform.ts` を `components/game/` から移動
- `GameEntity.ts` を作成（座標 + 状態のみ）
- `Interactable.ts` を `components/game/` から移動（`GameObject` → `GameEntity` に変更）
- `index.ts` を作成（バレルファイル）

### Step 2: `Player` を修正
- `GameObject` 継承 → `GameEntity` 継承
- `Renderer` への依存を削除
- `components/game/` への import を削除

### Step 3: `Enemy` を修正
- `GameObject` 継承 → `GameEntity` 継承
- `Renderer` への依存を削除
- `Interactable` の import 元を `models/base/` に変更

### Step 4: `NPC` を修正
- `GameObject` 継承 → `GameEntity` 継承
- `Renderer` への依存を削除
- `Interactable` の import 元を `models/base/` に変更

### Step 5: `Treasure` を修正
- `GameObject` 継承 → `GameEntity` 継承
- `Renderer` への依存を削除
- `Interactable` の import 元を `models/base/` に変更

### Step 6: `GameCanvas.tsx` を修正（旧コード削除前に実施）
- `GameEntity[]` を受け取るように変更
- 型判定による描画関数を追加（`renderPlayer`, `renderEnemy`, `renderNPC`, `renderTreasure`）
- 既存の `Renderer` クラスの描画ロジックを関数に移植
- この時点で描画が正しく動作することを確認

### Step 7: `ExplorationController` を修正
- `getGameObjects()` の戻り値を `GameEntity[]` に変更

### Step 8: `components/game/` を整理（旧コード削除）
- `GameObject.ts`: 削除（不要になる）
- `Renderer.ts`: 削除（描画ロジックは `GameCanvas.tsx` に移植済み）
- `Transform.ts`: 削除（`models/base/` に移動済み）
- `Interactable.ts`: 削除（`models/base/` に移動済み）
- `index.ts`: 空になるか、必要なものだけ残す

### Step 9: 型チェック・テスト
- `npx tsc --noEmit`
- `npm test`
- `GameCanvas` の描画が正しく動作するか手動確認

## 影響範囲

### 変更されるファイル
- `src/models/Player.ts`
- `src/models/Enemy.ts`
- `src/models/NPC.ts`
- `src/models/Treasure.ts`
- `src/models/index.ts`
- `src/components/game/Renderer.ts`（削除）
- `src/components/game/index.ts`
- `src/components/game/GameObject.ts`（削除）
- `src/components/game/Transform.ts`（移動）
- `src/components/game/Interactable.ts`（移動）
- `src/components/GameCanvas.tsx`
- `src/engine/ExplorationController.ts`
- `src/types/game.ts`（`GameObjectState` → `GameEntityState` への型名変更があれば）
- `GameObjectState` を参照しているコンポーネント（要確認）

### テストへの影響
- `Player.test.ts` - import変更
- `Enemy.test.ts` - import変更
- `NPC.test.ts`（存在する場合）- import変更
- `Treasure.test.ts` - import変更
- `GameCanvas.test.tsx`（存在する場合）- 描画ロジックのテスト方法が変わる可能性

### テスト方針
- ドメインモデルのテスト: import パス変更のみ、ロジックは維持
- `GameCanvas` のテスト: 描画関数が正しく呼ばれるかのテストを追加検討

## 承認
- [x] 設計レビュー完了
- [ ] 実装開始
