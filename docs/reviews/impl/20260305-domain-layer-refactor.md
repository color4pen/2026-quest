# 実装レビュー: ドメイン層リファクタリング

- **日付**: 2026-03-05
- **PR**: #7
- **レビュアー**: Claude → ユーザー
- **結果**: 要修正 → LGTM

## 指摘事項

### 1. GameEngine が GameCanvas をインポートしている（必須修正）✅ 対応済み

**場所**: `src/engine/GameEngine.ts`

```typescript
import { RenderableEntity } from '../components/GameCanvas';
```

エンジン層がプレゼンテーション層の型をインポートしており、依存方向の問題が残っていた。

**対応**: `RenderableEntity` を `types/rendering.ts` に移動。

### 2. GameEntity.isInViewport が描画の関心事（推奨修正）✅ 対応済み

**場所**: `src/models/base/GameEntity.ts`

ドメイン層のエンティティが「ビューポートに入っているか」を知っているのは描画の関心事。`GameCanvas` 側で同じフィルタリングを行っているため不要。

**対応**: `isInViewport` と `zIndex` を削除。

### 3. NPC.renderType がドメインに含まれている（軽微）

**場所**: `src/models/NPC.ts`

`renderType` は「どう描画するか」の情報なのでプレゼンテーション層の関心事。ただし `NPCDefinition` に由来する情報で、NPCの「種類」の一部とも解釈できる。

**対応**: 現状維持。将来的に厳密な分離が必要になったら、`ExplorationController` で定義を参照して `entityType` を分ける方式を検討。

### 4. zIndex によるソートが削除された（軽微）

旧コードでは `sortedObjects` で zIndex によるソートを行っていたが、新コードではソートなし。

**対応**: 現時点では問題なし。必要になったら `RenderableEntity` に `zIndex` を追加。

### 5. getRenderableEntities() で毎回オブジェクト生成（軽微）

毎フレーム新しいオブジェクトを生成している。

**対応**: プロファイリングで問題が出たらメモ化を検討。

## 良かった点

1. **ADRの導入**: 技術的意思決定の記録が残る
2. **型安全性の維持**: discriminated union で網羅性チェック
3. **テストの独立性向上**: ドメインモデルから描画依存がなくなった
4. **設計の統一**: `PartyMember` と同じ純粋ドメインクラスのパターン

## 最終判定

必須修正（依存方向）を対応済み。依存方向が正しくなり、ドメイン層から描画の関心事が除去されました。
