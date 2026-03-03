# 設計書: ステートマシン導入 (レビュー 2-5)

## 現状の問題

GameEngine が `battleEngine`, `dialogueEngine`, `shopState` を個別に保持しており、理論上3つが同時に active になりうる。`move()` 冒頭で `if (this.battleEngine || this.dialogueEngine || this.shopState)` と手動チェックしているが、新しい状態が増えるたびにチェック漏れのリスクがある。

```typescript
// 現状: 個別フラグ
private battleEngine: BattleEngine | null;
private dialogueEngine: DialogueEngine | null;
private shopState: ShopState | null;
```

## 設計方針

### GamePhase enum の導入

```typescript
type GamePhase =
  | { type: 'exploring' }
  | { type: 'battle'; engine: BattleEngine }
  | { type: 'dialogue'; engine: DialogueEngine }
  | { type: 'shop'; state: ShopState }
  | { type: 'game_over' };
```

Tagged union により、フェーズが排他的であることを**型レベル**で保証する。

### GameEngine への適用

```typescript
// Before
private battleEngine: BattleEngine | null;
private dialogueEngine: DialogueEngine | null;
private shopState: ShopState | null;
private isGameOver: boolean;

// After
private phase: GamePhase = { type: 'exploring' };
```

### フェーズ遷移メソッド

```typescript
private transitionTo(newPhase: GamePhase): void {
  // 前のフェーズのクリーンアップ
  if (this.phase.type === 'battle') {
    // clearPendingTimers 等
  }
  this.phase = newPhase;
  this.notifyListeners();
}
```

### move() の簡素化

```typescript
// Before
if (this.battleEngine || this.dialogueEngine || this.shopState ||
    this.isGameOver || this.party.isAllDead()) {
  return;
}

// After
if (this.phase.type !== 'exploring') return;
if (this.party.isAllDead()) return;
```

### getState() の変更

```typescript
// Before
battle: this.battleEngine?.getState() ?? null,
dialogue: this.dialogueEngine?.getState() ?? null,
shop: this.shopState,
isGameOver: this.isGameOver,

// After
battle: this.phase.type === 'battle' ? this.phase.engine.getState() : null,
dialogue: this.phase.type === 'dialogue' ? this.phase.engine.getState() : null,
shop: this.phase.type === 'shop' ? this.phase.state : null,
isGameOver: this.phase.type === 'game_over',
```

## 影響範囲

### 変更ファイル

| ファイル | 変更内容 |
|---------|----------|
| `src/engine/GameEngine.ts` | `phase: GamePhase` に統合、全フェーズ関連メソッドを更新 |
| `src/types/game.ts` | `GamePhase` 型定義を追加 |

### 変更不要

- `GameEngineState` — `battle`, `dialogue`, `shop`, `isGameOver` フィールドは維持（React 側は変更不要）
- React コンポーネント — `GameEngineState` 経由で読み取るため影響なし
- `BattleEngine`, `DialogueEngine` — 内部変更なし

## フェーズ遷移図

```
                    ┌──────────┐
          ┌─────── │exploring │ ◄──────────┐
          │         └────┬─────┘            │
          │              │                  │
     NPC接触        敵接触/遭遇       closeBattle/
          │              │            closeDialogue/
          ▼              ▼            closeShop
    ┌──────────┐   ┌──────────┐
    │ dialogue │   │  battle  │
    └────┬─────┘   └────┬─────┘
         │              │
    openShop        敗北
         │              │
         ▼              ▼
    ┌──────────┐   ┌───────────┐
    │   shop   │   │ game_over │
    └──────────┘   └───────────┘
```

## リスク

- `startDialogue` → `onOpenShop` の遷移が dialogue → shop への直接遷移になる。`transitionTo` で前フェーズのクリーンアップが必要
- `handleBattleEnd` で勝利/敗北の分岐が `transitionTo('exploring')` / `transitionTo('game_over')` になる
- セーブ/ロード時に `phase` を `exploring` にリセットする必要がある

## 実装順序

1. `GamePhase` 型定義を `src/types/game.ts` に追加
2. GameEngine のフィールドを `phase` に統合
3. `startBattle`, `startDialogue`, `openShop` を `transitionTo` 経由に変更
4. `closeBattle`, `closeDialogue`, `closeShop` を `transitionTo({ type: 'exploring' })` に変更
5. `move()`, `getState()` を更新
6. `restoreFromSaveData` で `phase` を `exploring` に設定
7. `tsc --noEmit` で型チェック通過を確認
