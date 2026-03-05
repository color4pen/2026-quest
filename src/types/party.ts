import { SkillDefinition } from './battle';
import type { StatusEffectInfo } from './statusEffect';
import type { ItemType } from '../models/items';

// ==================== 装備システム ====================

// 装備スロットの種類
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

// スロット名の日本語表示
export const SLOT_NAMES: Record<EquipmentSlot, string> = {
  weapon: '武器',
  armor: '防具',
  accessory: '装飾品',
};

// 装備品のステータスボーナス
export interface EquipmentStats {
  attack?: number;
  defense?: number;
  maxHp?: number;
  maxMp?: number;
}

// 装備品情報（React用）
export interface EquipmentInfo {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  stats: EquipmentStats;
}

// 装備スロットの状態（React用）
export interface EquipmentSlotState {
  weapon: EquipmentInfo | null;
  armor: EquipmentInfo | null;
  accessory: EquipmentInfo | null;
}

// ==================== インベントリ ====================

// インベントリアイテム状態（React用）
export interface InventoryItemState {
  item: {
    id: string;
    name: string;
    description: string;
    type: ItemType;
    equipSlot?: EquipmentSlot;
  };
  quantity: number;
  canUseInMenu: boolean;
  canUseInBattle: boolean;
}

// パーティーメンバーのクラス（職業）
export type PartyMemberClass = 'engineer' | 'warrior' | 'mage' | 'healer';

// クラス名の日本語表示
export const CLASS_NAMES: Record<PartyMemberClass, string> = {
  engineer: 'エンジニア',
  warrior: '戦士',
  mage: '魔法使い',
  healer: '僧侶',
};

// パーティーメンバーの基本ステータス
export interface PartyMemberBaseStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
}

// パーティーメンバー定義（キャラクターテンプレート）
export interface PartyMemberDefinition {
  id: string;
  name: string;
  class: PartyMemberClass;
  image?: string;  // キャラクター画像パス
  baseStats: PartyMemberBaseStats;
  skills: SkillDefinition[];
  levelUpBonus?: {
    hp: number;
    mp: number;
    attack: number;
  };
}

// パーティーメンバーの状態（React用）
export interface PartyMemberState {
  id: string;
  name: string;
  class: PartyMemberClass;
  image?: string;  // キャラクター画像パス
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  xp: number;
  xpToNext: number;
  attack: number;
  defense: number;            // 防御力（装備込み）
  skills: SkillDefinition[];
  isAlive: boolean;
  isDefending: boolean;       // バトル中の防御状態
  isPoisoned: boolean;        // 毒状態（後方互換性用）
  statusEffects: StatusEffectInfo[];  // 全状態異常（拡張用）
  equipment: EquipmentSlotState;  // 装備状態
}

// パーティー全体の状態（React用）
export interface PartyState {
  members: PartyMemberState[];
  gold: number;
  inventory: InventoryItemState[];
}

// パーティー最大人数
export const MAX_PARTY_SIZE = 4;

// デフォルトのレベルアップボーナス
export const DEFAULT_LEVEL_UP_BONUS = {
  hp: 20,
  mp: 10,
  attack: 5,
  xpMultiplier: 1.5,
} as const;

// パーティーメンバーの復元用スナップショット
export interface PartyMemberSnapshot {
  hp: number;
  mp: number;
  level: number;
  xp: number;
  xpToNext: number;
  baseMaxHp: number;
  baseMaxMp: number;
  baseAttack: number;
  baseDefense: number;
}
