import { Position, CameraState } from '../../types/game';
import { Transform } from './Transform';

/**
 * GameEntityの基本状態（React用）
 */
export interface GameEntityState {
  id: string;
  x: number;
  y: number;
  active: boolean;
}

/**
 * GameEntityベースクラス
 * 座標と状態のみを持つ純粋なドメインクラス
 * 描画ロジックは含まない（プレゼンテーション層が担当）
 */
export abstract class GameEntity {
  private static nextId = 0;

  public readonly id: string;
  public readonly transform: Transform;
  protected _active: boolean = true;

  constructor(x: number = 0, y: number = 0) {
    this.id = `${this.constructor.name}_${GameEntity.nextId++}`;
    this.transform = new Transform(x, y);
  }

  // Position のショートカット
  get x(): number { return this.transform.x; }
  get y(): number { return this.transform.y; }
  set x(value: number) { this.transform.x = value; }
  set y(value: number) { this.transform.y = value; }

  // Active状態
  get active(): boolean { return this._active; }
  set active(value: boolean) { this._active = value; }

  // 描画順序（デフォルト0、サブクラスでオーバーライド可能）
  get zIndex(): number { return 0; }

  /**
   * 指定座標にいるか判定
   */
  isAt(position: Position): boolean {
    return this.transform.isAt(position);
  }

  /**
   * オブジェクトがビューポート内にあるかチェック
   */
  isInViewport(camera: CameraState): boolean {
    const halfW = camera.viewportWidth / 2;
    const halfH = camera.viewportHeight / 2;

    return (
      this.transform.x >= camera.x - halfW - 1 &&
      this.transform.x <= camera.x + halfW + 1 &&
      this.transform.y >= camera.y - halfH - 1 &&
      this.transform.y <= camera.y + halfH + 1
    );
  }

  /**
   * 更新（サブクラスでオーバーライド）
   */
  update(_deltaTime: number): void {
    // デフォルトは何もしない
  }

  /**
   * 破棄
   */
  destroy(): void {
    this._active = false;
  }

  /**
   * 基本状態を取得
   */
  getBaseState(): GameEntityState {
    return {
      id: this.id,
      x: this.transform.x,
      y: this.transform.y,
      active: this._active,
    };
  }

  /**
   * 状態を取得（サブクラスでオーバーライド）
   */
  abstract getState(): GameEntityState;
}
