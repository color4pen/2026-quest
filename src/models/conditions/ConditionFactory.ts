/**
 * 通過条件ファクトリ
 *
 * 条件タイプから対応する条件オブジェクトを生成
 * 新しい条件を追加する場合はここに登録
 *
 * TODO: パラメータ付き条件をサポートする場合の改善案
 *
 * 1. create メソッドのシグネチャを変更:
 *    static create(type: ConditionType, params?: Record<string, unknown>): PassCondition
 *
 * 2. 鍵条件の例:
 *    case 'has_key':
 *      return new HasKeyCondition(params?.keyId as string);
 *
 * 3. HasKeyCondition の実装例:
 *    class HasKeyCondition implements PassCondition {
 *      constructor(private keyId: string) {}
 *      canPass(party: Party): boolean {
 *        return party.hasItem(this.keyId);
 *      }
 *      getBlockedMessage(): string {
 *        return '鍵がかかっている...';
 *      }
 *    }
 */

import type { PassCondition } from './PassCondition';
import { NoInfluenzaCondition } from './NoInfluenzaCondition';

/** 条件タイプ */
export type ConditionType = 'no_influenza';
// 将来の拡張用:
// | 'has_key'        // 特定の鍵を持っている
// | 'boss_defeated'  // ボスを倒している
// | 'quest_complete' // クエストをクリアしている

export class ConditionFactory {
  /**
   * 条件タイプからインスタンスを生成
   * @param type 条件タイプ
   * @param _params 将来のパラメータ用（現在未使用）
   */
  static create(type: ConditionType, _params?: Record<string, unknown>): PassCondition {
    switch (type) {
      case 'no_influenza':
        return new NoInfluenzaCondition();

      // 将来の拡張用:
      // case 'has_key':
      //   return new HasKeyCondition(_params?.keyId as string);

      default:
        const _exhaustive: never = type;
        throw new Error(`Unknown condition type: ${_exhaustive}`);
    }
  }
}
