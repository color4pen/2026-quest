/**
 * 状態異常基底クラス
 *
 * 全ての状態異常クラスはこのクラスを継承する
 * 共通処理を実装し、個別の処理はサブクラスでオーバーライド
 */

import type { PartyMember } from '../PartyMember';
import type {
  StatusEffect,
  StatusEffectType,
  StatusEffectResult,
} from '../../types/statusEffect';

export abstract class BaseStatusEffect implements StatusEffect {
  abstract readonly type: StatusEffectType;
  abstract readonly name: string;
  abstract readonly shortName: string;
  abstract readonly color: string;

  public remainingTurns: number;

  /**
   * @param duration 持続ターン数（-1 = 永続、治療が必要）
   */
  constructor(duration: number = -1) {
    this.remainingTurns = duration;
  }

  /**
   * ターン開始時の処理（デフォルトは何もしない）
   */
  onTurnStart(_target: PartyMember): StatusEffectResult | null {
    return null;
  }

  /**
   * ターン終了時の処理（デフォルトは何もしない）
   */
  onTurnEnd(_target: PartyMember): StatusEffectResult | null {
    return null;
  }

  /**
   * ダメージを受けた時の処理（デフォルトは何もしない）
   */
  onDamageReceived(_target: PartyMember, _damage: number): StatusEffectResult | null {
    return null;
  }

  /**
   * 行動時の処理（デフォルトは何もしない）
   */
  onAction(_target: PartyMember): StatusEffectResult | null {
    return null;
  }

  /**
   * 状態異常が解除されるべきか判定
   */
  shouldRemove(): boolean {
    return this.remainingTurns === 0;
  }

  /**
   * ターン経過処理
   */
  tick(): void {
    if (this.remainingTurns > 0) {
      this.remainingTurns--;
    }
  }
}
