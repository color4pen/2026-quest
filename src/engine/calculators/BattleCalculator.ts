/**
 * バトル関連のロジック（純粋関数）
 */

import { BattleResult } from '../../types/game';
import { Enemy } from '../../models';
import { GameCommand } from './types';
import { StateKey } from '../../data/stateKeys';

/**
 * 敵から得られる報酬を計算
 */
export function calculateRewards(enemies: Enemy[]): { xp: number; gold: number } {
  return {
    xp: enemies.reduce((sum, e) => sum + e.xpReward, 0),
    gold: enemies.reduce((sum, e) => sum + e.goldReward, 0),
  };
}

/**
 * バトル終了時のコマンドを生成
 */
export function calculateBattleEndCommands(
  result: BattleResult,
  enemies: Enemy[]
): GameCommand[] {
  if (result === 'defeat') {
    return [
      { type: 'addMessage', text: '敗北した...ゲームオーバー', messageType: 'combat' },
    ];
  }

  if (result === 'escape') {
    return [
      { type: 'addMessage', text: '逃げ出した！', messageType: 'combat' },
    ];
  }

  // 勝利時
  const { xp, gold } = calculateRewards(enemies);

  const commands: GameCommand[] = [
    { type: 'addMessage', text: '戦闘に勝利した！', messageType: 'combat' },
    { type: 'addMessage', text: `${xp} XP と ${gold} ゴールドを獲得！`, messageType: 'loot' },
    { type: 'addGold', amount: gold },
    { type: 'distributeXp', xp },
  ];

  // 撃破時の状態変更（ボス撃破フラグなど）
  for (const enemy of enemies) {
    const onDefeat = enemy.battleConfig.onDefeat;
    if (onDefeat) {
      for (const change of onDefeat) {
        commands.push({
          type: 'setGameState',
          key: change.key as StateKey,
          value: change.value,
        });
      }
    }
  }

  // 戦闘後回復
  commands.push({ type: 'recoverAllAfterBattle' });

  return commands;
}
