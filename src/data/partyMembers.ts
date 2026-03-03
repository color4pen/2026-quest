import { PartyMemberDefinition } from '../types/party';
import {
  ENGINEER_SKILLS,
  WARRIOR_SKILLS,
  MAGE_SKILLS,
  HEALER_SKILLS,
} from './skills';

// ==================== パーティーメンバー定義 ====================

/**
 * 初期メンバー（エンジニア）
 */
export const INITIAL_PARTY_MEMBER: PartyMemberDefinition = {
  id: 'engineer',
  name: 'せきくん',
  class: 'engineer',
  image: '/assets/images/characters/engineer.jpg',
  baseStats: {
    hp: 100,
    maxHp: 100,
    mp: 30,
    maxMp: 30,
    attack: 10,
  },
  skills: ENGINEER_SKILLS,
  levelUpBonus: {
    hp: 20,
    mp: 10,
    attack: 5,
  },
};

/**
 * 仲間にできるキャラクター一覧
 */
export const RECRUITABLE_MEMBERS: PartyMemberDefinition[] = [
  {
    id: 'warrior',
    name: 'ガルド',
    class: 'warrior',
    baseStats: {
      hp: 130,
      maxHp: 130,
      mp: 10,
      maxMp: 10,
      attack: 15,
    },
    skills: WARRIOR_SKILLS,
    levelUpBonus: {
      hp: 30,
      mp: 5,
      attack: 7,
    },
  },
  {
    id: 'mage',
    name: 'ミーナ',
    class: 'mage',
    baseStats: {
      hp: 60,
      maxHp: 60,
      mp: 50,
      maxMp: 50,
      attack: 5,
    },
    skills: MAGE_SKILLS,
    levelUpBonus: {
      hp: 10,
      mp: 15,
      attack: 3,
    },
  },
  {
    id: 'healer',
    name: 'リリア',
    class: 'healer',
    baseStats: {
      hp: 70,
      maxHp: 70,
      mp: 60,
      maxMp: 60,
      attack: 6,
    },
    skills: HEALER_SKILLS,
    levelUpBonus: {
      hp: 15,
      mp: 12,
      attack: 3,
    },
  },
];

/**
 * 全パーティーメンバー定義を取得
 */
export function getAllPartyMemberDefinitions(): PartyMemberDefinition[] {
  return [INITIAL_PARTY_MEMBER, ...RECRUITABLE_MEMBERS];
}

/**
 * IDでメンバー定義を取得
 */
export function getPartyMemberDefinition(id: string): PartyMemberDefinition | null {
  return getAllPartyMemberDefinitions().find(m => m.id === id) ?? null;
}
