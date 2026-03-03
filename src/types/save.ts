/**
 * セーブデータ関連の型定義
 */

import { StatusEffectType } from './statusEffect';

// セーブシステムのバージョン（将来の互換性用）
export const SAVE_VERSION = 1;

// 最大セーブスロット数
export const MAX_SAVE_SLOTS = 5;

// localStorageのキー接頭辞
export const SAVE_SLOT_KEY_PREFIX = 'rpg_save_slot_';

/**
 * セーブスロット情報（UI表示用）
 */
export interface SaveSlotInfo {
  slotId: number;
  isEmpty: boolean;
  timestamp: number | null;
  mapName: string | null;
  leaderName: string | null;
  leaderLevel: number | null;
}

/**
 * セーブされたステータス効果データ
 */
export interface SavedStatusEffectData {
  type: StatusEffectType;
  remainingTurns: number;
}

/**
 * セーブされた装備データ
 */
export interface SavedEquipmentData {
  weapon: string | null;    // アイテムID
  armor: string | null;
  accessory: string | null;
}

/**
 * セーブされたパーティメンバーデータ
 */
export interface SavedMemberData {
  definitionId: string;
  hp: number;
  mp: number;
  level: number;
  xp: number;
  xpToNext: number;
  baseMaxHp: number;
  baseMaxMp: number;
  baseAttack: number;
  baseDefense: number;
  statusEffects: SavedStatusEffectData[];
  equipment: SavedEquipmentData;
}

/**
 * セーブされたインベントリアイテム
 */
export interface SavedInventoryItem {
  itemId: string;
  quantity: number;
}

/**
 * セーブされた宝箱状態
 */
export interface SavedTreasureData {
  x: number;
  y: number;
  opened: boolean;
}

/**
 * セーブデータ本体
 */
export interface SaveData {
  version: number;
  timestamp: number;
  currentMapId: string;
  playerPosition: { x: number; y: number };
  treasureStates: Record<string, SavedTreasureData[]>;
  party: {
    members: SavedMemberData[];
    gold: number;
    inventory: SavedInventoryItem[];
  };
  /** ゲーム状態（フラグ・進行度） */
  gameState: Record<string, number>;
}
