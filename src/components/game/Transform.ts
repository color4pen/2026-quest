import { Position, Direction, MAP_WIDTH, MAP_HEIGHT } from '../../types/game';

/**
 * Transformコンポーネント
 * Unity の Transform に相当 - 位置と移動を管理
 */
export class Transform implements Position {
  private _x: number;
  private _y: number;

  constructor(x: number = 0, y: number = 0) {
    this._x = x;
    this._y = y;
  }

  // Position
  get x(): number { return this._x; }
  get y(): number { return this._y; }

  set x(value: number) { this._x = value; }
  set y(value: number) { this._y = value; }

  /**
   * 位置を設定
   */
  setPosition(x: number, y: number): void {
    this._x = x;
    this._y = y;
  }

  /**
   * 位置をコピー
   */
  copyFrom(position: Position): void {
    this._x = position.x;
    this._y = position.y;
  }

  /**
   * 指定方向の次の座標を計算
   */
  getNextPosition(direction: Direction): Position {
    let newX = this._x;
    let newY = this._y;

    switch (direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }

    return { x: newX, y: newY };
  }

  /**
   * 移動
   */
  move(direction: Direction): void {
    const next = this.getNextPosition(direction);
    this._x = next.x;
    this._y = next.y;
  }

  /**
   * 指定座標へ移動
   */
  moveTo(position: Position): void {
    this._x = position.x;
    this._y = position.y;
  }

  /**
   * 指定座標にいるか判定
   */
  isAt(position: Position): boolean {
    return this._x === position.x && this._y === position.y;
  }

  /**
   * 他のTransformとの距離（マンハッタン距離）
   */
  distanceTo(other: Position): number {
    return Math.abs(this._x - other.x) + Math.abs(this._y - other.y);
  }

  /**
   * マップ範囲内か判定
   */
  isInBounds(): boolean {
    return (
      this._x >= 0 &&
      this._x < MAP_WIDTH &&
      this._y >= 0 &&
      this._y < MAP_HEIGHT
    );
  }

  /**
   * 指定座標がマップ範囲内か判定（静的）
   */
  static isValidPosition(position: Position): boolean {
    return (
      position.x >= 0 &&
      position.x < MAP_WIDTH &&
      position.y >= 0 &&
      position.y < MAP_HEIGHT
    );
  }

  /**
   * 座標をコピーして取得
   */
  getPosition(): Position {
    return { x: this._x, y: this._y };
  }

  /**
   * 複製
   */
  clone(): Transform {
    return new Transform(this._x, this._y);
  }
}
