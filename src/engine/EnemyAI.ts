import { PartyMember } from '../models';
import { Enemy } from '../models/Enemy';
import type { Action } from '../models/actions';

export interface EnemyDecision {
  action: Action;
  target: PartyMember;
}

/**
 * 敵AI
 * 敵の行動選択とターゲット選択を担当
 */
export class EnemyAI {
  /**
   * 敵の行動を決定
   * @returns 選択されたアクションとターゲット
   */
  decideAction(enemy: Enemy, aliveMembers: PartyMember[]): EnemyDecision {
    const actions = enemy.getAvailableActions();
    const action = this.selectAction(enemy, actions);
    const target = this.selectTarget(aliveMembers);

    return { action, target };
  }

  /**
   * AIタイプに基づいてアクションを選択
   */
  private selectAction(enemy: Enemy, actions: Action[]): Action {
    const aiType = enemy.battleConfig.aiType;
    const rand = Math.random();

    // アクションを種類ごとに分類
    const normalAttack = actions.find(a => a.id === 'attack');
    const powerAttack = actions.find(a => a.name === '強攻撃');
    const wait = actions.find(a => a.id === 'wait');

    switch (aiType) {
      case 'aggressive':
        // 30% 強攻撃、70% 通常攻撃
        if (powerAttack && rand < 0.3) return powerAttack;
        return normalAttack ?? actions[0];

      case 'defensive':
        // 30% 様子見、70% 通常攻撃
        if (wait && rand < 0.3) return wait;
        return normalAttack ?? actions[0];

      case 'random':
      default:
        // 20% 強攻撃、20% 様子見、60% 通常攻撃
        if (powerAttack && rand < 0.2) return powerAttack;
        if (wait && rand < 0.4) return wait;
        return normalAttack ?? actions[0];
    }
  }

  /**
   * ターゲットをランダムに選択
   */
  private selectTarget(aliveMembers: PartyMember[]): PartyMember {
    return aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
  }
}
