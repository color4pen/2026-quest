# 設計レビュー: ドメイン層の依存関係修正

- **日付**: 2026-03-05
- **対象**: `docs/changes/20260305-domain-layer-refactor/design.md`
- **レビュアー**: ユーザー
- **結果**: LGTM（細かい指摘あり、実装時に対応可）

## 指摘事項

### 1. `GameObject` を「GameEntity を継承する描画ラッパー」にする案は再考が必要（必須修正）

Step 4で `GameObject` が `GameEntity` を継承するとあるが、現状 `GameCanvas.tsx` は `GameObject[]` を受け取って `renderer.render()` を呼んでいる。`Player` や `Enemy` が `GameEntity` を継承すると `GameObject` ではなくなるので、「ドメインオブジェクトから描画用オブジェクトへの変換」が必要になる。

この変換をどこで誰がやるのかが仕様に書かれていない。`ExplorationController.getGameObjects()` が現状 `Player` や `Enemy` をそのまま `GameObject[]` として返しているので、ここの対応方針を明記すべき。

**具体的なアプローチ案:**

**A案: Renderer を外部マッピングにする**
```typescript
function renderEntity(entity: GameEntity, ctx: CanvasRenderingContext2D) {
  if (entity instanceof Player) { /* プレイヤー描画 */ }
  else if (entity instanceof Enemy) { /* 敵描画 */ }
}
```

**B案: RendererRegistry でマッピングする**
```typescript
const rendererMap = new Map<string, Renderer>();
rendererMap.set('player', new PlayerRenderer());
```

### 2. `NPC` と `Treasure` の扱いが曖昧（必須修正）

影響範囲に「NPC.ts（GameObjectを使用している場合）」「Treasure.ts（同）」と条件付きで書かれているが、実際のコードを確認すると両方とも `GameObject` を継承している。

「場合」ではなく確実に影響するので、Step 2〜3 と同様に個別のステップとして記載すべき。特に `NPC` は `Interactable` も実装しているので `Enemy` と同じ対応が必要。

### 3. `Transform.ts` の移動は影響範囲が広い（必須修正）

`Transform` は `components/game/` の他のファイル（`Renderer.ts` など）からもインポートされている。移動すると `Renderer.ts` のインポートパスも変わる。

影響範囲の「変更されるファイル」に `Renderer.ts` が含まれていない。

### 4. `components/game/index.ts` の re-export 整理（推奨修正）

現状 `index.ts` で `GameObject`, `Transform`, `Renderer`, `Interactable` を一括エクスポートしていて、`models/` 側からの import も `'../components/game'` 経由。

移動後は `models/base/` から re-export するバレルファイルと、`components/game/` の re-export を両方更新する必要がある。この整理方針も書いておくとよい。

### 5. Step 6 のテスト戦略がやや薄い（推奨修正）

「既存テストのロジックは変更不要（インターフェースは維持）」とあるが、`GameCanvas.test.tsx` の描画テストにも影響が出る可能性が高い。描画の接続方法が変わるので、ここのテスト方針も記載しておくべき。

## 良かった点

- 依存方向の修正という目的は明確で、Before/After の図もわかりやすい
- `PartyMember` が既にこの正しい構造になっているので、それに揃えるという判断も合理的

## 2回目レビュー（修正後）

### 追加の細かい指摘（実装時に対応可）

1. **`GameEntityState` 型名変更の影響確認**
   - `GameObjectState` を参照している箇所の確認が影響範囲に含まれると安心

2. **`Renderer.ts` の削除を明記**
   - A案採用なら `Renderer.ts` のクラス群は不要になる
   - 設計書に削除を明記しておくと迷わない

3. **Step の順序調整**
   - Step 7（GameCanvas修正）を Step 6（旧コード削除）の前にする
   - 各ステップで動作確認しやすい

### 対応
上記3点は設計書に反映済み。

## 最終判定

設計としては承認。実装に入れるレベル。
