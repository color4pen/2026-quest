import { Direction } from '../types/game';
import { GameObject, GameObjectState, PlayerRenderer } from '../components/game';

/**
 * プレイヤー状態（React用）
 * 移動・描画に必要な情報のみ
 */
export type PlayerState = GameObjectState;

/**
 * プレイヤークラス
 * GameObjectを継承し、マップ上での移動・描画のみを担当。
 * 戦闘・ステータス管理は Party/PartyMember が担う。
 */
export class Player extends GameObject {
  constructor(x: number = 5, y: number = 5) {
    super(x, y);
    this.renderer = new PlayerRenderer(this.transform);
  }

  /**
   * 指定した方向に移動した場合の座標を計算
   */
  getNextPosition(direction: Direction) {
    return this.transform.getNextPosition(direction);
  }

  /**
   * 移動を実行
   */
  moveTo(position: { x: number; y: number }): void {
    this.transform.moveTo(position);
  }

  /**
   * 座標を直接設定（マップ切り替え時など）
   */
  setPosition(x: number, y: number): void {
    this.transform.setPosition(x, y);
  }

  /**
   * プレイヤーをリセット
   */
  reset(x: number = 5, y: number = 5): void {
    this.transform.setPosition(x, y);
    this._active = true;
  }

  /**
   * 状態を取得（React用）
   */
  getState(): PlayerState {
    return this.getBaseState();
  }
}
