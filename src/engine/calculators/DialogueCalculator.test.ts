import { calculateHealCommands } from './DialogueCalculator';

describe('DialogueCalculator', () => {
  describe('calculateHealCommands', () => {
    it('十分なゴールドがあれば回復成功', () => {
      const result = calculateHealCommands(100, 500);

      expect(result.success).toBe(true);
      expect(result.commands).toContainEqual({ type: 'spendGold', amount: 100 });
      expect(result.commands).toContainEqual({ type: 'fullHealAll' });
      expect(result.commands).toContainEqual({
        type: 'addMessage',
        text: 'パーティー全員のHPとMPが全回復した！',
        messageType: 'loot',
      });
    });

    it('ゴールド不足で回復失敗', () => {
      const result = calculateHealCommands(100, 50);

      expect(result.success).toBe(false);
      expect(result.message).toBe('ゴールドが足りない！');
      expect(result.commands).toHaveLength(0);
    });

    it('ちょうどのゴールドで回復成功', () => {
      const result = calculateHealCommands(100, 100);

      expect(result.success).toBe(true);
    });

    it('無料の回復でも成功', () => {
      const result = calculateHealCommands(0, 0);

      expect(result.success).toBe(true);
      expect(result.commands).toContainEqual({ type: 'spendGold', amount: 0 });
    });
  });
});
