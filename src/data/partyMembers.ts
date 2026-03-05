import { PartyMemberTemplate } from '../types/party';
import {
  ENGINEER_SKILLS,
  WARRIOR_SKILLS,
  MAGE_SKILLS,
  HEALER_SKILLS,
} from './skills';

// ==================== パーティーメンバーテンプレート ====================

/**
 * 初期メンバー（エンジニア）
 */
export const INITIAL_PARTY_MEMBER: PartyMemberTemplate = {
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
export const RECRUITABLE_MEMBERS: PartyMemberTemplate[] = [
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
 * 全パーティーメンバーテンプレートを取得
 */
export function getAllPartyMemberTemplates(): PartyMemberTemplate[] {
  return [INITIAL_PARTY_MEMBER, ...RECRUITABLE_MEMBERS];
}

/**
 * IDでメンバーテンプレートを取得
 */
export function getPartyMemberTemplate(id: string): PartyMemberTemplate | null {
  return getAllPartyMemberTemplates().find(m => m.id === id) ?? null;
}
