import { SkillDefinition } from '../types/game';

/**
 * 戦闘計算用の定数
 */
export const COMBAT_CONSTANTS = {
  /** 攻撃ダメージのランダム幅 */
  ATTACK_RANDOM_RANGE: 5,
  /** 敵の攻撃ダメージのランダム幅 */
  ENEMY_ATTACK_RANDOM_RANGE: 3,
  /** 最小ダメージ */
  MIN_DAMAGE: 1,
  /** クリティカル倍率 */
  CRITICAL_MULTIPLIER: 1.5,
  /** クリティカル確率 */
  CRITICAL_CHANCE: 0.1,
  /** 防御時のダメージ軽減率 */
  DEFEND_REDUCTION: 0.5,
} as const;

/**
 * 攻撃者のステータス
 */
export interface AttackerStats {
  attack: number;
  isPlayer?: boolean;  // プレイヤー側かどうか
}

/**
 * 防御者のステータス
 */
export interface DefenderStats {
  defense: number;
  isDefending?: boolean;
}

/**
 * ダメージ計算結果
 */
export interface DamageResult {
  damage: number;
  isCritical: boolean;
  originalDamage: number;  // 軽減前のダメージ
}

/**
 * 戦闘計算を一元管理するクラス
 */
export class CombatCalculator {
  /**
   * 通常攻撃ダメージを計算
   */
  static calculateAttackDamage(attacker: AttackerStats): number {
    const randomRange = attacker.isPlayer
      ? COMBAT_CONSTANTS.ATTACK_RANDOM_RANGE
      : COMBAT_CONSTANTS.ENEMY_ATTACK_RANDOM_RANGE;
    return attacker.attack + Math.floor(Math.random() * randomRange);
  }

  /**
   * スキル攻撃ダメージを計算
   */
  static calculateSkillDamage(attacker: AttackerStats, skill: SkillDefinition): number {
    const baseDamage = Math.floor(attacker.attack * skill.power);
    return baseDamage + Math.floor(Math.random() * COMBAT_CONSTANTS.ATTACK_RANDOM_RANGE);
  }

  /**
   * 防御を考慮したダメージを計算
   */
  static applyDefense(damage: number, defender: DefenderStats): DamageResult {
    // 防御力で軽減
    let reducedDamage = Math.max(COMBAT_CONSTANTS.MIN_DAMAGE, damage - defender.defense);

    // 防御状態なら半減
    if (defender.isDefending) {
      reducedDamage = Math.floor(reducedDamage * COMBAT_CONSTANTS.DEFEND_REDUCTION);
    }

    return {
      damage: reducedDamage,
      isCritical: false,
      originalDamage: damage,
    };
  }

  /**
   * 完全なダメージ計算（攻撃→防御適用）
   */
  static calculateDamage(
    attacker: AttackerStats,
    defender: DefenderStats,
    skill?: SkillDefinition
  ): DamageResult {
    const rawDamage = skill
      ? this.calculateSkillDamage(attacker, skill)
      : this.calculateAttackDamage(attacker);

    return this.applyDefense(rawDamage, defender);
  }

  /**
   * 回復量を計算（最大HP上限あり）
   */
  static calculateHeal(amount: number, currentHp: number, maxHp: number): number {
    return Math.min(maxHp - currentHp, amount);
  }

  /**
   * 状態異常によるダメージを計算（毒など）
   */
  static calculateStatusDamage(maxHp: number, percentage: number): number {
    return Math.max(1, Math.floor(maxHp * percentage));
  }
}
