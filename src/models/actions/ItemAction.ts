import type { Action, ActionContext, ActionResult, ActionTargetType } from './Action';
import type { Item } from '../items/Item';
import type { HealItem } from '../items/HealItem';
import type { DamageItem } from '../items/DamageItem';
import type { CureItem } from '../items/CureItem';
import type { StatusEffectType } from '../../types/statusEffect';

/**
 * アイテム使用アクション
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
      return 'self'; // 回復アイテムは自分対象（パーティターゲット選択は別途処理）
    }
    return 'none';
  }

  canExecute(context: ActionContext): boolean {
    return context.performer.isAlive() && this.item.canUseInBattle();
  }

  execute(
    target: {
      takeDamage?(amount: number): number;
      heal?(amount: number): number;
      isDead?(): boolean;
      name: string;
      hp?: number;
      maxHp?: number;
      hasStatusEffect?(type: StatusEffectType): boolean;
      removeStatusEffect?(type: StatusEffectType): boolean;
      getStatusEffects?(): readonly { type: string }[];
    } | null,
    context: ActionContext,
    itemConsumer?: { consumeItem(itemId: string): Item | null }
  ): ActionResult {
    // アイテム消費
    if (itemConsumer) {
      const consumed = itemConsumer.consumeItem(this.item.id);
      if (!consumed) {
        return {
          success: false,
          logs: [{ text: 'アイテムがない！', type: 'system' as const }],
        };
      }
    }

    const logs = [
      { text: `${context.performer.name}は${this.item.name}を使った！`, type: 'player' as const },
    ];

    // アイテムタイプに応じて処理
    switch (this.item.type) {
      case 'heal':
        return this.executeHealItem(target, context, logs);
      case 'damage':
        return this.executeDamageItem(target, context, logs);
      case 'cure':
        return this.executeCureItem(target, context, logs);
      default:
        return {
          success: false,
          logs: [{ text: 'このアイテムは使用できない！', type: 'system' as const }],
        };
    }
  }

  private executeHealItem(
    target: { heal?(amount: number): number; name: string } | null,
    context: ActionContext,
    logs: Array<{ text: string; type: 'player' | 'system' | 'heal' | 'damage' | 'enemy' }>
  ): ActionResult {
    const healItem = this.item as HealItem;
    const targetName = target?.name ?? context.performer.name;

    const healed = target?.heal?.(healItem.healAmount) ?? 0;
    logs.push({ text: `${targetName}のHPが ${healed} 回復した！`, type: 'heal' as const });

    return { success: true, logs };
  }

  private executeDamageItem(
    target: { takeDamage?(amount: number): number; isDead?(): boolean; name: string } | null,
    _context: ActionContext,
    logs: Array<{ text: string; type: 'player' | 'system' | 'heal' | 'damage' | 'enemy' }>
  ): ActionResult {
    if (!target || !target.takeDamage) {
      return {
        success: false,
        logs: [{ text: 'ターゲットがいない！', type: 'system' as const }],
      };
    }

    const damageItem = this.item as DamageItem;
    const damage = target.takeDamage(damageItem.damage);

    logs.push({ text: `${target.name}に ${damage} のダメージ！`, type: 'damage' as const });

    if (target.isDead?.()) {
      logs.push({ text: `${target.name}を倒した！`, type: 'system' as const });
    }

    return { success: true, logs };
  }

  private executeCureItem(
    target: {
      name: string;
      hasStatusEffect?(type: StatusEffectType): boolean;
      removeStatusEffect?(type: StatusEffectType): boolean;
    } | null,
    context: ActionContext,
    logs: Array<{ text: string; type: 'player' | 'system' | 'heal' | 'damage' | 'enemy' }>
  ): ActionResult {
    const cureItem = this.item as CureItem;
    const targetName = target?.name ?? context.performer.name;

    if (target?.hasStatusEffect?.(cureItem.cureEffect)) {
      target.removeStatusEffect?.(cureItem.cureEffect);
      const effectNames: Record<string, string> = {
        poison: '毒',
        influenza: 'インフルエンザ',
      };
      const effectName = effectNames[cureItem.cureEffect] || cureItem.cureEffect;
      logs.push({ text: `${targetName}の${effectName}が治った！`, type: 'heal' as const });
    } else {
      logs.push({ text: 'しかし効果がなかった...', type: 'system' as const });
    }

    return { success: true, logs };
  }
}
