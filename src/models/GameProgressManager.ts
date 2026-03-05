import { StateKey } from '../data/stateKeys';

/**
 * ゲーム進行管理クラス
 *
 * フラグと進行度を数値で統一管理する。
 * - 0 = 未達成/OFF/未開始（保存されない）
 * - 1以上 = 達成/ON/進行度
 */
export class GameProgressManager {
  private progress: Map<StateKey, number> = new Map();

  /**
   * 進行度を取得（未設定は0）
   */
  get(key: StateKey): number {
    return this.progress.get(key) ?? 0;
  }

  /**
   * 進行度を設定（0の場合は削除）
   */
  set(key: StateKey, value: number): void {
    if (value === 0) {
      this.progress.delete(key);
    } else {
      this.progress.set(key, value);
    }
  }

  /**
   * 進行度が1以上か（フラグ的な判定）
   */
  isSet(key: StateKey): boolean {
    return this.get(key) > 0;
  }

  /**
   * 進行度を1増加
   */
  increment(key: StateKey): number {
    const newValue = this.get(key) + 1;
    this.set(key, newValue);
    return newValue;
  }

  /**
   * 進行度をリセット
   */
  reset(): void {
    this.progress.clear();
  }

  /**
   * セーブ用: 進行度を取得
   * 注: フィールド名 gameState は後方互換性のため維持
   */
  getProgress(): Record<string, number> {
    return Object.fromEntries(this.progress);
  }

  /**
   * ロード用: 進行度を復元
   */
  restoreProgress(savedProgress: Record<string, number>): void {
    this.progress.clear();
    for (const [key, value] of Object.entries(savedProgress)) {
      if (value !== 0) {
        this.progress.set(key as StateKey, value);
      }
    }
  }
}
