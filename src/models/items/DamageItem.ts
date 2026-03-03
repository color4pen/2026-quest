import { Item, ItemType, ItemUseContext, ItemUseResult } from './Item';

/**
 * ダメージアイテム
 * 敵にダメージを与える
 */
export class DamageItem extends Item {
  public readonly type: ItemType = 'damage';
  public readonly damage: number;

  constructor(id: string, name: string, description: string, damage: number) {
    super(id, name, description);
    this.damage = damage;
  }

  canUseInMenu(): boolean {
    return false;  // 戦闘外では使用不可
  }

  canUseInBattle(): boolean {
    return true;
  }

  canUse(context: ItemUseContext): boolean {
    return context.isInBattle;
  }

  use(_context: ItemUseContext): ItemUseResult {
    return {
      success: true,
      message: `${this.damage}のダメージを与えた！`,
      damageDealt: this.damage,
    };
  }

  getCannotUseReason(context: ItemUseContext): string {
    if (!context.isInBattle) {
      return 'このアイテムは戦闘中のみ使用できます';
    }
    return '';
  }

  isTargetEnemy(): boolean {
    return true;
  }
}
