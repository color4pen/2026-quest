import type { Action, ActionContext, ActionResult, ActionTargetType } from './Action';
import type { Combatant } from '../Combatant';
import type { Item } from '../items/Item';
import type { HealItem } from '../items/HealItem';
import type { DamageItem } from '../items/DamageItem';
import type { CureItem } from '../items/CureItem';
import type { StatusEffectType } from '../../types/statusEffect';

/**
 * 状態異常を持つ Combatant の拡張インターフェース
 */
interface CombatantWithStatus extends Combatant {
  hasStatusEffect?(type: StatusEffectType): boolean;
  removeStatusEffect?(type: StatusEffectType): boolean;
}

/**
 * アイテム使用アクション
 * 注意: アイテムの消費は BattleEngine 側で行う
 */
export class ItemAction implements Action {
  readonly id: string;
  readonly name: string;
  readonly type = 'item' as const;
  readonly item: Item;

  constructor(item: Item) {
    this.item = item;
    this.id = `item_${item.id}`;
    this.name = item.name;
  }

  getTargetType(): ActionTargetType {
    if (this.item.isTargetEnemy()) {
      return 'single_enemy';
    }
    if (this.item.isTargetAlly()) {
      return 'self';
    }
    return 'none';
  }

  canExecute(context: ActionContext): boolean {
    return context.performer.isAlive() && this.item.canUseInBattle();
  }

  execute(
    target: Combatant | null,
    context: ActionContext
  ): ActionResult {
    const logs: ActionResult['logs'] = [
      { text: `${context.performer.name}は${this.item.name}を使った！`, type: 'player' },
    ];

    // アイテムタイプに応じて処理
    switch (this.item.type) {
      case 'heal':
        return this.executeHealItem(target, context, logs);
      case 'damage':
        return this.executeDamageItem(target, logs);
      case 'cure':
        return this.executeCureItem(target as CombatantWithStatus, context, logs);
      default:
        return {
          success: false,
          logs: [{ text: 'このアイテムは使用できない！', type: 'system' }],
        };
    }
  }

  private executeHealItem(
    target: Combatant | null,
    context: ActionContext,
    logs: ActionResult['logs']
  ): ActionResult {
    const healItem = this.item as HealItem;
    const healTarget = target ?? context.performer;

    const healed = healTarget.heal(healItem.healAmount);
    logs.push({ text: `${healTarget.name}のHPが ${healed} 回復した！`, type: 'heal' });

    return { success: true, logs };
  }

  private executeDamageItem(
    target: Combatant | null,
    logs: ActionResult['logs']
  ): ActionResult {
    if (!target) {
      return {
        success: false,
        logs: [{ text: 'ターゲットがいない！', type: 'system' }],
      };
    }

    const damageItem = this.item as DamageItem;
    const damage = target.takeDamage(damageItem.damage);

    logs.push({ text: `${target.name}に ${damage} のダメージ！`, type: 'damage' });

    if (target.isDead()) {
      logs.push({ text: `${target.name}を倒した！`, type: 'system' });
    }

    return { success: true, logs };
  }

  private executeCureItem(
    target: CombatantWithStatus | null,
    context: ActionContext,
    logs: ActionResult['logs']
  ): ActionResult {
    const cureItem = this.item as CureItem;
    const cureTarget = (target ?? context.performer) as CombatantWithStatus;

    if (cureTarget.hasStatusEffect?.(cureItem.cureEffect)) {
      cureTarget.removeStatusEffect?.(cureItem.cureEffect);
      const effectNames: Record<string, string> = {
        poison: '毒',
        influenza: 'インフルエンザ',
      };
      const effectName = effectNames[cureItem.cureEffect] || cureItem.cureEffect;
      logs.push({ text: `${cureTarget.name}の${effectName}が治った！`, type: 'heal' });
    } else {
      logs.push({ text: 'しかし効果がなかった...', type: 'system' });
    }

    return { success: true, logs };
  }
}
