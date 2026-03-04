# Rich Domain Model への移行

## 概要

バトルシステムを「エンジン中心」から「キャラクター中心」のアーキテクチャに移行する。
キャラクターが自身の行動を知り、実行できるようにすることで、装備やスキルによる行動追加を自然に表現できるようにする。

## 現状分析

### 現在のアーキテクチャ（Anemic Domain Model）

```
BattleEngine (665行)
  ├─ フェーズ管理
  ├─ アクションキュー管理
  ├─ コマンド選択処理
  └─ 行動実行の振り分け → BattleActionExecutor

BattleActionExecutor (122行)
  ├─ executeAttack()
  ├─ executeSkill()
  ├─ executeItem()
  └─ executeDefend()

PartyMember (418行)
  └─ データ保持 + 計算メソッド（受動的）

Enemy (94行)
  └─ データ保持（受動的）
```

### 問題点

1. **行動追加の困難さ**: 新しい行動タイプを追加するたびに BattleEngine と BattleActionExecutor を修正必要
2. **装備による行動追加が不自然**: 「2回行動」「カウンター」等の装備効果をエンジン側で特別処理
3. **テストの複雑さ**: 行動のテストにエンジン全体のセットアップが必要
4. **責務の分散**: 「攻撃」の知識がエンジン、Executor、PartyMember に分散

## 設計方針

### Rich Domain Model

```
Action（行動オブジェクト）
  ├─ AttackAction
  ├─ SkillAction
  ├─ DefendAction
  ├─ ItemAction
  └─ 装備から付与されるAction

Combatant（戦闘参加者）
  ├─ PartyMember
  └─ Enemy

  getAvailableActions(): Action[]  // 自分ができる行動を返す
  performAction(action, context)   // 行動を実行

BattleEngine
  └─ ターン管理のみ（誰のターンか、勝敗判定）
```

### 新規インターフェース設計

```typescript
// src/models/actions/Action.ts
interface ActionContext {
  performer: Combatant;
  allies: Combatant[];
  enemies: Combatant[];
}

interface ActionResult {
  success: boolean;
  logs: ActionLog[];
  // 追加効果
  followUpActions?: Action[];  // 追撃等
}

interface Action {
  readonly id: string;
  readonly name: string;
  readonly type: 'attack' | 'skill' | 'defend' | 'item';

  // ターゲットタイプ
  getTargetType(): 'single_enemy' | 'all_enemies' | 'single_ally' | 'self' | 'none';

  // 使用可能判定
  canExecute(context: ActionContext): boolean;

  // 実行
  execute(target: Combatant | null, context: ActionContext): ActionResult;
}
```

```typescript
// src/models/Combatant.ts
interface Combatant {
  readonly id: string;
  readonly name: string;

  // HP/ステータス
  get hp(): number;
  get maxHp(): number;
  get attack(): number;
  get defense(): number;

  // 戦闘アクション
  takeDamage(amount: number): number;
  heal(amount: number): number;

  // 行動
  getAvailableActions(): Action[];

  // 状態
  isAlive(): boolean;
  isDead(): boolean;
}
```

### 行動クラス設計

```typescript
// src/models/actions/AttackAction.ts
class AttackAction implements Action {
  readonly id = 'attack';
  readonly name = '攻撃';
  readonly type = 'attack';

  getTargetType() { return 'single_enemy'; }

  canExecute(context: ActionContext): boolean {
    return context.performer.isAlive();
  }

  execute(target: Combatant, context: ActionContext): ActionResult {
    const damage = CombatCalculator.calculateAttackDamage({
      attack: context.performer.attack,
      isPlayer: true,
    });
    const actualDamage = target.takeDamage(damage);

    return {
      success: true,
      logs: [
        { text: `${context.performer.name}の攻撃！`, type: 'player' },
        { text: `${target.name}に ${actualDamage} のダメージ！`, type: 'damage' },
        ...(target.isDead() ? [{ text: `${target.name}を倒した！`, type: 'system' }] : []),
      ],
    };
  }
}
```

### PartyMember の変更

```typescript
class PartyMember implements Combatant {
  // 既存のプロパティ...

  getAvailableActions(): Action[] {
    const actions: Action[] = [
      new AttackAction(),
      new DefendAction(),
    ];

    // スキルから行動追加
    for (const skill of this._skills) {
      actions.push(new SkillAction(skill));
    }

    // 装備から行動追加
    for (const equipment of this.equipment.getAll()) {
      if (equipment?.grantedActions) {
        actions.push(...equipment.grantedActions);
      }
    }

    return actions;
  }
}
```

### BattleEngine の簡素化

```typescript
// 行動実行部分が大幅に簡素化
private executePartyMemberAction(member: PartyMember, queuedAction: QueuedAction): void {
  const action = queuedAction.action;
  const target = queuedAction.target;

  const context: ActionContext = {
    performer: member,
    allies: this.party.getAliveMembers(),
    enemies: this.getAliveEnemies(),
  };

  const result = action.execute(target, context);
  this.addLogs(result.logs);

  // 追撃処理
  if (result.followUpActions) {
    for (const followUp of result.followUpActions) {
      const followUpResult = followUp.execute(target, context);
      this.addLogs(followUpResult.logs);
    }
  }
}
```

## 実装計画

### Step 1: Action インターフェース定義
- `Action`, `ActionContext`, `ActionResult` インターフェース作成
- `Combatant` インターフェース作成

### Step 2: 基本 Action クラス実装
- `AttackAction` 実装 + テスト
- `DefendAction` 実装 + テスト
- `SkillAction` 実装 + テスト
- `ItemAction` 実装 + テスト

### Step 3: Combatant 実装
- `PartyMember` に `Combatant` 実装、`getAvailableActions()` 追加
- `Enemy` に `Combatant` 実装

### Step 4: BattleEngine 移行
- `BattleActionExecutor` の処理を Action に移行
- `BattleEngine` を Action ベースに変更
- `BattleActionExecutor` を削除

### Step 5: 装備による行動追加
- `EquipmentItem` に `grantedActions` プロパティ追加
- 二回行動、カウンター等のサンプル実装

## 期待される効果

| 指標 | Before | After |
|-----|--------|-------|
| 新行動追加時の変更箇所 | 3ファイル | 1ファイル（新Action） |
| 装備効果の実装 | エンジン改修 | アイテム定義のみ |
| 行動のテスト | エンジン必要 | Action単体テスト可能 |
| BattleEngine 行数 | 665 | ~400 (予想) |

## ファイル構成

```
src/models/
├── actions/
│   ├── Action.ts          # インターフェース
│   ├── ActionContext.ts   # コンテキスト型
│   ├── AttackAction.ts
│   ├── DefendAction.ts
│   ├── SkillAction.ts
│   ├── ItemAction.ts
│   └── index.ts
├── Combatant.ts           # インターフェース
├── PartyMember.ts         # Combatant実装
└── Enemy.ts               # Combatant実装
```

## リスク

1. **後方互換性**: 既存のセーブデータとの互換性維持が必要
2. **UIへの影響**: BattleState の構造変更が必要な可能性
3. **段階的移行**: 一度に全部変えると危険、段階的に移行

## 実施結果

| 指標 | Before | After |
|-----|--------|-------|
| Action クラス | 0 | 4 (Attack, Defend, Skill, Item) |
| Action テスト | 0 | 53件 |
| Combatant 実装 | 0 | 2 (PartyMember, Enemy) |
| BattleActionExecutor | 直接処理 | Action 委譲 |

### 作成したファイル

| ファイル | 行数 | 説明 |
|---------|------|------|
| src/models/Combatant.ts | 38 | Combatant インターフェース |
| src/models/actions/Action.ts | 79 | Action インターフェース |
| src/models/actions/AttackAction.ts | 50 | 通常攻撃 |
| src/models/actions/DefendAction.ts | 32 | 防御 |
| src/models/actions/SkillAction.ts | 100 | スキル（攻撃/回復） |
| src/models/actions/ItemAction.ts | 115 | アイテム使用 |

### 次のステップ（将来の拡張）

- BattleEngine を Action ベースに完全移行（BattleActionExecutor 削除）
- 装備から行動を付与する機能（`equipment.grantedActions`）
- 敵のスキル行動対応

## 承認

- [x] 設計レビュー完了
- [x] 実装完了
