/**
 * 扉クラス
 *
 * 条件付きの通過可能ポイントを表現
 * 各扉は個別の通過条件を持つことができる
 */

import type { Position, DoorPlacement } from '../types/game';
import type { Party } from './Party';
import type { PassCondition } from './conditions/PassCondition';
import { ConditionFactory, ConditionType } from './conditions/ConditionFactory';

export class Door {
  public readonly id: string;
  public readonly position: Position;
  private condition: PassCondition | null;

  constructor(placement: DoorPlacement) {
    this.id = placement.id;
    this.position = { x: placement.x, y: placement.y };
    this.condition = placement.condition
      ? ConditionFactory.create(placement.condition as ConditionType)
      : null;
  }

  /**
   * 指定座標にこの扉があるか
   */
  isAt(position: Position): boolean {
    return this.position.x === position.x && this.position.y === position.y;
  }

  /**
   * 通過可能か判定
   * 条件がなければ常に通過可能
   */
  canPass(party: Party): boolean {
    if (!this.condition) {
      return true;
    }
    return this.condition.canPass(party);
  }

  /**
   * 通過できない場合のメッセージ
   */
  getBlockedMessage(): string {
    if (!this.condition) {
      return '';
    }
    return this.condition.getBlockedMessage();
  }

  /**
   * 条件があるかどうか
   */
  hasCondition(): boolean {
    return this.condition !== null;
  }
}
