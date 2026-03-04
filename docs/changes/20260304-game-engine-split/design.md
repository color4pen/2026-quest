# GameEngine 分割設計

## 実装状態: Phase 1 完了

**実装済み:**
- ✅ GameCommand型 + executeCommands()
- ✅ ShopHandler（購入ロジック）
- ✅ BattleHandler（バトル終了ロジック）
- ✅ DialogueHandler（宿屋回復ロジック）
- ✅ 16件の新規テスト追加（全221テスト通過）

**未実装:**
- ⏸️ SaveLoadHandler（複雑な副作用のため後日検討）

## 現状分析

**GameEngine.ts: 809行 → 821行（+executeCommands基盤）**

| セクション | 行数 | 責務 |
|-----------|------|------|
| インポート/型定義 | ~65 | GamePhase, GameEngineState |
| コンストラクタ/初期化 | ~65 | initialize, loadMap |
| 移動/インタラクション | ~90 | move, handleInteraction, checkEncounter |
| **バトル関連** | ~90 | startBattle, selectBattleCommand, handleBattleEnd等 |
| **会話関連** | ~50 | startDialogue, selectDialogueChoice等 |
| **ショップ関連** | ~50 | openShop, buyItem, closeShop |
| フィールドアイテム/装備 | ~55 | useFieldItem, equipItem, unequipItem |
| メッセージ/状態管理 | ~70 | addMessage, getState, subscribe |
| パーティー管理 | ~25 | recruitMember, getParty |
| **セーブ/ロード** | ~180 | save, load, restoreFromSaveData |

## 分割方針

GameEngineを「薄いオーケストレーター」に変え、ドメイン固有ロジックを専用ハンドラに委譲。

### 抽出対象

#### 1. BattleHandler (~100行)
バトル開始・コマンド選択・終了処理を担当。

```typescript
// src/engine/handlers/BattleHandler.ts
export class BattleHandler {
  constructor(
    private party: Party,
    private onAddMessage: (text: string, type: MessageType) => void,
    private onTransitionTo: (phase: GamePhase) => void,
    private gameStateManager: GameStateManager,
  ) {}

  startBattle(enemies: Enemy[]): BattleEngine { ... }
  selectCommand(command: BattleCommand): void { ... }
  useSkill(skill: SkillDefinition): void { ... }
  useItem(itemId: string): void { ... }
  cancelSelection(): void { ... }
  selectTarget(targetIndex: number): void { ... }
  handleBattleEnd(result: BattleResult, enemies: Enemy[]): void { ... }
  closeBattle(): void { ... }
}
```

**抽出メソッド:**
- `startBattle()` (274-287)
- `selectBattleCommand()` (289-291)
- `useBattleSkill()` (293-295)
- `useBattleItem()` (297-299)
- `cancelBattleSelection()` (301-303)
- `handleBattleEnd()` (305-350)
- `closeBattle()` (352-359)
- `selectBattleTarget()` (361-363)

#### 2. DialogueHandler (~60行)
会話開始・選択肢処理を担当。

```typescript
// src/engine/handlers/DialogueHandler.ts
export class DialogueHandler {
  constructor(
    private party: Party,
    private onAddMessage: (text: string, type: MessageType) => void,
    private onTransitionTo: (phase: GamePhase) => void,
    private onOpenShop: (npc: NPC) => void,
    private gameStateManager: GameStateManager,
  ) {}

  startDialogue(npc: NPC): DialogueEngine { ... }
  selectChoice(choice: DialogueChoice): void { ... }
  closeDialogue(): void { ... }
  advance(): void { ... }
}
```

**抽出メソッド:**
- `startDialogue()` (367-399)
- `selectDialogueChoice()` (401-403)
- `closeDialogue()` (405-409)
- `advanceDialogue()` (411-413)
- `handleHeal()` (519-529) - DialogueHandler内のコールバックで使用

#### 3. ShopHandler (~50行)
ショップ開閉・購入を担当。

```typescript
// src/engine/handlers/ShopHandler.ts
export class ShopHandler {
  constructor(
    private party: Party,
    private onAddMessage: (text: string, type: MessageType) => void,
    private onTransitionTo: (phase: GamePhase) => void,
  ) {}

  openShop(npc: NPC): void { ... }
  buyItem(shopItem: ShopItem): boolean { ... }
  closeShop(): void { ... }
}
```

**抽出メソッド:**
- `openShop()` (417-432)
- `buyItem()` (434-457)
- `closeShop()` (459-462)

#### 4. SaveLoadHandler (~190行)
セーブ/ロード・状態復元を担当。

```typescript
// src/engine/handlers/SaveLoadHandler.ts
export class SaveLoadHandler {
  constructor(
    private party: Party,
    private mapManager: MapManager,
    private gameStateManager: GameStateManager,
    private onAddMessage: (text: string, type: MessageType) => void,
    private onLoadMap: (mapId: string, x?: number, y?: number, skipCache?: boolean) => void,
  ) {}

  getSaveSlots(): SaveSlotInfo[] { ... }
  save(slotId: number, state: GameEngineState): boolean { ... }
  load(slotId: number): boolean { ... }
  private restoreFromSaveData(saveData: SaveData): void { ... }
  private restorePartyFromSaveData(saveData: SaveData): void { ... }
}
```

**抽出メソッド:**
- `getSaveSlots()` (664-666)
- `save()` (671-690)
- `load()` (695-714)
- `restoreFromSaveData()` (719-744)
- `restorePartyFromSaveData()` (749-807)

## 分割後の構造

```
src/engine/
├── GameEngine.ts              (821行) ← オーケストレーター + executeCommands基盤
├── calculators/
│   ├── types.ts               (50行)  - GameCommand型定義
│   ├── BattleCalculator.ts    (67行)  - バトル終了ロジック
│   ├── DialogueCalculator.ts  (25行)  - 宿屋回復ロジック
│   ├── ShopCalculator.ts      (32行)  - 購入ロジック
│   ├── *Calculator.test.ts    (16テスト)
│   └── index.ts
├── BattleEngine.ts            (665行) ← 既存
├── DialogueEngine.ts          (255行) ← 既存
├── MapManager.ts              (215行) ← 既存
└── ...
```

## GameEngine分割後の責務

```typescript
// 分割後の GameEngine (~350行)
export class GameEngine {
  // サブマネージャー（既存）
  private mapManager: MapManager;
  private cameraManager: CameraManager;
  private encounterManager: EncounterManager;
  private interactionHandler: InteractionHandler;

  // ハンドラー（新規）
  private battleHandler: BattleHandler;
  private dialogueHandler: DialogueHandler;
  private shopHandler: ShopHandler;
  private saveLoadHandler: SaveLoadHandler;

  // 残る責務
  // - 初期化 (initialize, loadMap)
  // - 移動 (move, handleInteraction, checkEncounter)
  // - フェーズ管理 (transitionTo, phase)
  // - メッセージ (addMessage)
  // - 状態取得 (getState)
  // - リスナー管理 (subscribe, notifyListeners)
  // - フィールドアイテム/装備 (useFieldItem, equipItem, unequipItem)
  // - パーティー管理 (recruitMember, getParty)

  // 委譲メソッド（薄いラッパー）
  public selectBattleCommand(cmd) { this.battleHandler.selectCommand(cmd); }
  public buyItem(item) { return this.shopHandler.buyItem(item); }
  // ...
}
```

## 実装順序

1. **Phase 1: SaveLoadHandler** (最も独立性が高い)
   - セーブ/ロード関連を抽出
   - テストは既存のGameEngine.test.tsでカバー

2. **Phase 2: ShopHandler** (依存が少ない)
   - ショップ関連を抽出

3. **Phase 3: DialogueHandler**
   - 会話関連を抽出
   - handleHeal()をコールバック経由で処理

4. **Phase 4: BattleHandler**
   - バトル関連を抽出
   - handleBattleEnd()のゲーム状態変更をコールバック経由で処理

## メリット

| 指標 | Before | After |
|------|--------|-------|
| GameEngine.ts 行数 | 809行 | ~350行 |
| 単一責任 | ❌ 5つの責務混在 | ✅ オーケストレーターのみ |
| テスト容易性 | △ 全体テスト必要 | ✅ ハンドラ単体テスト可 |
| 変更影響範囲 | 広い | 狭い |

## テスト戦略: コマンドパターン

### 問題: コールバック地獄
当初の設計ではハンドラがコールバック経由でGameEngineを操作するため、テスト時に大量のモックが必要。

### 解決: 純粋関数 + コマンド返却

ハンドラは「何をすべきか」をコマンドとして返し、GameEngineが実行：

```typescript
// src/engine/handlers/types.ts
export type GameCommand =
  | { type: 'addMessage'; text: string; messageType: MessageType }
  | { type: 'addGold'; amount: number }
  | { type: 'distributeXp'; xp: number }
  | { type: 'setGameState'; key: StateKey; value: number }
  | { type: 'transitionTo'; phase: GamePhase };

// src/engine/handlers/BattleHandler.ts
export function calculateBattleEndCommands(
  result: BattleResult,
  enemies: Enemy[],
  aliveMembers: PartyMember[]
): GameCommand[] {
  if (result !== 'victory') {
    return [
      { type: 'addMessage', text: '敗北した...ゲームオーバー', messageType: 'combat' },
      { type: 'transitionTo', phase: { type: 'game_over' } },
    ];
  }

  const totalXp = enemies.reduce((sum, e) => sum + e.xpReward, 0);
  const totalGold = enemies.reduce((sum, e) => sum + e.goldReward, 0);

  const commands: GameCommand[] = [
    { type: 'addMessage', text: '戦闘に勝利した！', messageType: 'combat' },
    { type: 'addMessage', text: `${totalXp} XP と ${totalGold} ゴールドを獲得！`, messageType: 'loot' },
    { type: 'addGold', amount: totalGold },
    { type: 'distributeXp', xp: totalXp },
  ];

  // ボス撃破フラグ
  for (const enemy of enemies) {
    if (enemy.battleConfig.onDefeat) {
      for (const change of enemy.battleConfig.onDefeat) {
        commands.push({ type: 'setGameState', key: change.key, value: change.value });
      }
    }
  }

  return commands;
}
```

### テスト例

```typescript
// src/engine/handlers/BattleHandler.test.ts
describe('calculateBattleEndCommands', () => {
  it('勝利時に正しいXPとゴールドのコマンドを返す', () => {
    const enemies = [
      { xpReward: 50, goldReward: 100, battleConfig: {} },
      { xpReward: 30, goldReward: 50, battleConfig: {} },
    ] as Enemy[];

    const commands = calculateBattleEndCommands('victory', enemies, []);

    expect(commands).toContainEqual({ type: 'addGold', amount: 150 });
    expect(commands).toContainEqual({ type: 'distributeXp', xp: 80 });
  });

  it('敗北時にゲームオーバーへ遷移するコマンドを返す', () => {
    const commands = calculateBattleEndCommands('defeat', [], []);

    expect(commands).toContainEqual({
      type: 'transitionTo',
      phase: { type: 'game_over' },
    });
  });

  it('ボス撃破時にゲーム状態変更コマンドを含む', () => {
    const boss = {
      xpReward: 100,
      goldReward: 200,
      battleConfig: {
        onDefeat: [{ key: 'boss_forest_defeated', value: 1 }],
      },
    } as Enemy;

    const commands = calculateBattleEndCommands('victory', [boss], []);

    expect(commands).toContainEqual({
      type: 'setGameState',
      key: 'boss_forest_defeated',
      value: 1,
    });
  });
});
```

### GameEngine側の実行

```typescript
// GameEngine.ts
private executeCommands(commands: GameCommand[]): void {
  for (const cmd of commands) {
    switch (cmd.type) {
      case 'addMessage':
        this.addMessage(cmd.text, cmd.messageType);
        break;
      case 'addGold':
        this.party.addGold(cmd.amount);
        break;
      case 'distributeXp':
        this.distributeXpToAliveMembers(cmd.xp);
        break;
      case 'setGameState':
        this.gameStateManager.set(cmd.key, cmd.value);
        break;
      case 'transitionTo':
        this.transitionTo(cmd.phase);
        break;
    }
  }
}
```

## 利点

| 観点 | コールバック方式 | コマンド方式 |
|------|-----------------|-------------|
| テスト容易性 | △ モック多数 | ✅ 純粋関数 |
| 可読性 | △ 副作用が分散 | ✅ 明示的 |
| デバッグ | △ 追跡困難 | ✅ コマンドログ可 |
| 再利用性 | △ 結合度高 | ✅ 独立 |

## 注意点

- 循環依存を避けるため、ハンドラはGameEngineをimportしない
- 既存のpublicメソッドシグネチャは維持（後方互換性）
- GameCommand型は拡張可能に設計

## 追加テスト候補

- `BattleHandler.test.ts`: calculateBattleEndCommands() - 報酬計算、ゲーム状態変更
- `ShopHandler.test.ts`: calculatePurchaseCommands() - 購入判定、在庫更新
- `SaveLoadHandler.test.ts`: buildRestoreCommands() - 復元コマンド生成
