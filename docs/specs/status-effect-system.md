# 状態異常システム設計ドキュメント

## 概要

本ゲームの状態異常システムはオブジェクト指向設計を採用しています。各状態異常が自身の効果・タイミング・解除条件を内包しており、新しい状態異常の追加が容易な設計となっています。

## アーキテクチャ

```
src/
├── types/
│   └── statusEffect.ts           # 型定義・インターフェース
│
└── models/
    ├── PartyMember.ts            # 状態異常を保持・管理
    │
    ├── statusEffects/
    │   ├── index.ts              # エクスポート
    │   ├── BaseStatusEffect.ts   # 抽象基底クラス
    │   ├── PoisonEffect.ts       # 毒
    │   ├── InfluenzaEffect.ts    # インフルエンザ
    │   └── StatusEffectFactory.ts # ファクトリー
    │
    └── conditions/               # 通過条件（状態異常と連携）
        ├── PassCondition.ts      # インターフェース
        ├── NoInfluenzaCondition.ts
        └── ConditionFactory.ts
```

## クラス図

```
┌─────────────────────────────────────────────────────────────┐
│                    StatusEffect (interface)                  │
├─────────────────────────────────────────────────────────────┤
│ + type: StatusEffectType                                    │
│ + name: string                                              │
│ + shortName: string                                         │
│ + remainingTurns: number                                    │
│ + color: string                                             │
├─────────────────────────────────────────────────────────────┤
│ + onTurnStart(target): StatusEffectResult | null            │
│ + onTurnEnd(target): StatusEffectResult | null              │
│ + onDamageReceived(target, damage): StatusEffectResult | null│
│ + onAction(target): StatusEffectResult | null               │
│ + shouldRemove(): boolean                                   │
│ + tick(): void                                              │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ implements
                              │
              ┌───────────────┴───────────────┐
              │      BaseStatusEffect         │
              │        (abstract class)       │
              ├───────────────────────────────┤
              │ + remainingTurns: number      │
              │ # constructor(duration)       │
              │ + tick(): void                │
              │ + shouldRemove(): boolean     │
              │ + onTurnStart(): null         │
              │ + onTurnEnd(): null           │
              │ + onDamageReceived(): null    │
              │ + onAction(): null            │
              └───────────────┬───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  PoisonEffect │   │InfluenzaEffect│   │  (将来追加)   │
├───────────────┤   ├───────────────┤   └───────────────┘
│ type: poison  │   │type: influenza│
│ name: 毒      │   │name:インフル  │
│ shortName:PSN │   │shortName: FLU │
│ color: 紫     │   │ color: オレンジ│
│ damageRate:10%│   │ damageRate: 5%│
├───────────────┤   ├───────────────┤
│ onTurnEnd()   │   │ onTurnEnd()   │
│ → HPダメージ  │   │ → HPダメージ  │
└───────────────┘   └───────────────┘
```

## 型定義

### StatusEffectType

```typescript
type StatusEffectType =
  | 'poison'      // 毒: 毎ターン最大HPの10%ダメージ
  | 'influenza'   // インフルエンザ: 毎ターン最大HPの5%ダメージ
  // 将来の拡張用:
  // | 'paralysis'   // 麻痺: 一定確率で行動不能
  // | 'sleep'       // 睡眠: 行動不能（ダメージで解除）
  // | 'blind'       // 暗闘: 命中率低下
  // | 'silence'     // 沈黙: スキル使用不可
  // | 'burn'        // 火傷: 毎ターンダメージ + 攻撃力低下
  // | 'freeze'      // 凍結: 行動不能（一定ターンで解除）
  ;
```

### StatusEffectTiming（効果発動タイミング）

```typescript
type StatusEffectTiming =
  | 'turn_start'   // ターン開始時
  | 'turn_end'     // ターン終了時
  | 'on_damage'    // ダメージを受けた時
  | 'on_action'    // 行動時
  ;
```

### StatusEffectResult（処理結果）

```typescript
interface StatusEffectResult {
  damage?: number;      // 受けたダメージ
  healed?: number;      // 回復量
  message: string;      // ログに表示するメッセージ
  prevented?: boolean;  // 行動が阻止されたか
  removed?: boolean;    // 状態異常が解除されたか
}
```

## 基底クラス: BaseStatusEffect

### プロパティ

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `type` | StatusEffectType | 状態異常の種類（抽象） |
| `name` | string | 表示名（抽象） |
| `shortName` | string | 短縮表示名（抽象） |
| `color` | string | UI表示用の色（抽象） |
| `remainingTurns` | number | 残りターン数（-1 = 永続） |

### メソッド

| メソッド | デフォルト動作 | 説明 |
|---------|---------------|------|
| `onTurnStart(target)` | `null` | ターン開始時の処理 |
| `onTurnEnd(target)` | `null` | ターン終了時の処理 |
| `onDamageReceived(target, damage)` | `null` | ダメージを受けた時の処理 |
| `onAction(target)` | `null` | 行動時の処理（阻止判定等） |
| `shouldRemove()` | `remainingTurns === 0` | 解除判定 |
| `tick()` | ターン数減少 | ターン経過処理 |

## 実装済み状態異常

### PoisonEffect（毒）

| 項目 | 値 |
|------|-----|
| type | `'poison'` |
| name | `'毒'` |
| shortName | `'PSN'` |
| color | `'#9b59b6'`（紫） |
| 効果 | 毎ターン終了時に最大HPの10%ダメージ |
| 持続 | 永続（-1）、治療アイテムで回復 |
| 治療 | 解毒剤 |

```typescript
onTurnEnd(target: PartyMember): StatusEffectResult | null {
  const damage = Math.max(1, Math.floor(target.maxHp * 0.1));
  target.takeDamageRaw(damage);  // 防御計算なしで直接ダメージ
  return {
    damage,
    message: `${target.name}は毒のダメージを${damage}受けた！`,
  };
}
```

### InfluenzaEffect（インフルエンザ）

| 項目 | 値 |
|------|-----|
| type | `'influenza'` |
| name | `'インフルエンザ'` |
| shortName | `'FLU'` |
| color | `'#e67e22'`（オレンジ） |
| 効果 | 毎ターン終了時に最大HPの5%ダメージ |
| 持続 | 永続（-1）、治療アイテムで回復 |
| 治療 | カロナール、タミフル |
| 特殊 | 家の外に出られない（NoInfluenzaCondition） |

## PartyMemberでの管理

```typescript
class PartyMember {
  private statusEffects: StatusEffect[] = [];

  // 防御計算なしでダメージを受ける（状態異常用）
  takeDamageRaw(amount: number): void;

  // 状態異常を追加
  addStatusEffect(type: StatusEffectType, duration?: number): boolean;

  // 状態異常を削除
  removeStatusEffect(type: StatusEffectType): boolean;

  // 全状態異常をクリア
  clearAllStatusEffects(): void;

  // 状態異常を持っているか
  hasStatusEffect(type: StatusEffectType): boolean;

  // 状態異常リストを取得
  getStatusEffects(): readonly StatusEffect[];

  // ターン終了時の状態異常処理（BattleEngineから呼ばれる）
  processStatusEffectsTurnEnd(): { message: string; damage?: number }[];
}
```

## StatusEffectFactory

```typescript
class StatusEffectFactory {
  // 状態異常を生成
  static create(type: StatusEffectType, duration?: number): StatusEffect;

  // シリアライズデータから復元
  static fromData(data: StatusEffectData): StatusEffect;

  // シリアライズ用データに変換
  static toData(effect: StatusEffect): StatusEffectData;
}
```

## 通過条件との連携

状態異常は扉やワープポイントの通過条件としても使用できます。

### PassCondition インターフェース

```typescript
interface PassCondition {
  readonly type: string;
  canPass(party: Party): boolean;
  getBlockedMessage(): string;
}
```

### NoInfluenzaCondition（使用例）

```typescript
class NoInfluenzaCondition implements PassCondition {
  readonly type = 'no_influenza';

  canPass(party: Party): boolean {
    return !party.getMembers().some(m => m.hasStatusEffect('influenza'));
  }

  getBlockedMessage(): string {
    return 'インフルエンザが治るまで外には出られない...';
  }
}
```

## 新しい状態異常の追加方法

### Step 1: StatusEffectType に追加

```typescript
// src/types/statusEffect.ts
export type StatusEffectType =
  | 'poison'
  | 'influenza'
  | 'paralysis'  // 新しい状態異常
  ;
```

### Step 2: 状態異常クラスを作成

```typescript
// src/models/statusEffects/ParalysisEffect.ts
import type { PartyMember } from '../PartyMember';
import type { StatusEffectResult, StatusEffectType } from '../../types/statusEffect';
import { BaseStatusEffect } from './BaseStatusEffect';

export class ParalysisEffect extends BaseStatusEffect {
  readonly type: StatusEffectType = 'paralysis';
  readonly name: string = '麻痺';
  readonly shortName: string = 'PAR';
  readonly color: string = '#f1c40f';  // 黄色

  private readonly preventChance: number;

  constructor(duration: number = 3, preventChance: number = 0.5) {
    super(duration);  // 3ターンで自然回復
    this.preventChance = preventChance;
  }

  /**
   * 行動時に一定確率で行動阻止
   */
  onAction(target: PartyMember): StatusEffectResult | null {
    if (Math.random() < this.preventChance) {
      return {
        prevented: true,
        message: `${target.name}は体がしびれて動けない！`,
      };
    }
    return null;
  }
}
```

### Step 3: エクスポートに追加

```typescript
// src/models/statusEffects/index.ts
export { ParalysisEffect } from './ParalysisEffect';
```

### Step 4: ファクトリーに登録

```typescript
// src/models/statusEffects/StatusEffectFactory.ts
import { ParalysisEffect } from './ParalysisEffect';

static create(type: StatusEffectType, duration?: number): StatusEffect {
  switch (type) {
    case 'poison':
      return new PoisonEffect(duration);
    case 'influenza':
      return new InfluenzaEffect(duration);
    case 'paralysis':  // 新しい分岐
      return new ParalysisEffect(duration);
    // ...
  }
}
```

### Step 5: 治療アイテムを追加（必要に応じて）

```typescript
// src/models/items/ItemFactory.ts の ITEM_DEFINITIONS に追加
{
  id: 'paralysis_heal',
  name: 'まひなおし',
  description: '麻痺を治す',
  type: 'cure',
  cureEffect: 'paralysis',
},
```

### Step 6: 敵が状態異常を付与する場合

```typescript
// src/engine/BattleEngine.ts の敵行動処理
// 既存の毒付与と同様のパターン
if (enemy.battleConfig.paralysisChance > 0 && Math.random() < enemy.battleConfig.paralysisChance) {
  targetMember.addStatusEffect('paralysis');
  this.addLog(`${targetMember.name}は麻痺した！`, 'damage');
}
```

## 状態異常の処理フロー

### 戦闘中

```
1. ターン開始
   └─ processStatusEffectsTurnStart() ※未実装

2. 行動選択・実行
   └─ onAction() で行動阻止判定

3. ターン終了
   └─ processStatusEffectsTurnEnd()
      ├─ 各状態異常の onTurnEnd() を実行
      ├─ tick() でターン数を減少
      └─ shouldRemove() で解除判定
```

### フィールド

```
扉/ワープポイントへ移動
└─ PassCondition.canPass(party)
   └─ party.getMembers().some(m => m.hasStatusEffect('xxx'))
      └─ true なら通過ブロック + メッセージ表示
```

## UI表示

### StatusEffectInfo（表示用データ）

```typescript
interface StatusEffectInfo {
  type: StatusEffectType;
  name: string;
  shortName: string;
  color: string;
  remainingTurns: number;
}
```

### バトル画面での表示

- パーティーメンバーカードに状態異常バッジを表示
- 色は各状態異常クラスの `color` プロパティを使用
- 短縮名（PSN, FLU等）をバッジ内に表示

### ポーズメニューでの表示

- 「つよさ」画面で状態異常一覧を表示
- 状態異常がない場合は「状態異常はありません」を表示

## セーブ/ロード対応

```typescript
// シリアライズ
const data = StatusEffectFactory.toData(effect);
// { type: 'poison', remainingTurns: 5 }

// デシリアライズ
const effect = StatusEffectFactory.fromData(data);
```

## 設計の利点

1. **開放閉鎖の原則**: 新しい状態異常を追加する際、既存コードの修正が最小限
2. **単一責任の原則**: 各状態異常クラスが自身の効果のみを担当
3. **ストラテジーパターン**: タイミングごとのコールバックで柔軟な効果を実装可能
4. **ファクトリーパターン**: 生成ロジックを集約し、セーブ/ロード対応が容易
5. **型安全性**: TypeScriptの網羅性チェックで追加漏れを防止

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/types/statusEffect.ts` | 型定義 |
| `src/models/statusEffects/*` | 状態異常クラス |
| `src/models/PartyMember.ts` | 状態異常の保持・管理 |
| `src/engine/BattleEngine.ts` | 戦闘中の状態異常処理 |
| `src/models/conditions/*` | 通過条件（状態異常連携） |
| `src/models/items/CureItem.ts` | 治療アイテム |
| `src/components/BattleModal.tsx` | 戦闘UI（バッジ表示） |
| `src/components/PauseMenu.tsx` | メニューUI（状態表示） |
