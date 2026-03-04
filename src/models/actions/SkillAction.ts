import type { Action, ActionContext, ActionResult, ActionTargetType } from './Action';
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

  canExecute(context: ActionContext, mpChecker?: { canUseSkill(skill: SkillDefinition): boolean }): boolean {
    if (!context.performer.isAlive()) {
      return false;
    }
    // MPチェック（mpChecker が渡された場合）
    if (mpChecker && !mpChecker.canUseSkill(this.skill)) {
      return false;
    }
    return true;
  }

  execute(
    target: { takeDamage(amount: number): number; heal(amount: number): number; isDead(): boolean; name: string } | null,
    context: ActionContext,
    mpUser?: { useMp(amount: number): boolean }
  ): ActionResult {
    // MP消費
    if (mpUser && !mpUser.useMp(this.skill.mpCost)) {
      return {
        success: false,
        logs: [{ text: 'MPが足りない！', type: 'system' as const }],
      };
    }

    if (this.skill.type === 'attack') {
      return this.executeAttackSkill(target, context);
    } else {
      return this.executeHealSkill(target, context);
    }
  }

  private executeAttackSkill(
    target: { takeDamage(amount: number): number; isDead(): boolean; name: string } | null,
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
    target: { heal(amount: number): number; name: string } | null,
    context: ActionContext
  ): ActionResult {
    // 回復スキルはターゲットがない場合、自分を回復
    const targetName = target?.name ?? context.performer.name;

    const healed = target?.heal(this.skill.power) ?? 0;

    return {
      success: true,
      logs: [
        { text: `${context.performer.name}の${this.skill.name}！`, type: 'player' as const },
        { text: `${targetName}のHPが ${healed} 回復した！`, type: 'heal' as const },
      ],
    };
  }
}
