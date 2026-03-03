/**
 * 状態異常ファクトリ
 *
 * 状態異常の種類から対応するクラスのインスタンスを生成する
 * 新しい状態異常を追加する場合はこのファクトリに登録する
 */

import type { StatusEffect, StatusEffectType, StatusEffectData } from '../../types/statusEffect';
import { PoisonEffect } from './PoisonEffect';
import { InfluenzaEffect } from './InfluenzaEffect';

export class StatusEffectFactory {
  /**
   * 状態異常の種類からインスタンスを生成
   * @param type 状態異常の種類
   * @param duration 持続ターン数（省略時はデフォルト値）
   */
  static create(type: StatusEffectType, duration?: number): StatusEffect {
    switch (type) {
      case 'poison':
        return new PoisonEffect(duration);

      case 'influenza':
        return new InfluenzaEffect(duration);

      // 将来の拡張用:
      // case 'paralysis':
      //   return new ParalysisEffect(duration);
      // case 'sleep':
      //   return new SleepEffect(duration);

      default:
        // TypeScriptの網羅性チェック
        const _exhaustive: never = type;
        throw new Error(`Unknown status effect type: ${_exhaustive}`);
    }
  }

  /**
   * シリアライズされたデータから状態異常を復元
   * @param data シリアライズされた状態異常データ
   */
  static fromData(data: StatusEffectData): StatusEffect {
    const effect = this.create(data.type, data.remainingTurns);
    return effect;
  }

  /**
   * 状態異常をシリアライズ可能なデータに変換
   * @param effect 状態異常インスタンス
   */
  static toData(effect: StatusEffect): StatusEffectData {
    return {
      type: effect.type,
      remainingTurns: effect.remainingTurns,
    };
  }
}
