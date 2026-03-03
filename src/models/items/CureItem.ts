import { Item, ItemType, ItemUseContext, ItemUseResult } from './Item';
import { StatusEffectType } from '../../types/statusEffect';

/**
 * 状態異常の表示名
 */
const STATUS_EFFECT_NAMES: Record<string, string> = {
  poison: '毒',
  influenza: 'インフルエンザ',
};

/**
 * 治療アイテム
 * 状態異常を治す
 */
export class CureItem extends Item {
  public readonly type: ItemType = 'cure';
  public readonly cureEffect: StatusEffectType;

  constructor(
    id: string,
    name: string,
    description: string,
    cureEffect: StatusEffectType
  ) {
    super(id, name, description);
    this.cureEffect = cureEffect;
  }

  canUseInMenu(): boolean {
    return true;
  }

  canUseInBattle(): boolean {
    return true;
  }

  canUse(context: ItemUseContext): boolean {
    return context.targetStatusEffects.includes(this.cureEffect);
  }

  use(context: ItemUseContext): ItemUseResult {
    if (!this.canUse(context)) {
      return {
        success: false,
        message: this.getCannotUseReason(context),
      };
    }

    const effectName = STATUS_EFFECT_NAMES[this.cureEffect] || this.cureEffect;
    return {
      success: true,
      message: `${effectName}が治った！`,
      curedEffect: this.cureEffect,
    };
  }

  getCannotUseReason(context: ItemUseContext): string {
    const effectName = STATUS_EFFECT_NAMES[this.cureEffect] || this.cureEffect;
    if (!context.targetStatusEffects.includes(this.cureEffect)) {
      return `${effectName}ではありません`;
    }
    return '';
  }

  isTargetAlly(): boolean {
    return true;
  }
}
