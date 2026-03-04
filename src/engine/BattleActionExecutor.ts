import { BattleLogEntry, SkillDefinition } from '../types/game';
import { Party, PartyMember } from '../models';
import { Enemy } from '../models/Enemy';
import { AttackAction, DefendAction, SkillAction, ItemAction } from '../models/actions';
import type { ActionContext } from '../models/actions';

export interface ActionLog {
  text: string;
  type: BattleLogEntry['type'];
}

/**
 * バトルアクション実行クラス
 * 内部で Action クラスを使用して処理を委譲
 */
export class BattleActionExecutor {
  constructor(
    private party: Party,
    private enemies: Enemy[],
  ) {}

  /**
   * ActionContext を作成
   */
  private createContext(member: PartyMember): ActionContext {
    return {
      performer: {
        id: member.id,
        name: member.name,
        attack: member.getEffectiveAttack(),
        defense: member.getEffectiveDefense(),
        isDefending: member.isDefending,
        isAlive: () => member.isAlive(),
      },
      allies: this.party.getAliveMembers().map(m => ({
        id: m.id,
        name: m.name,
        isAlive: () => m.isAlive(),
      })),
      enemies: this.enemies.map(e => ({
        id: e.id,
        name: e.name,
        isAlive: () => e.isAlive(),
        isDead: () => e.isDead(),
      })),
    };
  }

  executeAttack(member: PartyMember, targetIndex: number): ActionLog[] {
    const target = this.enemies[targetIndex];
    if (!target || target.isDead()) return [];

    const action = new AttackAction();
    const context = this.createContext(member);
    const result = action.execute(target, context);

    return result.logs;
  }

  executeSkill(member: PartyMember, skill: SkillDefinition, targetIndex?: number, partyTargetId?: string): ActionLog[] {
    // MP不足チェック（後方互換性のため、空配列を返す）
    if (!member.canUseSkill(skill)) {
      return [];
    }

    const action = new SkillAction(skill);
    const context = this.createContext(member);

    // ターゲット決定
    let target: PartyMember | Enemy | null = null;
    if (skill.type === 'attack' && targetIndex !== undefined) {
      target = this.enemies[targetIndex];
      if (!target || target.isDead()) return [];
    } else if (skill.type === 'heal') {
      target = partyTargetId ? this.party.getMemberById(partyTargetId) : member;
    }

    // MP消費用のオブジェクトを渡す
    const mpUser = { useMp: (cost: number) => member.useMp(cost) };
    const result = action.execute(target, context, mpUser);

    return result.logs;
  }

  executeItem(member: PartyMember, itemId: string, targetIndex?: number, partyTargetId?: string): ActionLog[] {
    // まずアイテムを取得（消費はActionで行う）
    const item = this.party.getItem(itemId);
    if (!item) return [];

    const action = new ItemAction(item);
    const context = this.createContext(member);

    // ターゲット決定
    let target: PartyMember | Enemy | null = null;
    if (item.isTargetEnemy() && targetIndex !== undefined) {
      target = this.enemies[targetIndex];
      if (!target || target.isDead()) return [];
    } else if (item.isTargetAlly()) {
      target = partyTargetId ? this.party.getMemberById(partyTargetId) : member;
    }

    // アイテム消費用のオブジェクトを渡す
    const itemConsumer = { consumeItem: (id: string) => this.party.consumeItem(id) };
    const result = action.execute(target, context, itemConsumer);

    return result.logs;
  }

  executeDefend(member: PartyMember): ActionLog[] {
    const action = new DefendAction();
    const context = this.createContext(member);

    // 防御状態を設定するための参照を渡す
    const performerRef = { defend: () => member.defend() };
    const result = action.execute(null, context, performerRef);

    return result.logs;
  }
}
