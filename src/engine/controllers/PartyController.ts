import { MessageType } from '../../types/game';
import { PartyMemberDefinition } from '../../types/party';
import { Party } from '../../models';

export interface PartyCallbacks {
  addMessage: (text: string, type: MessageType) => void;
  notifyListeners: () => void;
}

export interface OperationResult {
  success: boolean;
  message: string;
}

/**
 * パーティー管理（メンバー追加・装備・アイテム使用）を制御
 */
export class PartyController {
  constructor(
    private party: Party,
    private callbacks: PartyCallbacks
  ) {}

  /**
   * 仲間を追加
   */
  public recruitMember(definition: PartyMemberDefinition): boolean {
    if (this.party.isFull()) {
      this.callbacks.addMessage('パーティーは満員だ！', 'normal');
      this.callbacks.notifyListeners();
      return false;
    }

    const success = this.party.addMember(definition);
    if (success) {
      this.callbacks.addMessage(`${definition.name}が仲間になった！`, 'loot');
      this.callbacks.notifyListeners();
    }
    return success;
  }

  /**
   * フィールドでアイテムを使用
   */
  public useFieldItem(itemId: string, targetMemberId?: string): OperationResult {
    const target = targetMemberId
      ? this.party.getMemberById(targetMemberId)
      : this.party.getLeader();

    if (!target) {
      return { success: false, message: '対象が見つかりません' };
    }

    if (!target.isAlive()) {
      return { success: false, message: `${target.name}は戦闘不能です` };
    }

    const result = this.party.useItemOnMember(itemId, target, false);

    if (result.success) {
      this.callbacks.notifyListeners();
    }

    return result;
  }

  /**
   * 装備品を装備する
   */
  public equipItem(memberId: string, itemId: string): OperationResult {
    const result = this.party.equipItem(memberId, itemId);
    if (result.success) {
      this.callbacks.notifyListeners();
    }
    return result;
  }

  /**
   * 装備を外す
   */
  public unequipItem(
    memberId: string,
    slot: 'weapon' | 'armor' | 'accessory'
  ): OperationResult {
    const result = this.party.unequipItem(memberId, slot);
    if (result.success) {
      this.callbacks.notifyListeners();
    }
    return result;
  }

  /**
   * パーティーを取得
   */
  public getParty(): Party {
    return this.party;
  }
}
