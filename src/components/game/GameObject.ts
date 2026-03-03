import { Position, CameraState } from '../../types/game';
import { Transform } from './Transform';
import { Renderer } from './Renderer';

/**
 * GameObjectの基本状態（React用）
 */
export interface GameObjectState {
  id: string;
  x: number;
  y: number;
  active: boolean;
}

/**
 * GameObjectベースクラス
 * Unity の GameObject に相当 - 全てのゲームエンティティの基底クラス
 */
export abstract class GameObject {
  private static nextId = 0;

  public readonly id: string;
  public readonly transform: Transform;
  protected renderer: Renderer | null = null;
  protected _active: boolean = true;

  constructor(x: number = 0, y: number = 0) {
    this.id = `${this.constructor.name}_${GameObject.nextId++}`;
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

  /**
   * 指定座標にいるか判定
   */
  isAt(position: Position): boolean {
    return this.transform.isAt(position);
  }

  /**
   * 描画
   */
  render(ctx: CanvasRenderingContext2D, camera?: CameraState): void {
    if (!this._active || !this.renderer) return;
    this.renderer.render(ctx, camera);
  }

  /**
   * オブジェクトがビューポート内にあるかチェック
   */
  isInViewport(camera: CameraState): boolean {
    if (!this.renderer) return true;
    return this.renderer.isInViewport(camera);
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
  getBaseState(): GameObjectState {
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
  abstract getState(): GameObjectState;
}
