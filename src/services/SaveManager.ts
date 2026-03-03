/**
 * セーブデータ管理サービス
 * localStorageを使用してゲームデータを永続化
 */

import {
  SaveData,
  SaveSlotInfo,
  SavedMemberData,
  SavedTreasureData,
  SAVE_VERSION,
  SAVE_SLOT_KEY_PREFIX,
  MAX_SAVE_SLOTS,
} from '../types/save';
import { GameEngineState } from '../engine/GameEngine';
import { PartyMemberState } from '../types/party';
import { MAPS } from '../data/maps';

export class SaveManager {
  /**
   * 全セーブスロットの情報を取得（UI表示用）
   */
  static getSaveSlots(): SaveSlotInfo[] {
    const slots: SaveSlotInfo[] = [];

    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const key = `${SAVE_SLOT_KEY_PREFIX}${i}`;
      const data = localStorage.getItem(key);

      if (data) {
        try {
          const saveData: SaveData = JSON.parse(data);
          const leader = saveData.party.members[0];
          slots.push({
            slotId: i,
            isEmpty: false,
            timestamp: saveData.timestamp,
            mapName: this.getMapNameFromId(saveData.currentMapId),
            leaderName: leader?.definitionId ?? null,
            leaderLevel: leader?.level ?? null,
          });
        } catch {
          slots.push(this.createEmptySlotInfo(i));
        }
      } else {
        slots.push(this.createEmptySlotInfo(i));
      }
    }

    return slots;
  }

  /**
   * ゲームをセーブ
   */
  static save(
    slotId: number,
    state: GameEngineState,
    currentMapId: string,
    treasureStatesCache: Record<string, SavedTreasureData[]>,
    gameState: Record<string, number>
  ): boolean {
    if (slotId < 0 || slotId >= MAX_SAVE_SLOTS) {
      console.error('Invalid save slot:', slotId);
      return false;
    }

    try {
      const saveData = this.createSaveData(state, currentMapId, treasureStatesCache, gameState);
      const key = `${SAVE_SLOT_KEY_PREFIX}${slotId}`;
      localStorage.setItem(key, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    }
  }

  /**
   * セーブデータをロード
   */
  static load(slotId: number): SaveData | null {
    if (slotId < 0 || slotId >= MAX_SAVE_SLOTS) {
      console.error('Invalid load slot:', slotId);
      return null;
    }

    try {
      const key = `${SAVE_SLOT_KEY_PREFIX}${slotId}`;
      const data = localStorage.getItem(key);

      if (!data) return null;

      const saveData: SaveData = JSON.parse(data);

      // バージョン移行が必要な場合
      if (saveData.version !== SAVE_VERSION) {
        return this.migrateSaveData(saveData);
      }

      return saveData;
    } catch (error) {
      console.error('Load failed:', error);
      return null;
    }
  }

  /**
   * セーブスロットを削除
   */
  static deleteSave(slotId: number): boolean {
    if (slotId < 0 || slotId >= MAX_SAVE_SLOTS) {
      return false;
    }

    const key = `${SAVE_SLOT_KEY_PREFIX}${slotId}`;
    localStorage.removeItem(key);
    return true;
  }

  /**
   * スロットにデータがあるか確認
   */
  static hasData(slotId: number): boolean {
    const key = `${SAVE_SLOT_KEY_PREFIX}${slotId}`;
    return localStorage.getItem(key) !== null;
  }

  /**
   * いずれかのスロットにセーブデータがあるか確認
   */
  static hasSaveData(): boolean {
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      if (this.hasData(i)) {
        return true;
      }
    }
    return false;
  }

  // ==================== Private Helpers ====================

  private static createEmptySlotInfo(slotId: number): SaveSlotInfo {
    return {
      slotId,
      isEmpty: true,
      timestamp: null,
      mapName: null,
      leaderName: null,
      leaderLevel: null,
    };
  }

  private static createSaveData(
    state: GameEngineState,
    currentMapId: string,
    treasureStatesCache: Record<string, SavedTreasureData[]>,
    gameState: Record<string, number>
  ): SaveData {
    // 現在のマップの宝箱状態をキャッシュに追加
    const updatedTreasureStates = {
      ...treasureStatesCache,
      [currentMapId]: state.treasures.map(t => ({
        x: t.x,
        y: t.y,
        opened: t.opened,
      })),
    };

    return {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      currentMapId,
      playerPosition: { x: state.player.x, y: state.player.y },
      treasureStates: updatedTreasureStates,
      party: {
        members: state.party.members.map(m => this.serializeMember(m)),
        gold: state.party.gold,
        inventory: state.party.inventory.map(inv => ({
          itemId: inv.item.id,
          quantity: inv.quantity,
        })),
      },
      gameState,
    };
  }

  private static serializeMember(member: PartyMemberState): SavedMemberData {
    return {
      definitionId: member.id,
      hp: member.hp,
      mp: member.mp,
      level: member.level,
      xp: member.xp,
      xpToNext: member.xpToNext,
      baseMaxHp: member.maxHp,
      baseMaxMp: member.maxMp,
      baseAttack: member.attack,
      baseDefense: member.defense,
      statusEffects: member.statusEffects.map(e => ({
        type: e.type,
        remainingTurns: e.remainingTurns,
      })),
      equipment: {
        weapon: member.equipment.weapon?.id ?? null,
        armor: member.equipment.armor?.id ?? null,
        accessory: member.equipment.accessory?.id ?? null,
      },
    };
  }

  private static getMapNameFromId(mapId: string): string {
    const map = MAPS[mapId];
    return map?.name ?? mapId;
  }

  private static migrateSaveData(saveData: SaveData): SaveData {
    // 将来のバージョン移行処理をここに追加
    // 現時点ではバージョンを更新するのみ
    return { ...saveData, version: SAVE_VERSION };
  }
}
