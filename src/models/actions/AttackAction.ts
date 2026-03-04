import type { Action, ActionContext, ActionResult, ActionTargetType } from './Action';
import { CombatCalculator } from '../../engine/CombatCalculator';

/**
 * 通常攻撃アクション
 */
export class AttackAction implements Action {
  readonly id = 'attack';
  readonly name = '攻撃';
  readonly type = 'attack' as const;

  getTargetType(): ActionTargetType {
    return 'single_enemy';
  }

  canExecute(context: ActionContext): boolean {
    return context.performer.isAlive();
  }

  execute(
    target: { takeDamage(amount: number): number; isDead(): boolean; name: string } | null,
    context: ActionContext
  ): ActionResult {
    if (!target) {
      return {
        success: false,
        logs: [{ text: 'ターゲットがいない！', type: 'system' }],
      };
    }

    // ダメージ計算
    const damage = CombatCalculator.calculateAttackDamage({
      attack: context.performer.attack,
      isPlayer: true,
    });

    // ダメージ適用
    const actualDamage = target.takeDamage(damage);

    const logs: ActionResult['logs'] = [
      { text: `${context.performer.name}の攻撃！`, type: 'player' },
      { text: `${target.name}に ${actualDamage} のダメージ！`, type: 'damage' },
    ];

    if (target.isDead()) {
      logs.push({ text: `${target.name}を倒した！`, type: 'system' });
    }

    return {
      success: true,
      logs,
    };
  }
}
