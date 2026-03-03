/**
 * スキル定義
 * 全スキルを一元管理
 */

import { SkillDefinition } from '../types/battle';

// ==================== スキルID定数 ====================

export const SKILL_IDS = {
  // 物理攻撃スキル
  POWER_STRIKE: 'power_strike',
  WAR_CRY: 'war_cry',
  FLAME_SLASH: 'flame_slash',

  // 魔法攻撃スキル
  FIRE: 'fire',
  BLIZZARD: 'blizzard',
  THUNDER: 'thunder',
  HOLY: 'holy',

  // 回復スキル
  HEAL: 'heal',
  CURE: 'cure',
} as const;

export type SkillId = typeof SKILL_IDS[keyof typeof SKILL_IDS];

// ==================== 全スキル定義 ====================

export const ALL_SKILLS: Record<SkillId, SkillDefinition> = {
  // 物理攻撃スキル
  [SKILL_IDS.POWER_STRIKE]: {
    id: SKILL_IDS.POWER_STRIKE,
    name: '強打',
    description: '強力な一撃（1.5倍ダメージ）',
    mpCost: 5,
    power: 1.5,
    type: 'attack',
    target: 'enemy',
  },
  [SKILL_IDS.WAR_CRY]: {
    id: SKILL_IDS.WAR_CRY,
    name: '雄叫び',
    description: '気合の一撃（1.8倍ダメージ）',
    mpCost: 8,
    power: 1.8,
    type: 'attack',
    target: 'enemy',
  },
  [SKILL_IDS.FLAME_SLASH]: {
    id: SKILL_IDS.FLAME_SLASH,
    name: '炎斬り',
    description: '炎をまとった斬撃（2倍ダメージ）',
    mpCost: 12,
    power: 2.0,
    type: 'attack',
    target: 'enemy',
  },

  // 魔法攻撃スキル
  [SKILL_IDS.FIRE]: {
    id: SKILL_IDS.FIRE,
    name: 'ファイア',
    description: '炎の魔法（1.8倍ダメージ）',
    mpCost: 6,
    power: 1.8,
    type: 'attack',
    target: 'enemy',
  },
  [SKILL_IDS.BLIZZARD]: {
    id: SKILL_IDS.BLIZZARD,
    name: 'ブリザド',
    description: '氷の魔法（2.2倍ダメージ）',
    mpCost: 10,
    power: 2.2,
    type: 'attack',
    target: 'enemy',
  },
  [SKILL_IDS.THUNDER]: {
    id: SKILL_IDS.THUNDER,
    name: 'サンダー',
    description: '雷の魔法（2.5倍ダメージ）',
    mpCost: 15,
    power: 2.5,
    type: 'attack',
    target: 'enemy',
  },
  [SKILL_IDS.HOLY]: {
    id: SKILL_IDS.HOLY,
    name: 'ホーリー',
    description: '聖なる光（1.6倍ダメージ）',
    mpCost: 8,
    power: 1.6,
    type: 'attack',
    target: 'enemy',
  },

  // 回復スキル
  [SKILL_IDS.HEAL]: {
    id: SKILL_IDS.HEAL,
    name: 'ヒール',
    description: 'HPを30回復',
    mpCost: 5,
    power: 30,
    type: 'heal',
    target: 'self',
  },
  [SKILL_IDS.CURE]: {
    id: SKILL_IDS.CURE,
    name: 'キュア',
    description: 'HPを60回復',
    mpCost: 12,
    power: 60,
    type: 'heal',
    target: 'self',
  },
};

// ==================== クラス別スキルセット ====================

/** エンジニア（バランス型） */
export const ENGINEER_SKILLS: SkillDefinition[] = [
  ALL_SKILLS[SKILL_IDS.POWER_STRIKE],
  ALL_SKILLS[SKILL_IDS.HEAL],
  ALL_SKILLS[SKILL_IDS.FLAME_SLASH],
];

/** 戦士（物理攻撃特化） */
export const WARRIOR_SKILLS: SkillDefinition[] = [
  ALL_SKILLS[SKILL_IDS.POWER_STRIKE],
  ALL_SKILLS[SKILL_IDS.WAR_CRY],
];

/** 魔法使い（魔法攻撃特化） */
export const MAGE_SKILLS: SkillDefinition[] = [
  ALL_SKILLS[SKILL_IDS.FIRE],
  ALL_SKILLS[SKILL_IDS.BLIZZARD],
  ALL_SKILLS[SKILL_IDS.THUNDER],
];

/** 僧侶（回復特化） */
export const HEALER_SKILLS: SkillDefinition[] = [
  ALL_SKILLS[SKILL_IDS.HEAL],
  ALL_SKILLS[SKILL_IDS.CURE],
  ALL_SKILLS[SKILL_IDS.HOLY],
];

/**
 * スキルIDからスキル定義を取得
 */
export function getSkill(id: SkillId): SkillDefinition {
  return ALL_SKILLS[id];
}
