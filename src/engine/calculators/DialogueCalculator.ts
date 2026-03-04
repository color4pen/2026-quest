/**
 * 会話関連のロジック（純粋関数）
 */

import { GameCommand, CommandResult, successResult, failureResult } from './types';

/**
 * 宿屋の回復処理のコマンドを生成
 */
export function calculateHealCommands(
  cost: number,
  currentGold: number
): CommandResult {
  if (currentGold < cost) {
    return failureResult('ゴールドが足りない！');
  }

  const commands: GameCommand[] = [
    { type: 'spendGold', amount: cost },
    { type: 'fullHealAll' },
    { type: 'addMessage', text: 'パーティー全員のHPとMPが全回復した！', messageType: 'loot' },
  ];

  return successResult('パーティー全員のHPとMPが全回復した！', commands);
}
