import { PartyMember } from '../models';
import { Enemy } from '../models/Enemy';
import type { ActionLog } from '../models/actions';

export interface EnemyTurnResult {
  logs: ActionLog[];
  partyMemberDied: boolean;
}

export class EnemyAI {
  /**
   * 敵の行動を決定
   */
  decideAction(enemy: Enemy): 'attack' | 'power_attack' | 'wait' {
    const aiType = enemy.battleConfig.aiType;
    const rand = Math.random();

    switch (aiType) {
      case 'aggressive':
        return rand < 0.3 ? 'power_attack' : 'attack';
      case 'defensive':
        return rand < 0.3 ? 'wait' : 'attack';
      case 'random':
      default:
        if (rand < 0.2) return 'power_attack';
        if (rand < 0.4) return 'wait';
        return 'attack';
    }
  }

  /**
   * 敵の1ターンを実行
   */
  executeTurn(enemy: Enemy, aliveMembers: PartyMember[]): EnemyTurnResult {
    const action = this.decideAction(enemy);
    const logs: ActionLog[] = [];
    let partyMemberDied = false;

    if (action === 'wait') {
      logs.push({ text: `${enemy.name}は様子を見ている...`, type: 'enemy' });
    } else {
      const targetMember = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
      const damage = enemy.calculateAttackDamage();
      const bonusDamage = action === 'power_attack' ? Math.floor(damage * 0.5) : 0;
      const totalDamage = damage + bonusDamage;
      const actualDamage = targetMember.takeDamage(totalDamage);

      if (action === 'power_attack') {
        logs.push({ text: `${enemy.name}の強攻撃！`, type: 'enemy' });
      } else if (targetMember.isDefending) {
        logs.push({ text: `${enemy.name}の攻撃！${targetMember.name}は防御した！`, type: 'enemy' });
      } else {
        logs.push({ text: `${enemy.name}の攻撃！`, type: 'enemy' });
      }
      logs.push({ text: `${targetMember.name}に ${actualDamage} のダメージ！`, type: 'damage' });

      // 毒攻撃判定
      const poisonChance = enemy.battleConfig.poisonChance ?? 0;
      if (poisonChance > 0 && !targetMember.isPoisoned && targetMember.isAlive() && Math.random() < poisonChance) {
        targetMember.poison();
        logs.push({ text: `${targetMember.name}は毒を受けた！`, type: 'damage' });
      }

      if (targetMember.isDead()) {
        logs.push({ text: `${targetMember.name}は倒れた！`, type: 'system' });
        partyMemberDied = true;
      }
    }

    return { logs, partyMemberDied };
  }
}
