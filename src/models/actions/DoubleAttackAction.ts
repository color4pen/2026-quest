import type { Action, ActionContext, ActionResult, ActionTargetType } from './Action';
import type { Combatant } from '../Combatant';
import { CombatCalculator } from '../../engine/CombatCalculator';

/**
 * 2回攻撃アクション
 * 装備効果で付与される特殊攻撃
 */
export class DoubleAttackAction implements Action {
  readonly id = 'double_attack';
  readonly name = '連続攻撃';
  readonly type = 'attack' as const;

  getTargetType(): ActionTargetType {
    return 'single_enemy';
  }

  canExecute(context: ActionContext): boolean {
    return context.performer.isAlive();
  }

  execute(
    target: Combatant | null,
    context: ActionContext
  ): ActionResult {
    if (!target) {
      return {
        success: false,
        logs: [{ text: 'ターゲットがいない！', type: 'system' }],
      };
    }

    const logs: ActionResult['logs'] = [
      { text: `${context.performer.name}の連続攻撃！`, type: 'player' },
    ];

    let totalDamage = 0;

    // 2回攻撃
    for (let i = 0; i < 2; i++) {
      if (target.isDead()) {
        break;
      }

      const damage = CombatCalculator.calculateAttackDamage({
        attack: context.performer.attack,
        isPlayer: true,
      });

      const actualDamage = target.takeDamage(damage);
      totalDamage += actualDamage;

      logs.push({ text: `${target.name}に ${actualDamage} のダメージ！`, type: 'damage' });

      if (target.isDead()) {
        logs.push({ text: `${target.name}を倒した！`, type: 'system' });
      }
    }

    return {
      success: true,
      logs,
    };
  }
}
