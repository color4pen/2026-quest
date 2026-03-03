import type { GameObject } from './GameObject';

/**
 * インタラクション結果
 */
export interface InteractionResult {
  type: 'battle' | 'dialogue' | 'treasure' | 'none';
  data?: unknown;
  blockMovement: boolean;
}

/**
 * Interactableインターフェース
 * プレイヤーと相互作用可能なオブジェクトが実装
 */
export interface Interactable {
  /**
   * プレイヤーがこのオブジェクトと相互作用した時の処理
   * @param player プレイヤーオブジェクト
   * @returns インタラクション結果
   */
  onInteract(player: GameObject): InteractionResult;

  /**
   * インタラクション可能かどうか
   */
  canInteract(): boolean;
}

/**
 * Interactableかどうか判定するType Guard
 */
export function isInteractable(obj: unknown): obj is Interactable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'onInteract' in obj &&
    'canInteract' in obj
  );
}
