import { Item, ItemType, ItemUseContext, ItemUseResult } from './Item';

/**
 * 回復アイテム
 * HPを回復する
 */
export class HealItem extends Item {
  public readonly type: ItemType = 'heal';
  public readonly healAmount: number;

  constructor(id: string, name: string, description: string, healAmount: number) {
    super(id, name, description);
    this.healAmount = healAmount;
  }

  canUseInMenu(): boolean {
    return true;
  }

  canUseInBattle(): boolean {
    return true;
  }

  canUse(context: ItemUseContext): boolean {
    return context.targetHp < context.targetMaxHp;
  }

  use(context: ItemUseContext): ItemUseResult {
    if (!this.canUse(context)) {
      return {
        success: false,
        message: this.getCannotUseReason(context),
      };
    }

    const actualHeal = Math.min(this.healAmount, context.targetMaxHp - context.targetHp);
    return {
      success: true,
      message: `HPが${actualHeal}回復した！`,
      healedAmount: actualHeal,
    };
  }

  getCannotUseReason(context: ItemUseContext): string {
    if (context.targetHp >= context.targetMaxHp) {
      return 'HPは満タンです';
    }
    return '';
  }

  isTargetAlly(): boolean {
    return true;
  }
}
