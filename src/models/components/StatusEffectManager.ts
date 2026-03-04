import type { StatusEffect, StatusEffectType, StatusEffectInfo } from '../../types/statusEffect';
import { StatusEffectFactory } from '../statusEffects';
import type { PartyMember } from '../PartyMember';

/**
 * 状態異常管理
 */
export class StatusEffectManager {
  private effects: StatusEffect[] = [];

  /**
   * 状態異常を追加
   * 同じ種類の状態異常は重複しない
   * @returns 追加成功したかどうか
   */
  add(type: StatusEffectType, duration?: number): boolean {
    if (this.has(type)) {
      return false;
    }

    const effect = StatusEffectFactory.create(type, duration);
    this.effects.push(effect);
    return true;
  }

  /**
   * 特定の種類の状態異常を解除
   * @returns 解除したかどうか
   */
  remove(type: StatusEffectType): boolean {
    const initialLength = this.effects.length;
    this.effects = this.effects.filter(e => e.type !== type);
    return this.effects.length < initialLength;
  }

  /**
   * 特定の状態異常を持っているか
   */
  has(type: StatusEffectType): boolean {
    return this.effects.some(e => e.type === type);
  }

  /**
   * 全ての状態異常を解除
   */
  clear(): void {
    this.effects = [];
  }

  /**
   * 全ての状態異常を取得
   */
  getAll(): readonly StatusEffect[] {
    return this.effects;
  }

  /**
   * 状態異常情報を取得（UI表示用）
   */
  getInfos(): StatusEffectInfo[] {
    return this.effects.map(e => ({
      type: e.type,
      name: e.name,
      shortName: e.shortName,
      color: e.color,
      remainingTurns: e.remainingTurns,
    }));
  }

  /**
   * ターン終了時の状態異常処理
   * @returns 処理結果の配列（ログ表示用）
   */
  processTurnEnd(target: PartyMember): { message: string; damage?: number; targetDied?: boolean }[] {
    const results: { message: string; damage?: number; targetDied?: boolean }[] = [];

    for (const effect of this.effects) {
      const result = effect.onTurnEnd(target);
      if (result) {
        results.push({
          message: result.message,
          damage: result.damage,
          targetDied: target.isDead(),
        });
      }
      effect.tick();
    }

    // 解除すべき状態異常を削除
    this.effects = this.effects.filter(e => !e.shouldRemove());

    return results;
  }
}
