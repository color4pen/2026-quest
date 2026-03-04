/**
 * 装備品アイテムクラス
 * 武器・防具・装飾品を表現
 */

import { Item, ItemType, ItemUseContext, ItemUseResult } from './Item';
import type { EquipmentSlot, EquipmentStats } from '../../types/party';
import type { Action } from '../actions/Action';

/**
 * 装備品の追加オプション
 */
export interface EquipmentOptions {
  /** 装備時に付与される行動 */
  grantedActions?: Action[];
}

export class EquipmentItem extends Item {
  public readonly type: ItemType = 'equipment' as ItemType;
  public readonly slot: EquipmentSlot;
  public readonly stats: EquipmentStats;
  /** 装備時に付与される行動 */
  public readonly grantedActions: Action[];

  constructor(
    id: string,
    name: string,
    description: string,
    slot: EquipmentSlot,
    stats: EquipmentStats,
    options?: EquipmentOptions
  ) {
    super(id, name, description);
    this.slot = slot;
    this.stats = stats;
    this.grantedActions = options?.grantedActions ?? [];
  }

  /**
   * アイテムメニューからは使用不可（装備メニューから装備する）
   */
  canUseInMenu(): boolean {
    return false;
  }

  /**
   * 戦闘中は装備変更不可
   */
  canUseInBattle(): boolean {
    return false;
  }

  /**
   * 通常のアイテム使用フローでは使用不可
   * 装備はParty.equipItem()を使用する
   */
  canUse(_context: ItemUseContext): boolean {
    return false;
  }

  /**
   * 通常のアイテム使用では何もしない
   * 装備はParty.equipItem()経由で行う
   */
  use(_context: ItemUseContext): ItemUseResult {
    return {
      success: false,
      message: '装備品は「そうび」メニューから装備してください',
    };
  }

  /**
   * 使用不可の理由（装備品は基本的に常に使用可能）
   */
  getCannotUseReason(_context: ItemUseContext): string {
    return '';
  }

  /**
   * ステータスの説明文を生成
   */
  getStatsDescription(): string {
    const parts: string[] = [];
    if (this.stats.attack) parts.push(`攻撃+${this.stats.attack}`);
    if (this.stats.defense) parts.push(`防御+${this.stats.defense}`);
    if (this.stats.maxHp) parts.push(`HP+${this.stats.maxHp}`);
    if (this.stats.maxMp) parts.push(`MP+${this.stats.maxMp}`);
    return parts.join(' ');
  }

  /**
   * 装備情報を取得（シリアライズ用）
   */
  getEquipmentInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      slot: this.slot,
      stats: { ...this.stats },
    };
  }
}
