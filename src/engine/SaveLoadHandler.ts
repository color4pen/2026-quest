/**
 * セーブ/ロード処理ハンドラ
 * SaveManager（永続化）とGameEngine（状態管理）の中間層
 */

import { SaveData, SaveSlotInfo, SavedMemberData, SavedTreasureData } from '../types/save';
import { SaveManager } from '../services/SaveManager';
import { GameEngineState } from './GameEngine';
import { getPartyMemberTemplate } from '../data/partyMembers';
import { StatusEffectType } from '../types/statusEffect';

/**
 * セーブ時に必要なコンテキスト
 */
export interface SaveContext {
  state: GameEngineState;
  currentMapId: string;
  treasureStatesCache: Record<string, SavedTreasureData[]>;
  gameState: Record<string, number>;
}

/**
 * メンバー復元データ（GameEngineが適用する形式）
 */
export interface MemberRestoreData {
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
  statusEffects: Array<{ type: StatusEffectType; remainingTurns: number }>;
  equipment: {
    weapon: string | null;
    armor: string | null;
    accessory: string | null;
  };
}

/**
 * ロード結果
 */
export interface RestoreResult {
  success: boolean;
  error?: string;
  data?: {
    treasureStatesCache: Record<string, SavedTreasureData[]>;
    gameState: Record<string, number>;
    mapId: string;
    playerPosition: { x: number; y: number };
    members: MemberRestoreData[];
    gold: number;
    inventory: Array<{ itemId: string; quantity: number }>;
  };
}

/**
 * セーブデータ検証結果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * セーブデータを検証（純粋関数）
 */
export function validateSaveData(data: SaveData): ValidationResult {
  const errors: string[] = [];

  // 必須フィールドのチェック
  if (!data.currentMapId) {
    errors.push('currentMapId is missing');
  }

  if (!data.playerPosition || typeof data.playerPosition.x !== 'number' || typeof data.playerPosition.y !== 'number') {
    errors.push('playerPosition is invalid');
  }

  if (!data.party) {
    errors.push('party data is missing');
  } else {
    if (!Array.isArray(data.party.members)) {
      errors.push('party.members is not an array');
    } else if (data.party.members.length === 0) {
      errors.push('party.members is empty');
    }

    if (typeof data.party.gold !== 'number' || data.party.gold < 0) {
      errors.push('party.gold is invalid');
    }

    if (!Array.isArray(data.party.inventory)) {
      errors.push('party.inventory is not an array');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * メンバーデータを復元用に変換（純粋関数）
 * 定義が見つからない場合はnullを返す
 */
export function createMemberRestoreData(memberData: SavedMemberData): MemberRestoreData | null {
  const definition = getPartyMemberTemplate(memberData.definitionId);
  if (!definition) {
    return null;
  }

  return {
    definitionId: memberData.definitionId,
    hp: memberData.hp,
    mp: memberData.mp,
    level: memberData.level,
    xp: memberData.xp,
    xpToNext: memberData.xpToNext,
    baseMaxHp: memberData.baseMaxHp,
    baseMaxMp: memberData.baseMaxMp,
    baseAttack: memberData.baseAttack,
    baseDefense: memberData.baseDefense,
    statusEffects: memberData.statusEffects.map(e => ({
      type: e.type,
      remainingTurns: e.remainingTurns,
    })),
    equipment: {
      weapon: memberData.equipment.weapon,
      armor: memberData.equipment.armor,
      accessory: memberData.equipment.accessory,
    },
  };
}

/**
 * セーブ/ロード処理ハンドラ
 */
export class SaveLoadHandler {
  /**
   * 全セーブスロット情報を取得
   */
  getSaveSlots(): SaveSlotInfo[] {
    return SaveManager.getSaveSlots();
  }

  /**
   * ゲームをセーブ
   */
  save(slotId: number, context: SaveContext): boolean {
    return SaveManager.save(
      slotId,
      context.state,
      context.currentMapId,
      context.treasureStatesCache,
      context.gameState
    );
  }

  /**
   * ゲームをロードし、復元用データを返す
   */
  load(slotId: number): RestoreResult {
    const saveData = SaveManager.load(slotId);

    if (!saveData) {
      return {
        success: false,
        error: 'Save data not found or corrupted',
      };
    }

    // 検証
    const validation = validateSaveData(saveData);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid save data: ${validation.errors.join(', ')}`,
      };
    }

    // メンバー復元データを生成
    const members: MemberRestoreData[] = [];
    for (const memberData of saveData.party.members) {
      const restoreData = createMemberRestoreData(memberData);
      if (!restoreData) {
        console.warn(`Member definition not found: ${memberData.definitionId}`);
        continue;
      }
      members.push(restoreData);
    }

    if (members.length === 0) {
      return {
        success: false,
        error: 'No valid party members found',
      };
    }

    return {
      success: true,
      data: {
        treasureStatesCache: saveData.treasureStates,
        gameState: saveData.gameState ?? {},
        mapId: saveData.currentMapId,
        playerPosition: saveData.playerPosition,
        members,
        gold: saveData.party.gold,
        inventory: saveData.party.inventory,
      },
    };
  }
}
