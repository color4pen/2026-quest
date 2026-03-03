/**
 * 通過条件インターフェース
 *
 * 扉やワープポイントなどの通過条件を抽象化
 * ストラテジーパターンで様々な条件を実装可能
 */

import type { Party } from '../Party';

export interface PassCondition {
  /** 条件の種類（シリアライズ用） */
  readonly type: string;

  /**
   * 通過可能かどうかを判定
   * @param party パーティー
   * @returns 通過可能なら true
   */
  canPass(party: Party): boolean;

  /**
   * 通過できない場合のメッセージ
   */
  getBlockedMessage(): string;
}
