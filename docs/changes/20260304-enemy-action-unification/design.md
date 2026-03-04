# EnemyAI の Action 統一

## 概要

敵の行動を Action パターンに統一し、プレイヤーと同じダメージ計算パスを通るようにする。
これにより Enemy.getAvailableActions() が実際に使用され、ダメージ計算ロジックの二重管理を解消する。

## 現状分析

### EnemyAI（73行）

```typescript
decideAction(enemy: Enemy): 'attack' | 'power_attack' | 'wait'

executeTurn(enemy: Enemy, aliveMembers: PartyMember[]): EnemyTurnResult {
  // 文字列で分岐
  // 直接ダメージ計算
  const damage = enemy.calculateAttackDamage();
  const actualDamage = targetMember.takeDamage(totalDamage);
}
```

### Enemy.getAvailableActions()（デッドコード）

```typescript
getAvailableActions(): Action[] {
  return [new AttackAction()];  // 誰も呼んでいない
}
```

### 問題点

1. **ダメージ計算の二重パス**: プレイヤーは AttackAction 経由、敵は EnemyAI.executeTurn 内で直接計算
2. **デッドコード**: Enemy.getAvailableActions() が使われていない
3. **拡張困難**: 敵スキルを追加するとき EnemyAI を大幅改修が必要
4. **毒攻撃の特別処理**: battleConfig.poisonChance の処理が EnemyAI にハードコード

## 設計方針

### AttackAction の拡張（クラス追加を最小化）

```typescript
interface AttackOptions {
  multiplier?: number;    // ダメージ倍率（デフォルト: 1.0）
  name?: string;          // 「強攻撃」など
  poisonChance?: number;  // 毒付与確率
}

class AttackAction implements Action {
  constructor(private options: AttackOptions = {}) {}

  execute(target: Combatant, context: ActionContext): ActionResult {
    // ログの type は performer から判定
    const logType = isPlayerCombatant(context.performer) ? 'player' : 'enemy';

    const multiplier = this.options.multiplier ?? 1.0;
    const damage = CombatCalculator.calculateAttackDamage(...) * multiplier;
    // ...
  }
}

// 使用例
new AttackAction()                                    // 通常攻撃
new AttackAction({ multiplier: 1.5, name: '強攻撃' })  // 強攻撃
new AttackAction({ poisonChance: 0.3 })               // 毒攻撃
```

### 新規 Action は WaitAction のみ

```typescript
class WaitAction implements Action {
  execute(target: Combatant, context: ActionContext): ActionResult {
    return {
      success: true,
      logs: [{ text: `${context.performer.name}は様子を見ている...`, type: 'enemy' }]
    };
  }
}
```

### 毒攻撃の処理

followUpActions ではなく、ActionResult 内で処理：

```typescript
interface ActionResult {
  success: boolean;
  logs: ActionLog[];
  followUpActions?: Action[];
  appliedEffects?: StatusEffectApplication[];  // 追加
}

// または AttackAction 内で直接処理
if (poisonChance > 0 && Math.random() < poisonChance) {
  target.poison();
  logs.push({ text: `${target.name}は毒を受けた！`, type: 'damage' });
}
```

### EnemyAI の簡素化

```typescript
class EnemyAI {
  decideAction(enemy: Enemy): { action: Action; target: PartyMember } {
    // AI タイプに基づいて Action を選択
    // ターゲットも同時に決定
  }
}
```

### BattleEngine の変更

```typescript
private executeEnemyTurn(enemy: Enemy): void {
  const { action, target } = this.enemyAI.decideAction(enemy, this.getAliveMembers());

  const context: ActionContext = {
    performer: enemy,
    allies: this.getAliveEnemies(),
    enemies: this.getAliveMembers(),
  };

  const result = action.execute(target, context);
  this.addLogs(result.logs);
}
```

## 実装計画

### Step 1: AttackAction 拡張
- damageMultiplier パラメータ追加
- attackName パラメータ追加（オプション）
- ログ type を performer から判定（isPlayerCombatant）
- 毒攻撃処理を内部に（poisonChance パラメータ）

### Step 2: WaitAction 作成
- 様子見アクション

### Step 3: Enemy.getAvailableActions() 実装
- battleConfig に基づいて使用可能な Action を返す
- 強攻撃持ち: AttackAction(1.5)
- 毒攻撃持ち: AttackAction(1.0, undefined, poisonChance)

### Step 4: EnemyAI リファクタリング
- decideAction() が { action, target } を返す
- executeTurn() を削除

### Step 5: BattleEngine 統合
- executeEnemyTurn() が Action.execute() を呼ぶ

## 期待される効果

| 指標 | Before | After |
|-----|--------|-------|
| ダメージ計算パス | 2箇所 | 1箇所（AttackAction経由） |
| Enemy.getAvailableActions() | デッドコード | 実使用 |
| 新規 Action クラス | - | 1個（WaitAction） |
| EnemyAI 行数 | 73行 | ~25行（予想） |

## ファイル構成

```
src/models/actions/
├── AttackAction.ts         # 拡張（倍率、毒）
├── WaitAction.ts           # 新規（様子見）
└── index.ts                # export追加
```

## リスク

1. **AttackAction のテスト影響**: パラメータ追加でテスト修正が必要
2. **防御判定ログ**: target.isDefending の判定を Action 内に移動
3. **毒攻撃の確率処理**: Math.random() — テスト時は vi.spyOn でモック

## 承認

- [ ] 設計レビュー完了
- [ ] 実装開始
