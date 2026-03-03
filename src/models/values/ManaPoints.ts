/**
 * MP値オブジェクト
 *
 * 不変オブジェクトとして current/max MP を管理。
 * 消費・回復時のクランプ処理を一元化する。
 */
export class ManaPoints {
  constructor(
    readonly current: number,
    readonly max: number,
  ) {}

  /** max MP で満タン状態を生成 */
  static create(max: number): ManaPoints {
    return new ManaPoints(max, max);
  }

  /** 指定 current/max で生成 */
  static of(current: number, max: number): ManaPoints {
    return new ManaPoints(Math.max(0, current), max);
  }

  /** MP を消費した新しい ManaPoints を返す。足りなければ null */
  use(amount: number): ManaPoints | null {
    if (this.current < amount) {
      return null;
    }
    return new ManaPoints(this.current - amount, this.max);
  }

  /** MP を回復した新しい ManaPoints を返す */
  restore(amount: number): ManaPoints {
    return new ManaPoints(Math.min(this.max, this.current + amount), this.max);
  }

  /** max を変更した新しい ManaPoints を返す（レベルアップ時等） */
  withMax(newMax: number): ManaPoints {
    return new ManaPoints(this.current, newMax);
  }

  /** 全回復した新しい ManaPoints を返す */
  fullRestore(): ManaPoints {
    return new ManaPoints(this.max, this.max);
  }

  /** 指定量を消費可能か */
  canUse(amount: number): boolean {
    return this.current >= amount;
  }
}
