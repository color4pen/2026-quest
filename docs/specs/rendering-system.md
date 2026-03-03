# 描画システム設計ドキュメント

## 概要

Unity のコンポーネントシステムに着想を得た設計。各ゲームオブジェクトが Transform（位置）と Renderer（描画）をコンポーネントとして持ち、Canvas 2D API で自身を描画する。カメラはプレイヤー追従で、フラスタムカリングにより画面外のオブジェクトをスキップする。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                   GameCanvas (React)                  │
│  - Canvas 2D Context を取得                          │
│  - マップタイル描画                                  │
│  - GameObjects を zIndex 順にソート                  │
│  - 各 GameObject.render(ctx, camera) を呼び出し     │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│                   GameObject (abstract)               │
│  ┌──────────┐    ┌──────────┐                       │
│  │ Transform │    │ Renderer │                       │
│  │ (位置)   │    │ (描画)   │                       │
│  └──────────┘    └──────────┘                       │
│  + render(ctx, camera): void                         │
│  + get zIndex: number                                │
└─────────────────────────────────────────────────────┘
```

## Transform クラス

位置と移動を管理するコンポーネント。`Position` インターフェースを実装。

```typescript
class Transform implements Position {
  get x(): number;
  get y(): number;

  setPosition(x: number, y: number): void;
  copyFrom(position: Position): void;
  getNextPosition(direction: Direction): Position;
  move(direction: Direction): void;
  moveTo(position: Position): void;
  isAt(position: Position): boolean;
  distanceTo(other: Position): number;
  getPosition(): Position;
  clone(): Transform;

  static isValidPosition(position: Position): boolean;
}
```

## Renderer 抽象基底クラス

```typescript
abstract class Renderer {
  protected transform: Transform;
  public visible: boolean = true;
  public zIndex: number = 0;

  abstract render(ctx: CanvasRenderingContext2D, camera?: CameraState): void;

  // カメラ座標を考慮したピクセル位置計算
  protected getPixelPosition(camera?: CameraState): { px: number; py: number };

  // フラスタムカリング
  public isInViewport(camera: CameraState): boolean;
}
```

### ピクセル座標計算

```
screenX = (tileX - cameraX + viewportWidth/2) × TILE_SIZE
screenY = (tileY - cameraY + viewportHeight/2) × TILE_SIZE
```

### ビューポート判定

マージン1タイルを含めてオブジェクトが画面内にあるかチェック。

## Renderer 実装一覧

| クラス | 対象 | 特徴 |
|--------|------|------|
| `PlayerRenderer` | プレイヤー | 体・頭・髪・目・剣・脚をピクセル描画 |
| `NPCRenderer` | NPC | NPC種別ごとの色設定（bodyColor, hairColor等） |
| `ComputerRenderer` | パソコンNPC | モニター・キーボードのドット絵 |
| `EnemyRenderer` | フィールド敵 | 緑色の敵キャラ描画 |
| `TreasureRenderer` | 宝箱 | 開封済みの場合は描画スキップ |

### NPCRenderer の色設定

```typescript
static getColorsForType(type: string): NPCRenderConfig {
  // villager: 緑系
  // shopkeeper: 金系
  // innkeeper: 青系
}
```

## CameraState

```typescript
interface CameraState {
  x: number;              // カメラ中心のタイル座標X
  y: number;              // カメラ中心のタイル座標Y
  viewportWidth: number;  // 表示幅（タイル数）= 20
  viewportHeight: number; // 表示高さ（タイル数）= 15
}
```

カメラはプレイヤー位置に追従。GameEngine がプレイヤー移動ごとにカメラ座標を更新。

## GameCanvas コンポーネント

```typescript
interface GameCanvasProps {
  gameObjects: GameObject[];
  map: GameMapState;
  camera: CameraState;
}
```

### 描画フロー

1. Canvas サイズ設定（viewportWidth × viewportHeight × TILE_SIZE）
2. マップタイル描画（カメラ範囲内のみ）
3. 草地の装飾描画
4. GameObjects を `zIndex` 順でソート（useMemo）
5. 各オブジェクトの `render(ctx, camera)` を呼び出し

### パフォーマンス最適化

- **フラスタムカリング**: Renderer.isInViewport() で画面外のオブジェクトをスキップ
- **useMemo**: gameObjects のソートをメモ化
- **タイル描画範囲**: カメラ範囲 ± 1タイル分のみ描画

## 定数

```typescript
const TILE_SIZE = 32;          // 1タイルのピクセルサイズ
const VIEWPORT_WIDTH = 20;     // 表示タイル数（横）
const VIEWPORT_HEIGHT = 15;    // 表示タイル数（縦）
```

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/components/game/Renderer.ts` | Renderer 基底クラス + 全実装 |
| `src/components/game/Transform.ts` | Transform コンポーネント |
| `src/components/game/GameObject.ts` | GameObject 基底クラス |
| `src/components/GameCanvas.tsx` | Canvas 描画コンポーネント |
| `src/types/game.ts` | CameraState, TILE_SIZE 等 |
