# 設計書: BattleEngine のアクション実行分離

## 現状の問題

`BattleEngine.ts` が 787 行で以下の責務を持つ:

1. **ターン管理**: フェーズ遷移、メンバー選択順、行動キュー
2. **コマンド選択**: attack/skill/item/defend の UI 状態管理
3. **アクション実行**: executeAttack/executeSkill/executeItem/executeDefend（~100行）
4. **敵 AI**: decideEnemyAction/executeEnemyTurn（~130行）
5. **状態管理**: getState/subscribe/notify

## 方針

アクション実行と敵 AI を別クラスに分離。BattleEngine はターン制御とフェーズ管理に集中。

## 新規ファイル

### 1. `src/engine/BattleActionExecutor.ts`（~120行）

アクションの実行とログ生成を担当:

```typescript
export interface BattleActionResult {
  logs: { text: string; type: BattleLogEntry['type'] }[];
}

export class BattleActionExecutor {
  constructor(private party: Party, private enemies: Enemy[]) {}

  executeAttack(member: PartyMember, targetIndex: number): BattleActionResult { ... }
  executeSkill(member: PartyMember, skill: SkillDefinition, targetIndex?: number, partyTargetId?: string): BattleActionResult { ... }
  executeItem(member: PartyMember, itemId: string, targetIndex?: number, partyTargetId?: string): BattleActionResult { ... }
  executeDefend(member: PartyMember): BattleActionResult { ... }
}
```

### 2. `src/engine/EnemyAI.ts`（~80行）

敵の行動決定と実行:

```typescript
export interface EnemyTurnResult {
  logs: { text: string; type: BattleLogEntry['type'] }[];
  targetDied: boolean;
  poisonApplied: boolean;
}

export class EnemyAI {
  decideAction(enemy: Enemy): 'attack' | 'power_attack' | 'wait' { ... }
  executeTurn(enemy: Enemy, aliveMembers: PartyMember[]): EnemyTurnResult { ... }
}
```

### 3. `src/engine/BattleEngine.ts`（~500行）

- `BattleActionExecutor` と `EnemyAI` をコンストラクタで生成
- `executeAttack` 等を `this.executor.executeAttack(...)` に委譲
- ログ追加は result を受け取って `addLog` に流す

## 変更パターン

```typescript
// Before (BattleEngine)
private executeAttack(member: PartyMember, targetIndex: number): void {
  const target = this.enemies[targetIndex];
  if (!target || target.isDead()) return;
  const damage = member.calculateAttackDamage();
  target.takeDamage(damage);
  this.addLog(`${member.name}の攻撃！`, 'player');
  this.addLog(`${target.name}に ${damage} のダメージ！`, 'damage');
  if (target.isDead()) {
    this.addLog(`${target.name}を倒した！`, 'system');
  }
}

// After (BattleEngine)
private executeAttack(member: PartyMember, targetIndex: number): void {
  const result = this.executor.executeAttack(member, targetIndex);
  this.addLogs(result.logs);
}
```

## テスト

### 新規テスト

- `BattleActionExecutor.test.ts`（~10 tests）
  - 通常攻撃: ダメージ計算、敵死亡、ログ
  - スキル: 攻撃スキル、回復スキル、MP 不足
  - アイテム: 回復、ダメージ、状態異常治療
  - 防御

- `EnemyAI.test.ts`（~5 tests）
  - aggressive/defensive/random AI タイプ
  - 毒付与判定
  - ターゲット選択（ランダム）

### 既存テスト

`BattleEngine.test.ts`（9 tests）はそのまま通るはず（公開 API は変わらない）。

## 実装順序

1. BattleActionExecutor を作成 + テスト
2. EnemyAI を作成 + テスト
3. BattleEngine から委譲に切り替え
4. 既存テスト確認
