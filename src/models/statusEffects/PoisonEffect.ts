/**
 * 毒状態クラス
 *
 * 効果: 毎ターン終了時に最大HPの10%のダメージを受ける
 * 持続: 永続（治療アイテムで回復）
 */

import type { PartyMember } from '../PartyMember';
import type { StatusEffectResult, StatusEffectType } from '../../types/statusEffect';
import { BaseStatusEffect } from './BaseStatusEffect';

export class PoisonEffect extends BaseStatusEffect {
  readonly type: StatusEffectType = 'poison';
  readonly name: string = '毒';
  readonly shortName: string = 'PSN';
  readonly color: string = '#9b59b6';

  /** ダメージ割合（最大HPに対する割合） */
  private readonly damageRate: number;

  /**
   * @param duration 持続ターン数（デフォルト: -1 = 永続）
   * @param damageRate ダメージ割合（デフォルト: 0.1 = 10%）
   */
  constructor(duration: number = -1, damageRate: number = 0.1) {
    super(duration);
    this.damageRate = damageRate;
  }

  /**
   * ターン終了時に毒ダメージを与える
   */
  onTurnEnd(target: PartyMember): StatusEffectResult | null {
    if (!target.isAlive()) {
      return null;
    }

    const damage = Math.max(1, Math.floor(target.maxHp * this.damageRate));
    target.takeDamageRaw(damage);

    const result: StatusEffectResult = {
      damage,
      message: `${target.name}は毒のダメージを${damage}受けた！`,
    };

    if (target.isDead()) {
      result.message += `\n${target.name}は倒れた...`;
    }

    return result;
  }
}
