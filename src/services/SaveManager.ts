/**
 * セーブデータ管理サービス
 * localStorageを使用してゲームデータを永続化
 */

import {
  SaveData,
  SignedSaveData,
  SaveSlotInfo,
  SavedMemberData,
  SavedTreasureData,
  SAVE_VERSION,
  SAVE_SLOT_KEY_PREFIX,
  MAX_SAVE_SLOTS,
} from '../types/save';
import { sign, verify } from './integrity';
import { GameEngineState } from '../engine/GameEngine';
import { PartyMemberState } from '../types/party';
import { MAPS } from '../data/maps';
import { getPartyMemberTemplate } from '../data/partyMembers';

export class SaveManager {
  /**
   * 全セーブスロットの情報を取得（UI表示用）
   * 署名検証は行わない（改ざんされていても一覧には表示する）
   */
  static getSaveSlots(): SaveSlotInfo[] {
    const slots: SaveSlotInfo[] = [];

    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const key = `${SAVE_SLOT_KEY_PREFIX}${i}`;
      const rawData = localStorage.getItem(key);

      if (rawData) {
        try {
          const parsed = JSON.parse(rawData);
          // 新フォーマット（署名付き）か旧フォーマットかを判定
          const saveData: SaveData = this.isSignedFormat(parsed) ? parsed.payload : parsed;
          const leader = saveData.party.members[0];
          slots.push({
            slotId: i,
            isEmpty: false,
            timestamp: saveData.timestamp,
            mapName: this.getMapNameFromId(saveData.currentMapId),
            leaderName: leader ? (getPartyMemberTemplate(leader.definitionId)?.name ?? leader.definitionId) : null,
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
   * ゲームをセーブ（署名付き）
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
      // 署名付きフォーマットで保存
      const payloadJson = JSON.stringify(saveData);
      const signedData: SignedSaveData = {
        payload: saveData,
        signature: sign(payloadJson),
      };
      localStorage.setItem(key, JSON.stringify(signedData));
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    }
  }

  /**
   * セーブデータをロード（署名検証付き）
   * 改ざんが検出された場合はnullを返す
   */
  static load(slotId: number): SaveData | null {
    if (slotId < 0 || slotId >= MAX_SAVE_SLOTS) {
      console.error('Invalid load slot:', slotId);
      return null;
    }

    try {
      const key = `${SAVE_SLOT_KEY_PREFIX}${slotId}`;
      const rawData = localStorage.getItem(key);

      if (!rawData) return null;

      const parsed = JSON.parse(rawData);

      let saveData: SaveData;

      if (this.isSignedFormat(parsed)) {
        // 新フォーマット: 署名を検証
        const payloadJson = JSON.stringify(parsed.payload);
        if (!verify(payloadJson, parsed.signature)) {
          console.error('Save data integrity check failed: data may have been tampered with');
          return null;
        }
        saveData = parsed.payload;
      } else {
        // 旧フォーマット: 署名なし → マイグレーション（再署名して保存）
        saveData = parsed as SaveData;
        this.migrateToSignedFormat(slotId, saveData);
      }

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

  /**
   * 署名付きフォーマットかどうかを判定
   */
  private static isSignedFormat(data: unknown): data is SignedSaveData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'payload' in data &&
      'signature' in data &&
      typeof (data as SignedSaveData).signature === 'string'
    );
  }

  /**
   * 旧フォーマットのデータを署名付きフォーマットに移行
   */
  private static migrateToSignedFormat(slotId: number, saveData: SaveData): void {
    try {
      const key = `${SAVE_SLOT_KEY_PREFIX}${slotId}`;
      const payloadJson = JSON.stringify(saveData);
      const signedData: SignedSaveData = {
        payload: saveData,
        signature: sign(payloadJson),
      };
      localStorage.setItem(key, JSON.stringify(signedData));
      console.log(`Migrated save slot ${slotId} to signed format`);
    } catch (error) {
      console.error('Failed to migrate save data to signed format:', error);
    }
  }
}
