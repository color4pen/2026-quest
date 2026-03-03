/**
 * HP値オブジェクト
 *
 * 不変オブジェクトとして current/max HP を管理。
 * ダメージ・回復時のクランプ処理を一元化する。
 */
export class HitPoints {
  constructor(
    readonly current: number,
    readonly max: number,
  ) {}

  /** max HP で満タン状態を生成 */
  static create(max: number): HitPoints {
    return new HitPoints(max, max);
  }

  /** 指定 current/max で生成 */
  static of(current: number, max: number): HitPoints {
    return new HitPoints(Math.max(0, current), max);
  }

  /** ダメージを受けた新しい HitPoints を返す */
  damage(amount: number): HitPoints {
    return new HitPoints(Math.max(0, this.current - amount), this.max);
  }

  /** 回復した新しい HitPoints を返す */
  heal(amount: number): HitPoints {
    return new HitPoints(Math.min(this.max, this.current + amount), this.max);
  }

  /** max を変更した新しい HitPoints を返す（レベルアップ時等） */
  withMax(newMax: number): HitPoints {
    return new HitPoints(this.current, newMax);
  }

  /** 全回復した新しい HitPoints を返す */
  fullRestore(): HitPoints {
    return new HitPoints(this.max, this.max);
  }

  get isDead(): boolean {
    return this.current <= 0;
  }

  get isAlive(): boolean {
    return this.current > 0;
  }

  get isFull(): boolean {
    return this.current >= this.max;
  }
}
