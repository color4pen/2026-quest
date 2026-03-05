import { calculateBattleEndCommands, calculateRewards } from './BattleCalculator';
import { Enemy } from '../../models';

describe('BattleCalculator', () => {
  // テスト用の敵を作成するヘルパー
  function createMockEnemy(overrides: Partial<{
    xpReward: number;
    goldReward: number;
    onDefeat: { key: string; value: number }[];
  }> = {}): Enemy {
    return {
      xpReward: overrides.xpReward ?? 50,
      goldReward: overrides.goldReward ?? 100,
      battleConfig: {
        onDefeat: overrides.onDefeat,
      },
    } as Enemy;
  }

  describe('calculateRewards', () => {
    it('単体の敵から報酬を計算', () => {
      const enemies = [createMockEnemy({ xpReward: 50, goldReward: 100 })];
      const rewards = calculateRewards(enemies);

      expect(rewards.xp).toBe(50);
      expect(rewards.gold).toBe(100);
    });

    it('複数の敵から報酬を合算', () => {
      const enemies = [
        createMockEnemy({ xpReward: 50, goldReward: 100 }),
        createMockEnemy({ xpReward: 30, goldReward: 50 }),
        createMockEnemy({ xpReward: 20, goldReward: 25 }),
      ];
      const rewards = calculateRewards(enemies);

      expect(rewards.xp).toBe(100);
      expect(rewards.gold).toBe(175);
    });

    it('敵がいない場合は0を返す', () => {
      const rewards = calculateRewards([]);

      expect(rewards.xp).toBe(0);
      expect(rewards.gold).toBe(0);
    });
  });

  describe('calculateBattleEndCommands', () => {
    it('勝利時にゴールドとXPのコマンドを返す', () => {
      const enemies = [createMockEnemy({ xpReward: 80, goldReward: 150 })];
      const commands = calculateBattleEndCommands('victory', enemies);

      expect(commands).toContainEqual({ type: 'addGold', amount: 150 });
      expect(commands).toContainEqual({ type: 'distributeXp', xp: 80 });
      expect(commands).toContainEqual({
        type: 'addMessage',
        text: '戦闘に勝利した！',
        messageType: 'combat',
      });
    });

    it('勝利時に戦闘後回復コマンドを含む', () => {
      const enemies = [createMockEnemy()];
      const commands = calculateBattleEndCommands('victory', enemies);

      expect(commands).toContainEqual({ type: 'recoverAllAfterBattle' });
    });

    it('敗北時にゲームオーバーメッセージを返す', () => {
      const commands = calculateBattleEndCommands('defeat', []);

      expect(commands).toContainEqual({
        type: 'addMessage',
        text: '敗北した...ゲームオーバー',
        messageType: 'combat',
      });
      expect(commands).not.toContainEqual(expect.objectContaining({ type: 'addGold' }));
    });

    it('逃走時に逃走メッセージを返す', () => {
      const commands = calculateBattleEndCommands('escape', []);

      expect(commands).toContainEqual({
        type: 'addMessage',
        text: '逃げ出した！',
        messageType: 'combat',
      });
    });

    it('ボス撃破時にゲーム状態変更コマンドを含む', () => {
      const boss = createMockEnemy({
        xpReward: 200,
        goldReward: 500,
        onDefeat: [
          { key: 'boss_forest_defeated', value: 1 },
          { key: 'quest_main', value: 2 },
        ],
      });
      const commands = calculateBattleEndCommands('victory', [boss]);

      expect(commands).toContainEqual({
        type: 'setGameProgress',
        key: 'boss_forest_defeated',
        value: 1,
      });
      expect(commands).toContainEqual({
        type: 'setGameProgress',
        key: 'quest_main',
        value: 2,
      });
    });
  });
});
