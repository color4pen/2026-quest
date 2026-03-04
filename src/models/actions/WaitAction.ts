import type { Action, ActionContext, ActionResult, ActionTargetType } from './Action';
import type { Combatant } from '../Combatant';

/**
 * 様子見アクション
 * 敵が何もせずにターンを終了する
 */
export class WaitAction implements Action {
  readonly id = 'wait';
  readonly name = '様子見';
  readonly type = 'defend' as const; // 攻撃でも防御でもないが、型上は defend を使用

  getTargetType(): ActionTargetType {
    return 'none';
  }

  canExecute(context: ActionContext): boolean {
    return context.performer.isAlive();
  }

  execute(
    _target: Combatant | null,
    context: ActionContext
  ): ActionResult {
    return {
      success: true,
      logs: [
        { text: `${context.performer.name}は様子を見ている...`, type: 'enemy' },
      ],
    };
  }
}
