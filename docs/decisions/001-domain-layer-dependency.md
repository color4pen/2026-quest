# ADR-001: ドメイン層からプレゼンテーション層への依存を除去する

## ステータス

承認済み（2026-03-05）

## コンテキスト

`Player`, `Enemy`, `NPC`, `Treasure` がプレゼンテーション層の `GameObject` / `Renderer` を継承・使用しており、DDDの依存方向の原則に反していた。

```
models/Player.ts → components/game/GameObject.ts → components/game/Renderer.ts
```

これにより以下の問題があった：
- ドメインモデルのテストに描画関連のモックが必要
- `PartyMember`（純粋なドメインクラス）と設計が不統一
- 将来的なレンダリング方式の変更が困難

## 決定

`GameEntity` 基底クラスを `models/base/` に作成し、描画ロジックは `GameCanvas` 側で型判定により振り分ける（**A案**を採用）。

```
models/Player.ts → models/base/GameEntity.ts
                         ↑
components/GameCanvas.tsx（型ベースで描画分岐）
```

### 型ベース描画ディスパッチの実装

```typescript
type RenderableEntity =
  | ({ entityType: 'player' } & PlayerState)
  | ({ entityType: 'enemy' } & EnemyState)
  | ({ entityType: 'npc' } & NPCState)
  | ({ entityType: 'treasure' } & TreasureState);

function drawEntity(ctx: CanvasRenderingContext2D, entity: RenderableEntity, camera: CameraState) {
  switch (entity.entityType) {
    case 'player': drawPlayer(ctx, entity, camera); break;
    case 'enemy': drawEnemy(ctx, entity, camera); break;
    // ...
  }
}
```

## 検討した代替案

### B案: RendererRegistry によるマッピング

```typescript
const registry = new Map<string, (ctx, state, camera) => void>();
registry.set('Player', drawPlayer);
registry.set('Enemy', drawEnemy);
```

**却下理由**: 現時点ではエンティティの種類が4つしかなく、動的な登録機構は過剰な抽象化と判断。TypeScriptの型安全性も失われる。

### C案: 各エンティティに render メソッドのインターフェースだけ持たせる

```typescript
interface Renderable {
  render(ctx: CanvasRenderingContext2D, camera: CameraState): void;
}
```

**却下理由**: ドメイン層に描画の概念（`CanvasRenderingContext2D`）が残るため、依存方向の問題が解決しない。

## 結果

- ドメイン層のテストから描画依存がなくなった
- `PartyMember` と設計が統一された
- `components/game/` ディレクトリを完全に削除できた
- 将来的に Canvas 以外のレンダリング（WebGL等）への移行が容易になった

## 関連

- 実装PR: feature/domain-layer-refactor
- 設計ドキュメント: `docs/changes/20260305-domain-layer-refactor/design.md`
