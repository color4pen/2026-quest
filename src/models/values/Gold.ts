/**
 * ゴールド値オブジェクト
 *
 * 不変オブジェクトとして所持金を管理。
 * 加算・消費時のバリデーションを一元化する。
 */
export class Gold {
  constructor(readonly amount: number) {}

  /** 指定額で生成 */
  static of(amount: number): Gold {
    return new Gold(Math.max(0, amount));
  }

  /** ゴールドを加算した新しい Gold を返す */
  add(value: number): Gold {
    return new Gold(this.amount + value);
  }

  /** ゴールドを消費した新しい Gold を返す。足りなければ null */
  spend(value: number): Gold | null {
    if (this.amount < value) {
      return null;
    }
    return new Gold(this.amount - value);
  }

  /** 指定額を払えるか */
  canAfford(price: number): boolean {
    return this.amount >= price;
  }
}
