import type { Action, ActionContext, ActionResult, ActionTargetType } from './Action';
import type { Combatant } from '../Combatant';
import { isPlayerCombatant } from '../Combatant';

/**
 * 防御アクション
 * 実行者を防御状態にする
 */
export class DefendAction implements Action {
  readonly id = 'defend';
  readonly name = '防御';
  readonly type = 'defend' as const;

  getTargetType(): ActionTargetType {
    return 'self';
  }

  canExecute(context: ActionContext): boolean {
    return context.performer.isAlive();
  }

  execute(
    _target: Combatant | null,
    context: ActionContext
  ): ActionResult {
    // performer が PlayerCombatant なら防御状態にする
    if (isPlayerCombatant(context.performer)) {
      context.performer.defend();
    }

    return {
      success: true,
      logs: [
        { text: `${context.performer.name}は防御の構えをとった！`, type: 'player' as const },
      ],
    };
  }
}
