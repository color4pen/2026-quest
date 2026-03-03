# 戦闘計算システム設計ドキュメント

## 概要

戦闘計算を一元管理する純粋な静的クラス。モデルへの依存がなく、ステータス数値を受け取ってダメージ・回復量を返す。BattleEngine や PartyMember から利用される。

## 定数

```typescript
const COMBAT_CONSTANTS = {
  ATTACK_RANDOM_RANGE: 5,       // プレイヤー攻撃のランダム幅
  ENEMY_ATTACK_RANDOM_RANGE: 3, // 敵攻撃のランダム幅
  MIN_DAMAGE: 1,                // 最小ダメージ
  CRITICAL_MULTIPLIER: 1.5,     // クリティカル倍率（将来用）
  CRITICAL_CHANCE: 0.1,         // クリティカル確率（将来用）
  DEFEND_REDUCTION: 0.5,        // 防御時のダメージ軽減率
} as const;
```

## インターフェース

```typescript
interface AttackerStats {
  attack: number;
  isPlayer?: boolean;  // プレイヤー側かどうか（ランダム幅が異なる）
}

interface DefenderStats {
  defense: number;
  isDefending?: boolean;  // 防御コマンド使用中
}

interface DamageResult {
  damage: number;
  isCritical: boolean;
  originalDamage: number;  // 軽減前のダメージ
}
```

## 計算メソッド

### 通常攻撃ダメージ

```typescript
static calculateAttackDamage(attacker: AttackerStats): number {
  const randomRange = attacker.isPlayer
    ? COMBAT_CONSTANTS.ATTACK_RANDOM_RANGE      // 0〜4
    : COMBAT_CONSTANTS.ENEMY_ATTACK_RANDOM_RANGE; // 0〜2
  return attacker.attack + Math.floor(Math.random() * randomRange);
}
```

計算式: `攻撃力 + random(0〜range-1)`

### スキル攻撃ダメージ

```typescript
static calculateSkillDamage(attacker: AttackerStats, skill: SkillDefinition): number {
  const baseDamage = Math.floor(attacker.attack * skill.power);
  return baseDamage + Math.floor(Math.random() * COMBAT_CONSTANTS.ATTACK_RANDOM_RANGE);
}
```

計算式: `floor(攻撃力 × スキル倍率) + random(0〜4)`

### 防御適用

```typescript
static applyDefense(damage: number, defender: DefenderStats): DamageResult {
  let reducedDamage = Math.max(COMBAT_CONSTANTS.MIN_DAMAGE, damage - defender.defense);
  if (defender.isDefending) {
    reducedDamage = Math.floor(reducedDamage * COMBAT_CONSTANTS.DEFEND_REDUCTION);
  }
  return { damage: reducedDamage, isCritical: false, originalDamage: damage };
}
```

計算式: `max(1, ダメージ - 防御力)` → 防御中なら `× 0.5`

### 完全ダメージ計算

```typescript
static calculateDamage(
  attacker: AttackerStats,
  defender: DefenderStats,
  skill?: SkillDefinition
): DamageResult;
```

攻撃ダメージ計算 → 防御適用 をまとめて実行。

### 回復量計算

```typescript
static calculateHeal(amount: number, currentHp: number, maxHp: number): number {
  return Math.min(maxHp - currentHp, amount);
}
```

計算式: `min(最大HP - 現在HP, 回復量)`

### 状態異常ダメージ

```typescript
static calculateStatusDamage(maxHp: number, percentage: number): number {
  return Math.max(1, Math.floor(maxHp * percentage));
}
```

計算式: `max(1, floor(最大HP × 割合))`

例: 毒 = maxHp × 0.1、インフルエンザ = maxHp × 0.05

## 呼び出し元

| 呼び出し元 | メソッド | 用途 |
|-----------|---------|------|
| `PartyMember.calculateAttackDamage()` | `calculateAttackDamage` | 通常攻撃 |
| `PartyMember.calculateSkillDamage()` | `calculateSkillDamage` | スキル攻撃 |
| `PartyMember.takeDamage()` | `applyDefense` | 被ダメージ計算 |
| `PoisonEffect.onTurnEnd()` | `calculateStatusDamage` | 毒ダメージ |
| `InfluenzaEffect.onTurnEnd()` | `calculateStatusDamage` | インフルエンザダメージ |

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/engine/CombatCalculator.ts` | 戦闘計算クラス |
| `src/models/PartyMember.ts` | 攻撃・被ダメージで利用 |
| `src/models/statusEffects/PoisonEffect.ts` | 毒ダメージで利用 |
| `src/models/statusEffects/InfluenzaEffect.ts` | インフルエンザダメージで利用 |
| `src/engine/BattleEngine.ts` | 敵の攻撃計算で利用 |
