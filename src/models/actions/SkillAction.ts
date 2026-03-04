import type { Action, ActionContext, ActionResult, ActionTargetType } from './Action';
import type { Combatant } from '../Combatant';
import { isPlayerCombatant } from '../Combatant';
import type { SkillDefinition } from '../../types/battle';
import { CombatCalculator } from '../../engine/CombatCalculator';

/**
 * スキルアクション
 * 攻撃スキルと回復スキルの両方に対応
 */
export class SkillAction implements Action {
  readonly id: string;
  readonly name: string;
  readonly type = 'skill' as const;
  readonly skill: SkillDefinition;

  constructor(skill: SkillDefinition) {
    this.skill = skill;
    this.id = `skill_${skill.id}`;
    this.name = skill.name;
  }

  getTargetType(): ActionTargetType {
    if (this.skill.type === 'attack') {
      return 'single_enemy';
    }
    return 'self'; // 回復スキルは自分対象
  }

  canExecute(context: ActionContext): boolean {
    if (!context.performer.isAlive()) {
      return false;
    }
    // PlayerCombatant の場合、MPチェック
    if (isPlayerCombatant(context.performer)) {
      return context.performer.canUseSkill(this.skill);
    }
    return true;
  }

  execute(
    target: Combatant | null,
    context: ActionContext
  ): ActionResult {
    // PlayerCombatant の場合、MP消費
    if (isPlayerCombatant(context.performer)) {
      if (!context.performer.useMp(this.skill.mpCost)) {
        return {
          success: false,
          logs: [{ text: 'MPが足りない！', type: 'system' as const }],
        };
      }
    }

    if (this.skill.type === 'attack') {
      return this.executeAttackSkill(target, context);
    } else {
      return this.executeHealSkill(target, context);
    }
  }

  private executeAttackSkill(
    target: Combatant | null,
    context: ActionContext
  ): ActionResult {
    if (!target) {
      return {
        success: false,
        logs: [{ text: 'ターゲットがいない！', type: 'system' as const }],
      };
    }

    // ダメージ計算
    const damage = CombatCalculator.calculateSkillDamage(
      { attack: context.performer.attack, isPlayer: true },
      this.skill
    );

    // ダメージ適用
    const actualDamage = target.takeDamage(damage);

    const logs: ActionResult['logs'] = [
      { text: `${context.performer.name}の${this.skill.name}！`, type: 'player' },
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

  private executeHealSkill(
    target: Combatant | null,
    context: ActionContext
  ): ActionResult {
    // 回復対象を決定（ターゲットがいなければ自分）
    const healTarget = target ?? context.performer;

    const healed = healTarget.heal(this.skill.power);

    return {
      success: true,
      logs: [
        { text: `${context.performer.name}の${this.skill.name}！`, type: 'player' as const },
        { text: `${healTarget.name}のHPが ${healed} 回復した！`, type: 'heal' as const },
      ],
    };
  }
}
