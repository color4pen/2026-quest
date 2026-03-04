/**
 * GameEngine が実行するコマンドの型定義
 * ハンドラは純粋関数としてコマンドを返し、GameEngine が実行する
 */

import { MessageType } from '../../types/game';
import { StateKey } from '../../data/stateKeys';

// ==================== コマンド型 ====================

export type GameCommand =
  // メッセージ
  | { type: 'addMessage'; text: string; messageType: MessageType }
  // ゴールド
  | { type: 'addGold'; amount: number }
  | { type: 'spendGold'; amount: number }
  // 経験値
  | { type: 'distributeXp'; xp: number }
  // ゲーム状態フラグ
  | { type: 'setGameState'; key: StateKey; value: number }
  // アイテム
  | { type: 'addItem'; itemId: string; quantity: number }
  // パーティ
  | { type: 'fullHealAll' }
  | { type: 'recoverAllAfterBattle' };

// ==================== 結果型 ====================

/**
 * 操作の結果（成功/失敗 + コマンド）
 */
export interface CommandResult {
  success: boolean;
  message: string;
  commands: GameCommand[];
}

/**
 * 成功結果を作成
 */
export function successResult(message: string, commands: GameCommand[] = []): CommandResult {
  return { success: true, message, commands };
}

/**
 * 失敗結果を作成
 */
export function failureResult(message: string): CommandResult {
  return { success: false, message, commands: [] };
}
