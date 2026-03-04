import { BattleLogEntry, SkillDefinition } from '../types/game';
import { Party, PartyMember, DamageItem, HealItem, CureItem } from '../models';
import { Enemy } from '../models/Enemy';

export interface ActionLog {
  text: string;
  type: BattleLogEntry['type'];
}

export class BattleActionExecutor {
  constructor(
    private party: Party,
    private enemies: Enemy[],
  ) {}

  executeAttack(member: PartyMember, targetIndex: number): ActionLog[] {
    const target = this.enemies[targetIndex];
    if (!target || target.isDead()) return [];

    const damage = member.calculateAttackDamage();
    target.takeDamage(damage);

    const logs: ActionLog[] = [
      { text: `${member.name}の攻撃！`, type: 'player' },
      { text: `${target.name}に ${damage} のダメージ！`, type: 'damage' },
    ];

    if (target.isDead()) {
      logs.push({ text: `${target.name}を倒した！`, type: 'system' });
    }

    return logs;
  }

  executeSkill(member: PartyMember, skill: SkillDefinition, targetIndex?: number, partyTargetId?: string): ActionLog[] {
    if (!member.useMp(skill.mpCost)) return [];

    const logs: ActionLog[] = [];

    if (skill.type === 'attack' && targetIndex !== undefined) {
      const target = this.enemies[targetIndex];
      if (!target || target.isDead()) return logs;

      const damage = member.calculateSkillDamage(skill);
      target.takeDamage(damage);

      logs.push({ text: `${member.name}の${skill.name}！`, type: 'player' });
      logs.push({ text: `${target.name}に ${damage} のダメージ！`, type: 'damage' });

      if (target.isDead()) {
        logs.push({ text: `${target.name}を倒した！`, type: 'system' });
      }
    } else if (skill.type === 'heal') {
      const target = partyTargetId ? this.party.getMemberById(partyTargetId) : member;
      if (!target) return logs;

      const healed = target.heal(skill.power);
      logs.push({ text: `${member.name}の${skill.name}！`, type: 'player' });
      logs.push({ text: `${target.name}のHPが ${healed} 回復した！`, type: 'heal' });
    }

    return logs;
  }

  executeItem(member: PartyMember, itemId: string, targetIndex?: number, partyTargetId?: string): ActionLog[] {
    const item = this.party.consumeItem(itemId);
    if (!item) return [];

    const logs: ActionLog[] = [
      { text: `${member.name}は${item.name}を使った！`, type: 'player' },
    ];

    switch (item.type) {
      case 'heal': {
        const healTarget = partyTargetId ? this.party.getMemberById(partyTargetId) : member;
        if (healTarget && item instanceof HealItem) {
          const healed = healTarget.heal(item.healAmount);
          logs.push({ text: `${healTarget.name}のHPが ${healed} 回復した！`, type: 'heal' });
        }
        break;
      }
      case 'damage': {
        if (targetIndex !== undefined && item instanceof DamageItem) {
          const target = this.enemies[targetIndex];
          if (target && !target.isDead()) {
            target.takeDamage(item.damage);
            logs.push({ text: `${target.name}に ${item.damage} のダメージ！`, type: 'damage' });
            if (target.isDead()) {
              logs.push({ text: `${target.name}を倒した！`, type: 'system' });
            }
          }
        }
        break;
      }
      case 'cure': {
        const cureTarget = partyTargetId ? this.party.getMemberById(partyTargetId) : member;
        if (cureTarget && item instanceof CureItem) {
          if (cureTarget.hasStatusEffect(item.cureEffect)) {
            cureTarget.removeStatusEffect(item.cureEffect);
            const effectNames: Record<string, string> = {
              poison: '毒',
              influenza: 'インフルエンザ',
            };
            const effectName = effectNames[item.cureEffect] || item.cureEffect;
            logs.push({ text: `${cureTarget.name}の${effectName}が治った！`, type: 'heal' });
          } else {
            logs.push({ text: `しかし効果がなかった...`, type: 'system' });
          }
        }
        break;
      }
    }

    return logs;
  }

  executeDefend(member: PartyMember): ActionLog[] {
    member.defend();
    return [{ text: `${member.name}は防御の構えをとった！`, type: 'player' }];
  }
}
