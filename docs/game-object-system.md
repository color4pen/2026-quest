# ゲームオブジェクトシステム設計ドキュメント

## 概要

本ゲームのエンティティシステムはUnityのGameObjectパターンを参考にしたコンポーネントベースの設計を採用しています。位置管理（Transform）と描画（Renderer）を分離し、インタラクション（Interactable）をインターフェースで抽象化することで、拡張性と保守性を確保しています。

## アーキテクチャ

```
src/components/game/
├── index.ts          # エクスポート
├── GameObject.ts     # ゲームオブジェクト基底クラス
├── Transform.ts      # 位置・移動コンポーネント
├── Renderer.ts       # 描画コンポーネント群
└── Interactable.ts   # インタラクションインターフェース

src/models/
├── Player.ts         # プレイヤー（GameObject継承）
├── Enemy.ts          # 敵（GameObject + Interactable）
├── NPC.ts            # NPC（GameObject + Interactable）
├── Treasure.ts       # 宝箱（GameObject + Interactable）
└── Door.ts           # 扉（条件付き通過ポイント）
```

## クラス図

```
┌─────────────────────────────────────────────────────────────────┐
│                      GameObject (abstract)                       │
├─────────────────────────────────────────────────────────────────┤
│ + id: string                                                    │
│ + transform: Transform                    ◆───────┐             │
│ # renderer: Renderer | null               ◆───┐   │             │
│ # _active: boolean                            │   │             │
├─────────────────────────────────────────────────────────────────┤
│ + x, y: number (shortcuts)                    │   │             │
│ + render(ctx, camera): void                   │   │             │
│ + isInViewport(camera): boolean               │   │             │
│ + update(deltaTime): void                     │   │             │
│ + destroy(): void                             │   │             │
│ + getBaseState(): GameObjectState             │   │             │
│ + abstract getState(): GameObjectState        │   │             │
└─────────────────────────────────────────────────────────────────┘
           ▲                                    │   │
           │ extends                            │   │
    ┌──────┴──────┬──────────┬──────────┐      │   │
    │             │          │          │      │   │
┌───┴───┐   ┌─────┴────┐ ┌───┴───┐ ┌────┴────┐ │   │
│Player │   │  Enemy   │ │  NPC  │ │Treasure │ │   │
└───────┘   └──────────┘ └───────┘ └─────────┘ │   │
                │             │         │      │   │
                └─────────────┴─────────┘      │   │
                        │                      │   │
                        ▼                      │   │
              ┌─────────────────┐              │   │
              │  Interactable   │              │   │
              │   (interface)   │              │   │
              ├─────────────────┤              │   │
              │ onInteract()    │              │   │
              │ canInteract()   │              │   │
              └─────────────────┘              │   │
                                               │   │
┌──────────────────────────────────────────────┘   │
│                                                  │
▼                                                  ▼
┌─────────────────────────┐        ┌─────────────────────────┐
│   Renderer (abstract)   │        │       Transform         │
├─────────────────────────┤        ├─────────────────────────┤
│ # transform: Transform  │        │ - _x, _y: number        │
│ + visible: boolean      │        ├─────────────────────────┤
│ + zIndex: number        │        │ + setPosition(x, y)     │
├─────────────────────────┤        │ + move(direction)       │
│ + abstract render()     │        │ + getNextPosition()     │
│ # getPixelPosition()    │        │ + isAt(position)        │
│ + isInViewport()        │        │ + distanceTo(other)     │
└───────────┬─────────────┘        │ + isInBounds()          │
            │                      │ + clone()               │
   ┌────────┼────────┬─────────┐   └─────────────────────────┘
   │        │        │         │
   ▼        ▼        ▼         ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐
│Player│ │Enemy │ │ NPC  │ │Treasure│
│Render│ │Render│ │Render│ │ Render │
└──────┘ └──────┘ └──────┘ └────────┘
                     │
              ┌──────┴──────┐
              │             │
              ▼             ▼
         ┌────────┐   ┌──────────┐
         │Computer│   │(将来拡張)│
         │ Render │   └──────────┘
         └────────┘
```

## コンポーネント詳細

### Transform（位置コンポーネント）

Unity の Transform に相当。位置と移動を管理します。

```typescript
class Transform implements Position {
  private _x: number;
  private _y: number;

  // 位置操作
  setPosition(x: number, y: number): void;
  copyFrom(position: Position): void;
  moveTo(position: Position): void;

  // 移動
  getNextPosition(direction: Direction): Position;
  move(direction: Direction): void;

  // 判定
  isAt(position: Position): boolean;
  distanceTo(other: Position): number;
  isInBounds(): boolean;

  // ユーティリティ
  getPosition(): Position;
  clone(): Transform;
  static isValidPosition(position: Position): boolean;
}
```

### Renderer（描画コンポーネント）

Unity の SpriteRenderer に相当。描画を担当する抽象基底クラス。

```typescript
abstract class Renderer {
  protected transform: Transform;
  public visible: boolean = true;
  public zIndex: number = 0;

  abstract render(ctx: CanvasRenderingContext2D, camera?: CameraState): void;

  protected getPixelPosition(camera?: CameraState): { px: number; py: number };
  public isInViewport(camera: CameraState): boolean;
}
```

### Interactable（インタラクションインターフェース）

プレイヤーと相互作用可能なオブジェクトが実装するインターフェース。

```typescript
interface Interactable {
  onInteract(player: GameObject): InteractionResult;
  canInteract(): boolean;
}

interface InteractionResult {
  type: 'battle' | 'dialogue' | 'treasure' | 'none';
  data?: unknown;
  blockMovement: boolean;
}

// Type Guard
function isInteractable(obj: unknown): obj is Interactable;
```

## 具象クラス

### Player

プレイヤーキャラクター。Interactableは実装しない（他から操作される側）。

```typescript
class Player extends GameObject {
  renderer = new PlayerRenderer(this.transform);

  // プレイヤー固有の機能
  hp, maxHp, mp, maxMp, attack, level, xp: number;
  skills: SkillDefinition[];

  move(direction: Direction): void;
  takeDamage(amount: number): number;
  heal(amount: number): number;
  gainXp(amount: number): boolean;  // レベルアップ判定
}
```

### Enemy（敵）

敵キャラクター。バトルを開始するInteractable。

```typescript
class Enemy extends GameObject implements Interactable {
  renderer = new EnemyRenderer(this.transform);
  battleConfig: EnemyBattleConfig;  // AI設定、ステータス倍率等

  onInteract(): InteractionResult {
    return { type: 'battle', data: this, blockMovement: true };
  }

  canInteract(): boolean {
    return !this.isDead() && this._active;
  }

  // 戦闘関連
  calculateAttackDamage(): number;
  takeDamage(amount: number): void;
  isDead(): boolean;

  // ファクトリ
  static spawnEnemies(count, playerPos, playerLevel): Enemy[];
}
```

### NPC

会話可能なキャラクター。renderTypeで描画を切り替え可能。

```typescript
class NPC extends GameObject implements Interactable {
  dialogue: DialogueData;
  shopItems?: ShopItem[];
  healCost?: number;

  constructor(definition: NPCDefinition, x, y) {
    // renderTypeに応じてRendererを切り替え
    if (definition.renderType === 'computer') {
      this.renderer = new ComputerRenderer(this.transform);
    } else {
      this.renderer = new NPCRenderer(this.transform, colors);
    }
  }

  onInteract(): InteractionResult {
    return { type: 'dialogue', data: this, blockMovement: true };
  }

  static spawnNPCs(playerPos, excludePositions): NPC[];
}
```

### Treasure（宝箱）

開封可能な宝箱。

```typescript
class Treasure extends GameObject implements Interactable {
  gold: number;
  opened: boolean;
  treasureRenderer: TreasureRenderer;

  onInteract(): InteractionResult {
    if (this.opened) return { type: 'none', blockMovement: false };
    const gold = this.open();
    return { type: 'treasure', data: { gold }, blockMovement: false };
  }

  canInteract(): boolean {
    return !this.opened && this._active;
  }

  open(): number;  // 開封してゴールドを返す
  isOpened(): boolean;

  static spawnTreasures(count, excludePositions): Treasure[];
}
```

## Renderer実装一覧

| クラス | 用途 | 特徴 |
|-------|------|------|
| `PlayerRenderer` | プレイヤー描画 | 赤い服、剣を持った人型 |
| `EnemyRenderer` | 敵描画 | 緑色のスライム風 |
| `NPCRenderer` | NPC描画 | 種別で色が変わる人型 |
| `ComputerRenderer` | パソコン描画 | モニター + キーボード |
| `TreasureRenderer` | 宝箱描画 | 開封状態を反映 |

### NPCRenderer の色設定

```typescript
static getColorsForType(type: string): NPCRenderConfig {
  switch (type) {
    case 'villager':   // 緑系
    case 'shopkeeper': // 金色系
    case 'innkeeper':  // 青系
  }
}
```

## 新しいゲームオブジェクトの追加方法

### Step 1: 状態インターフェースを定義

```typescript
// src/models/Chest.ts
export interface ChestState extends GameObjectState {
  itemId: string;
  opened: boolean;
}
```

### Step 2: Rendererを作成（必要に応じて）

```typescript
// src/components/game/Renderer.ts に追加
export class ChestRenderer extends Renderer {
  private opened: boolean = false;

  setOpened(opened: boolean): void {
    this.opened = opened;
  }

  render(ctx: CanvasRenderingContext2D, camera?: CameraState): void {
    if (!this.visible) return;
    const { px, py } = this.getPixelPosition(camera);
    // 描画処理...
  }
}
```

### Step 3: GameObjectを継承してクラスを作成

```typescript
// src/models/Chest.ts
import { GameObject, GameObjectState, ChestRenderer, Interactable, InteractionResult } from '../components/game';

export class Chest extends GameObject implements Interactable {
  private itemId: string;
  private opened: boolean = false;
  private chestRenderer: ChestRenderer;

  constructor(x: number, y: number, itemId: string) {
    super(x, y);
    this.itemId = itemId;
    this.chestRenderer = new ChestRenderer(this.transform);
    this.renderer = this.chestRenderer;
  }

  onInteract(_player: GameObject): InteractionResult {
    if (this.opened) {
      return { type: 'none', blockMovement: false };
    }
    this.opened = true;
    this.chestRenderer.setOpened(true);
    return {
      type: 'treasure',  // または新しいタイプ 'item'
      data: { itemId: this.itemId },
      blockMovement: false,
    };
  }

  canInteract(): boolean {
    return !this.opened && this._active;
  }

  getState(): ChestState {
    return {
      ...this.getBaseState(),
      itemId: this.itemId,
      opened: this.opened,
    };
  }
}
```

### Step 4: エクスポートに追加

```typescript
// src/models/index.ts
export { Chest } from './Chest';
export type { ChestState } from './Chest';
```

### Step 5: GameEngineで使用

```typescript
// GameEngine内でInteractableとして処理
const interactableObjects = [
  ...this.npcs,
  ...this.treasures,
  ...this.chests,  // 追加
].filter(obj => isInteractable(obj));
```

## インタラクション処理フロー

```
1. プレイヤーが移動を試みる
   │
2. 移動先のオブジェクトを取得
   │
3. isInteractable(obj) でチェック
   │
4. obj.canInteract() で可能かチェック
   │  └─ false → 移動を継続（または何もしない）
   │
5. obj.onInteract(player) を呼び出し
   │
6. InteractionResult を処理
   ├─ type: 'battle' → BattleEngine開始
   ├─ type: 'dialogue' → DialogueEngine開始
   ├─ type: 'treasure' → ゴールド獲得
   └─ type: 'none' → 何もしない
   │
7. blockMovement に応じて移動を制御
```

## カメラとビューポート

GameObjectはカメラ座標を考慮した描画をサポート。

```typescript
// Renderer内でピクセル座標を計算
protected getPixelPosition(camera?: CameraState): { px: number; py: number } {
  if (!camera) {
    return { px: this.transform.x * TILE_SIZE, py: this.transform.y * TILE_SIZE };
  }
  // カメラからの相対位置を計算
  const screenX = (this.transform.x - camera.x + camera.viewportWidth / 2) * TILE_SIZE;
  const screenY = (this.transform.y - camera.y + camera.viewportHeight / 2) * TILE_SIZE;
  return { px: screenX, py: screenY };
}

// ビューポート内判定
public isInViewport(camera: CameraState): boolean {
  const halfW = camera.viewportWidth / 2;
  const halfH = camera.viewportHeight / 2;
  return (
    this.transform.x >= camera.x - halfW - 1 &&
    this.transform.x <= camera.x + halfW + 1 &&
    this.transform.y >= camera.y - halfH - 1 &&
    this.transform.y <= camera.y + halfH + 1
  );
}
```

## React連携

各GameObjectは `getState()` メソッドでReact用の状態オブジェクトを返します。

```typescript
// GameObjectState（基底）
interface GameObjectState {
  id: string;
  x: number;
  y: number;
  active: boolean;
}

// 具象状態（例: EnemyState）
interface EnemyState extends GameObjectState {
  hp: number;
  maxHp: number;
  attack: number;
  // ...
}
```

GameEngineがこれらの状態を集約してReactコンポーネントに渡します。

## 設計の利点

1. **コンポーネント分離**: 位置(Transform)と描画(Renderer)を分離し、単一責任を実現
2. **インターフェース抽象化**: Interactableで様々なオブジェクトを統一的に扱える
3. **ポリモーフィズム**: Rendererの継承で描画を差し替え可能
4. **ファクトリパターン**: 各クラスにspawnメソッドで生成ロジックを集約
5. **Type Guard**: isInteractableで安全な型判定

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/components/game/GameObject.ts` | 基底クラス |
| `src/components/game/Transform.ts` | 位置コンポーネント |
| `src/components/game/Renderer.ts` | 描画コンポーネント群 |
| `src/components/game/Interactable.ts` | インタラクションIF |
| `src/models/Player.ts` | プレイヤー |
| `src/models/Enemy.ts` | 敵 |
| `src/models/NPC.ts` | NPC |
| `src/models/Treasure.ts` | 宝箱 |
| `src/engine/GameEngine.ts` | オブジェクト管理・更新 |
| `src/components/GameCanvas.tsx` | 描画呼び出し |
