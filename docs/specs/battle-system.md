# バトルシステム設計ドキュメント

## 概要

ドラクエ風のターン制バトルシステムを採用しています。パーティー全員がコマンドを選択した後、味方全員→敵全員の順で行動を実行します。

## ターン制御フロー

```
┌─────────────────────────────────────────────────────────────┐
│                        ターン開始                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              コマンド選択フェーズ (command_select)           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  メンバー1: こうげき → ターゲット選択                  │   │
│  │  メンバー2: スキル → スキル選択 → ターゲット選択       │   │
│  │  メンバー3: アイテム → アイテム選択 → 即キュー         │   │
│  │  メンバー4: ぼうぎょ → 即キュー                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                 全員選択完了 → actionQueueに蓄積            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              パーティー行動フェーズ (party_action)           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  actionQueueから順番に行動を実行                       │   │
│  │  (死亡メンバーはスキップ)                             │   │
│  │                                                      │   │
│  │  勝利チェック → 敵全滅なら battle_end                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              敵行動フェーズ (enemy_action)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  生存している敵が順番に行動                           │   │
│  │  ランダムな味方をターゲットに攻撃                      │   │
│  │                                                      │   │
│  │  敗北チェック → 全滅なら battle_end                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      ターン終了処理                          │
│  - 状態異常ダメージ（毒など）— 防御状態を反映                │
│  - 防御状態リセット（状態異常処理後）                        │
│  - 全滅チェック                                             │
│  - 次のターンへ                                             │
└─────────────────────────────────────────────────────────────┘
```

## バトルフェーズ

```typescript
type BattlePhase =
  | 'command_select'       // コマンド選択中
  | 'skill_select'         // スキル選択中
  | 'item_select'          // アイテム選択中
  | 'target_select'        // 敵ターゲット選択中
  | 'party_target_select'  // 味方ターゲット選択中（回復用）
  | 'party_action'         // パーティー行動実行中
  | 'enemy_action'         // 敵行動中
  | 'battle_end';          // 戦闘終了
```

## BattleEngine クラス

### 主要プロパティ

```typescript
class BattleEngine {
  private party: Party;                    // パーティー
  private enemies: Enemy[];                // 敵リスト
  private phase: BattlePhase;              // 現在のフェーズ
  private result: BattleResult | null;     // 勝敗結果
  private logs: BattleLogEntry[];          // バトルログ
  private currentMemberIndex: number;      // 現在のメンバーインデックス
  private currentEnemyTurnIndex: number;   // 現在の敵インデックス
  private actionQueue: PartyMemberAction[]; // 行動キュー
  private pendingAction: {...} | null;     // 保留中のアクション
  private pendingTimers: ReturnType<typeof setTimeout>[]; // アニメーション用タイマー管理
}
```

### 公開メソッド

| メソッド | 説明 |
|---------|------|
| `selectCommand(command)` | コマンドを選択（attack/skill/item/defend） |
| `useSkill(skill)` | スキルを選択 |
| `useItem(itemId)` | アイテムを選択 |
| `selectTarget(index)` | 敵ターゲットを選択 |
| `cancelSelection()` | 選択をキャンセル |
| `getState()` | 現在の状態を取得（React用） |
| `subscribe(listener)` | 状態変更リスナーを登録 |
| `setOnBattleEnd(callback)` | 戦闘終了コールバックを設定 |

### 行動キューシステム

```typescript
interface PartyMemberAction {
  memberId: string;
  command: BattleCommand;      // 'attack' | 'skill' | 'item' | 'defend'
  targetIndex?: number;        // 敵ターゲット
  partyTargetId?: string;      // 味方ターゲット
  skill?: SkillDefinition;
  itemId?: string;
}
```

コマンド選択時に `actionQueue` に追加され、全員選択完了後に順番に実行されます。

## コマンド詳細

### こうげき (attack)

```typescript
private executeAttack(member: PartyMember, targetIndex: number): void {
  const damage = member.calculateAttackDamage();
  target.takeDamage(damage);
  // ログ出力
}
```

- ダメージ計算: `attack + random(0-5)`
- 敵が1体の場合は自動選択

### スキル (skill)

```typescript
interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  power: number;           // 倍率 or 回復量
  type: 'attack' | 'heal';
  target: 'enemy' | 'self';
}
```

| スキル | MP | 効果 |
|--------|-----|------|
| 強打 | 5 | 1.5倍ダメージ |
| 回復 | 8 | HP30回復 |
| 炎斬り | 12 | 2.0倍ダメージ |

### アイテム (item)

アイテムシステムと連携。`canUseInBattle()` が true のアイテムのみ選択可能。

- 回復アイテム: 即座にキュー（自分対象）
- ダメージアイテム: ターゲット選択後にキュー

### ぼうぎょ (defend)

```typescript
private executeDefend(member: PartyMember): void {
  member.defend();  // private _isDefending を true にセット
  // ダメージ半減
}
```

## 敵AIシステム

### AI種別

```typescript
type EnemyAIType = 'aggressive' | 'defensive' | 'random';
```

| AI | 強攻撃 | 様子見 | 通常攻撃 |
|----|--------|--------|----------|
| aggressive | 30% | 0% | 70% |
| defensive | 0% | 30% | 70% |
| random | 20% | 20% | 60% |

### 敵設定

```typescript
interface EnemyBattleConfig {
  name: string;
  image?: string;
  aiType: EnemyAIType;
  hpMultiplier: number;      // HP倍率
  attackMultiplier: number;  // 攻撃力倍率
  xpMultiplier: number;      // 経験値倍率
  goldMultiplier: number;    // ゴールド倍率
  poisonChance?: number;     // 毒付与確率
}
```

### 敵テンプレート例

| 敵 | AI | HP倍率 | 攻撃倍率 | 毒確率 |
|----|-----|-------|---------|--------|
| スライム | random | 0.8 | 0.7 | 15% |
| ゴブリン | aggressive | 1.0 | 1.0 | - |
| ゾンビ | defensive | 1.4 | 0.8 | 25% |
| オーク | aggressive | 1.5 | 1.4 | - |

## 状態異常処理

ターン終了時に `processStatusEffects()` が呼ばれ、毒などのダメージを処理します。

```typescript
private processStatusEffects(): void {
  for (const member of this.party.getMembers()) {
    if (member.isAlive()) {
      const results = member.processStatusEffectsTurnEnd();
      for (const result of results) {
        this.addLog(result.message, 'damage');
      }
    }
  }
}
```

## バトルログ

```typescript
interface BattleLogEntry {
  id: number;
  text: string;
  type: 'player' | 'enemy' | 'system' | 'damage' | 'heal';
}
```

- 最大30件を保持
- UIで色分け表示

## React連携

### BattleState

```typescript
interface BattleState {
  isActive: boolean;
  phase: BattlePhase;
  result: BattleResult | null;
  partyMembers: PartyMemberBattleState[];
  currentMemberIndex: number;
  enemies: EnemyBattleState[];
  selectedTargetIndex: number | null;
  currentEnemyTurnIndex: number;
  logs: BattleLogEntry[];
  selectedCommand: BattleCommand | null;
}
```

### 使用例（GameEngine内）

```typescript
private startBattle(enemies: Enemy[]): void {
  this.battleEngine = new BattleEngine(this.party, enemies);

  this.battleEngine.setOnBattleEnd((result, defeatedEnemies) => {
    this.handleBattleEnd(result, defeatedEnemies);
  });

  this.battleEngine.subscribe(() => {
    this.notifyListeners();
  });
}
```

## 新しい敵の追加方法

### Step 1: ENEMY_TEMPLATES に追加

```typescript
// src/types/battle.ts
{
  name: 'ドラゴン',
  image: '/assets/images/enemies/dragon.png',
  aiType: 'aggressive',
  hpMultiplier: 3.0,
  attackMultiplier: 2.0,
  xpMultiplier: 5.0,
  goldMultiplier: 3.0,
},
```

### Step 2: マップのエンカウント設定に追加

```typescript
// マップ定義
encounter: {
  rate: 0.1,
  enemyIds: ['スライム', 'ドラゴン'],
}
```

## 新しいスキルの追加方法

### Step 1: スキル定義を追加

```typescript
// src/data/partyMembers.ts または types/battle.ts
{
  id: 'ice_blast',
  name: '氷撃',
  description: '氷の魔法（2.5倍ダメージ）',
  mpCost: 15,
  power: 2.5,
  type: 'attack',
  target: 'enemy',
}
```

### Step 2: キャラクターのスキルリストに追加

```typescript
// partyMembers.ts
skills: [
  ...existingSkills,
  { id: 'ice_blast', ... },
]
```

## タイマー管理

アクション間の遅延に `setTimeout` を使用する。バトル終了時にタイマーが残らないよう管理する。

```typescript
// 遅延実行をスケジュール（タイマーID管理付き）
private scheduleAction(callback: () => void, delay: number): void;

// 未実行のタイマーを全てクリア（バトル終了時に呼び出し）
private clearPendingTimers(): void;
```

## Observer パターン

`subscribe()` でリスナーを登録し、状態変更時に `notifyListeners()` で通知する。
リスナー内で例外が発生しても後続のリスナーに通知されるよう、各リスナー呼び出しを `try-catch` で囲む。

```typescript
private notifyListeners(): void {
  this.markDirty();
  const state = this.getState();
  this.listeners.forEach(listener => {
    try {
      listener(state);
    } catch (e) {
      console.error('Listener error:', e);
    }
  });
}
```

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/engine/BattleEngine.ts` | バトルロジック |
| `src/types/battle.ts` | 型定義・敵テンプレート |
| `src/components/BattleModal.tsx` | バトルUI |
| `src/models/Enemy.ts` | 敵クラス |
| `src/models/PartyMember.ts` | メンバークラス |
| `src/models/Party.ts` | パーティー管理 |
