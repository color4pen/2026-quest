import { EquipmentSlot, EquipmentSlotState } from '../../types/party';
import { EquipmentItem } from '../items/EquipmentItem';
import { EquipmentStatBlock } from '../values/EquipmentStatBlock';

/**
 * 装備スロット
 */
interface EquipmentSlots {
  weapon: EquipmentItem | null;
  armor: EquipmentItem | null;
  accessory: EquipmentItem | null;
}

/**
 * 装備管理
 */
export class EquipmentManager {
  private slots: EquipmentSlots = {
    weapon: null,
    armor: null,
    accessory: null,
  };

  /**
   * 装備品を装備する
   * @returns 以前装備していたアイテム（なければnull）
   */
  equip(item: EquipmentItem): EquipmentItem | null {
    const slot = item.slot;
    const previous = this.slots[slot];
    this.slots[slot] = item;
    return previous;
  }

  /**
   * 装備を外す
   * @returns 外した装備品（なければnull）
   */
  unequip(slot: EquipmentSlot): EquipmentItem | null {
    const item = this.slots[slot];
    this.slots[slot] = null;
    return item;
  }

  /**
   * 指定スロットの装備を取得
   */
  getAt(slot: EquipmentSlot): EquipmentItem | null {
    return this.slots[slot];
  }

  /**
   * 全装備を取得
   */
  getAll(): { weapon: EquipmentItem | null; armor: EquipmentItem | null; accessory: EquipmentItem | null } {
    return { ...this.slots };
  }

  /**
   * 全装備のステータスボーナスを合算
   */
  getBonuses(): EquipmentStatBlock {
    return EquipmentStatBlock.sum(
      this.slots.weapon ? EquipmentStatBlock.fromEquipmentStats(this.slots.weapon.stats) : null,
      this.slots.armor ? EquipmentStatBlock.fromEquipmentStats(this.slots.armor.stats) : null,
      this.slots.accessory ? EquipmentStatBlock.fromEquipmentStats(this.slots.accessory.stats) : null,
    );
  }

  /**
   * 装備状態を取得（React用）
   */
  getState(): EquipmentSlotState {
    return {
      weapon: this.slots.weapon?.getEquipmentInfo() ?? null,
      armor: this.slots.armor?.getEquipmentInfo() ?? null,
      accessory: this.slots.accessory?.getEquipmentInfo() ?? null,
    };
  }
}
