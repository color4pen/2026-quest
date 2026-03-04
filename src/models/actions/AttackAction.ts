import type { Action, ActionContext, ActionResult, ActionTargetType } from './Action';
import type { Combatant } from '../Combatant';
import { isPlayerCombatant } from '../Combatant';
import { CombatCalculator } from '../../engine/CombatCalculator';

/**
 * 攻撃オプション
 */
export interface AttackOptions {
  /** ダメージ倍率（デフォルト: 1.0） */
  multiplier?: number;
  /** 攻撃名（「強攻撃」など、未指定なら「攻撃」） */
  name?: string;
  /** 毒付与確率（0-1） */
  poisonChance?: number;
}

/**
 * 毒付与可能なターゲット
 */
interface Poisonable {
  isPoisoned: boolean;
  poison(): void;
}

function isPoisonable(target: unknown): target is Poisonable {
  return (
    typeof target === 'object' &&
    target !== null &&
    'isPoisoned' in target &&
    'poison' in target
  );
}

/**
 * 攻撃アクション
 * プレイヤーと敵の両方が使用可能
 */
export class AttackAction implements Action {
  readonly id = 'attack';
  readonly name: string;
  readonly type = 'attack' as const;

  private readonly multiplier: number;
  private readonly poisonChance: number;

  constructor(private options: AttackOptions = {}) {
    this.name = options.name ?? '攻撃';
    this.multiplier = options.multiplier ?? 1.0;
    this.poisonChance = options.poisonChance ?? 0;
  }

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

    // performer がプレイヤーか敵かでログ type を判定
    const logType = isPlayerCombatant(context.performer) ? 'player' : 'enemy';

    // ダメージ計算
    const baseDamage = CombatCalculator.calculateAttackDamage({
      attack: context.performer.attack,
      isPlayer: isPlayerCombatant(context.performer),
    });
    const damage = Math.floor(baseDamage * this.multiplier);

    // ダメージ適用
    const actualDamage = target.takeDamage(damage);

    // 攻撃ログ
    const attackText = this.options.name
      ? `${context.performer.name}の${this.options.name}！`
      : `${context.performer.name}の攻撃！`;

    // 防御中の場合のログ
    const logs: ActionResult['logs'] = [];
    if (target.isDefending) {
      logs.push({ text: `${attackText}${target.name}は防御した！`, type: logType });
    } else {
      logs.push({ text: attackText, type: logType });
    }

    logs.push({ text: `${target.name}に ${actualDamage} のダメージ！`, type: 'damage' });

    // 毒付与判定
    if (
      this.poisonChance > 0 &&
      isPoisonable(target) &&
      !target.isPoisoned &&
      target.isAlive() &&
      Math.random() < this.poisonChance
    ) {
      target.poison();
      logs.push({ text: `${target.name}は毒を受けた！`, type: 'damage' });
    }

    if (target.isDead()) {
      logs.push({ text: `${target.name}を倒した！`, type: 'system' });
    }

    return {
      success: true,
      logs,
    };
  }
}
