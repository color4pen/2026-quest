import type { Action } from './actions/Action';

/**
 * 戦闘参加者インターフェース
 * PartyMember と Enemy が実装する
 */
export interface Combatant {
  readonly id: string;
  readonly name: string;

  // ステータス
  readonly hp: number;
  readonly maxHp: number;
  readonly attack: number;
  readonly defense: number;
  readonly isDefending: boolean;

  // ダメージ/回復
  takeDamage(amount: number): number;
  takeDamageRaw(amount: number): void;
  heal(amount: number): number;

  // 状態
  isAlive(): boolean;
  isDead(): boolean;

  // 行動取得（Rich Domain Model の核心）
  getAvailableActions(): Action[];
}

/**
 * プレイヤー側の戦闘参加者を判別するための型ガード用
 */
export interface PlayerCombatant extends Combatant {
  readonly mp: number;
  readonly maxMp: number;
  useMp(amount: number): boolean;
  canUseSkill(skill: { mpCost: number }): boolean;
}

/**
 * Combatant が PlayerCombatant かどうかを判定
 */
export function isPlayerCombatant(combatant: Combatant): combatant is PlayerCombatant {
  return 'mp' in combatant && 'useMp' in combatant;
}
