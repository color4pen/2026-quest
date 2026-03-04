import type { Action, ActionContext, ActionResult, ActionTargetType } from './Action';
import { isPlayerCombatant, type Combatant } from '../Combatant';
import { CombatCalculator } from '../../engine/CombatCalculator';

/**
 * 追撃アクション（2撃目用）
 * アナウンスなしでダメージのみ与える
 */
class FollowUpHitAction implements Action {
  readonly id = 'follow_up_hit';
  readonly name = '追撃';
  readonly type = 'attack' as const;

  getTargetType(): ActionTargetType {
    return 'single_enemy';
  }

  canExecute(context: ActionContext): boolean {
    return context.performer.isAlive();
  }

  execute(target: Combatant | null, context: ActionContext): ActionResult {
    if (!target || target.isDead()) {
      return { success: false, logs: [] };
    }

    const damage = CombatCalculator.calculateAttackDamage({
      attack: context.performer.attack,
      isPlayer: isPlayerCombatant(context.performer),
    });

    const actualDamage = target.takeDamage(damage);

    const logs: ActionResult['logs'] = [
      { text: `${target.name}に ${actualDamage} のダメージ！`, type: 'damage' },
    ];

    if (target.isDead()) {
      logs.push({ text: `${target.name}を倒した！`, type: 'system' });
    }

    return { success: true, logs };
  }
}

/**
 * 2回攻撃アクション
 * 装備効果で付与される特殊攻撃
 * 1撃目を実行し、2撃目を followUpActions で返す
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

  execute(target: Combatant | null, context: ActionContext): ActionResult {
    if (!target) {
      return {
        success: false,
        logs: [{ text: 'ターゲットがいない！', type: 'system' }],
      };
    }

    // 1撃目
    const isPlayer = isPlayerCombatant(context.performer);
    const damage = CombatCalculator.calculateAttackDamage({
      attack: context.performer.attack,
      isPlayer,
    });

    const actualDamage = target.takeDamage(damage);

    const logs: ActionResult['logs'] = [
      { text: `${context.performer.name}の連続攻撃！`, type: isPlayer ? 'player' : 'enemy' },
      { text: `${target.name}に ${actualDamage} のダメージ！`, type: 'damage' },
    ];

    if (target.isDead()) {
      logs.push({ text: `${target.name}を倒した！`, type: 'system' });
      // 倒したら2撃目なし
      return { success: true, logs };
    }

    // 2撃目を followUpActions で返す
    return {
      success: true,
      logs,
      followUpActions: [new FollowUpHitAction()],
    };
  }
}
