import { StateKey } from '../data/stateKeys';

/**
 * ゲーム状態管理クラス
 *
 * フラグと進行度を数値で統一管理する。
 * - 0 = 未達成/OFF/未開始（保存されない）
 * - 1以上 = 達成/ON/進行度
 */
export class GameStateManager {
  private state: Map<StateKey, number> = new Map();

  /**
   * 状態を取得（未設定は0）
   */
  get(key: StateKey): number {
    return this.state.get(key) ?? 0;
  }

  /**
   * 状態を設定（0の場合は削除）
   */
  set(key: StateKey, value: number): void {
    if (value === 0) {
      this.state.delete(key);
    } else {
      this.state.set(key, value);
    }
  }

  /**
   * 状態が1以上か（フラグ的な判定）
   */
  isSet(key: StateKey): boolean {
    return this.get(key) > 0;
  }

  /**
   * 状態を1増加
   */
  increment(key: StateKey): number {
    const newValue = this.get(key) + 1;
    this.set(key, newValue);
    return newValue;
  }

  /**
   * 状態をリセット
   */
  reset(): void {
    this.state.clear();
  }

  /**
   * セーブ用: 状態を取得
   */
  getState(): Record<string, number> {
    return Object.fromEntries(this.state);
  }

  /**
   * ロード用: 状態を復元
   */
  restoreState(savedState: Record<string, number>): void {
    this.state.clear();
    for (const [key, value] of Object.entries(savedState)) {
      if (value !== 0) {
        this.state.set(key as StateKey, value);
      }
    }
  }
}
