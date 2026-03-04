import type { Action, ActionContext, ActionResult, ActionTargetType } from './Action';

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
    _target: null,
    context: ActionContext,
    performerRef?: { defend(): void }
  ): ActionResult {
    // performerRef が渡された場合、防御状態にする
    if (performerRef && typeof performerRef.defend === 'function') {
      performerRef.defend();
    }

    return {
      success: true,
      logs: [
        { text: `${context.performer.name}は防御の構えをとった！`, type: 'player' as const },
      ],
    };
  }
}
