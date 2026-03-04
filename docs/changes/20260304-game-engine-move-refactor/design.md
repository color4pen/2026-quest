# 設計書: GameEngine.move() のサブマネージャー委譲

## 現状の問題

`GameEngine.move()` が 62 行で以下を全て処理:

1. 通行チェック（MapManager 経由）
2. 条件付き扉チェック（MapManager 経由）
3. NPC/宝箱インタラクション（InteractionHandler 経由）
4. 移動実行（Player 直接）
5. カメラ追従（CameraManager 経由）
6. ワープポイントチェック（MapManager 経由）
7. エンカウント判定（EncounterManager 経由）

サブマネージャーは存在するが、`move()` がオーケストレーションとロジックを混在させている。

## 方針

`MapManager` に通行・扉・ワープの統合チェックメソッドを追加。
`move()` はオーケストレーション（呼び出し順の制御）のみに集中。

## 変更内容

### 1. `src/engine/MapManager.ts` — 統合チェックメソッド追加

```typescript
/** 移動先の通行可否を判定（通行不可理由または null） */
getMovementBlock(position: Position, party: Party): string | null {
  const blockedReason = this.gameMap.getBlockedReason(position);
  if (blockedReason) return blockedReason;

  const door = this.gameMap.getDoorAt(position);
  if (door && !door.canPass(party)) return door.getBlockedMessage();

  return null;
}

/** ワープ先があればワープ情報を返す */
getWarpAt(position: Position): WarpPoint | null {
  return this.gameMap.getWarpAt(position);
}
```

### 2. `src/engine/GameEngine.ts` — move() 簡素化

```typescript
public move(direction: Direction): void {
  if (this.phase.type !== 'exploring') return;
  if (this.party.isAllDead()) return;

  const nextPosition = this.player.getNextPosition(direction);

  // 通行チェック（壁・扉）
  const blocked = this.mapManager.getMovementBlock(nextPosition, this.party);
  if (blocked) {
    this.addMessage(blocked, 'normal');
    this.notifyListeners();
    return;
  }

  // インタラクション（NPC・宝箱・固定敵）
  const interaction = this.interactionHandler.check(
    this.getAllInteractableObjects(), nextPosition, this.player
  );
  if (this.handleInteraction(interaction)) return;

  // 移動 → カメラ → ワープ → エンカウント
  this.player.moveTo(nextPosition);
  this.updateCamera();

  const warp = this.mapManager.getWarpAt(nextPosition);
  if (warp) {
    this.loadMap(warp.toMapId, warp.toX, warp.toY);
    this.notifyListeners();
    return;
  }

  this.checkEncounter();
  this.notifyListeners();
}

private handleInteraction(interaction: InteractionResult): boolean {
  switch (interaction.type) {
    case 'dialogue':
      this.startDialogue(interaction.npc);
      return true;
    case 'treasure':
      this.party.addGold(interaction.gold);
      this.addMessage(`宝箱を開けた！${interaction.gold} ゴールドを獲得！`, 'loot');
      return false;  // 宝箱は移動も行う
    case 'battle':
      this.addMessage(`${interaction.enemy.name}が現れた！`, 'combat');
      this.startBattle([interaction.enemy]);
      return true;
    case 'blocked':
      this.notifyListeners();
      return true;
    default:
      return false;
  }
}
```

## 効果

- `move()`: 62行 → ~25行
- 通行判定ロジックが `MapManager` に集約
- `handleInteraction` を private メソッドに分離

## テスト

既存の `GameEngine.test.ts`（12 tests）と `MapManager.test.ts`（6 tests）で検証。
`getMovementBlock` のテストを `MapManager.test.ts` に 2-3 件追加。
