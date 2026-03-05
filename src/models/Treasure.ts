import { Position, MAP_WIDTH, MAP_HEIGHT } from '../types/game';
import {
  GameEntity,
  GameEntityState,
  Interactable,
  InteractionResult,
} from './base';

/**
 * 宝箱状態（React用）
 */
export interface TreasureState extends GameEntityState {
  gold: number;
  opened: boolean;
}

/**
 * 宝箱クラス
 * GameEntityを継承し、Interactableを実装。
 * 描画ロジックは持たない（プレゼンテーション層が担当）。
 */
export class Treasure extends GameEntity implements Interactable {
  public gold: number;
  public opened: boolean;

  constructor(x: number, y: number, gold?: number) {
    super(x, y);

    this.gold = gold ?? 20 + Math.floor(Math.random() * 50);
    this.opened = false;
  }

  // ==================== Interactable実装 ====================

  /**
   * プレイヤーとの相互作用（宝箱を開ける）
   */
  onInteract(_player: GameEntity): InteractionResult {
    if (this.opened) {
      return {
        type: 'none',
        blockMovement: false,
      };
    }

    const gold = this.open();
    return {
      type: 'treasure',
      data: { gold },
      blockMovement: false,  // 宝箱は移動をブロックしない
    };
  }

  /**
   * インタラクション可能か（未開封の場合のみ）
   */
  canInteract(): boolean {
    return !this.opened && this._active;
  }

  // ==================== 宝箱操作 ====================

  /**
   * 宝箱を開ける
   * @returns 獲得したゴールド（既に開いている場合は0）
   */
  open(): number {
    if (this.opened) {
      return 0;
    }

    this.opened = true;
    return this.gold;
  }

  /**
   * 開封済みか判定
   */
  isOpened(): boolean {
    return this.opened;
  }

  /**
   * 未開封でその座標にあるか判定
   */
  canBeOpenedAt(position: Position): boolean {
    return this.isAt(position) && !this.opened;
  }

  // ==================== 状態管理 ====================

  /**
   * 状態を取得（React用）
   */
  getState(): TreasureState {
    return {
      ...this.getBaseState(),
      gold: this.gold,
      opened: this.opened,
    };
  }

  // ==================== ファクトリ ====================

  /**
   * 複数の宝箱を生成
   */
  static spawnTreasures(
    count: number,
    excludePositions: Position[]
  ): Treasure[] {
    const treasures: Treasure[] = [];
    const occupied = new Set(excludePositions.map(p => `${p.x},${p.y}`));

    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      let attempts = 0;
      const maxAttempts = 100;

      do {
        x = Math.floor(Math.random() * MAP_WIDTH);
        y = Math.floor(Math.random() * MAP_HEIGHT);
        attempts++;
      } while (attempts < maxAttempts && occupied.has(`${x},${y}`));

      if (attempts < maxAttempts) {
        occupied.add(`${x},${y}`);
        treasures.push(new Treasure(x, y));
      }
    }

    return treasures;
  }
}
