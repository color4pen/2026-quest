import { ExperienceManager } from './ExperienceManager';

describe('ExperienceManager', () => {
  describe('初期状態', () => {
    it('レベル1、経験値0、次レベル100で初期化される', () => {
      const manager = new ExperienceManager();

      expect(manager.level).toBe(1);
      expect(manager.xp).toBe(0);
      expect(manager.xpToNext).toBe(100);
    });
  });

  describe('経験値獲得', () => {
    it('レベルアップしない場合はnullを返す', () => {
      const manager = new ExperienceManager();

      const result = manager.gainXp(50);

      expect(result).toBeNull();
      expect(manager.xp).toBe(50);
      expect(manager.level).toBe(1);
    });

    it('レベルアップする場合は結果を返す', () => {
      const manager = new ExperienceManager();

      const result = manager.gainXp(100);

      expect(result).not.toBeNull();
      expect(result!.newLevel).toBe(2);
      expect(result!.hpBonus).toBe(20);
      expect(result!.mpBonus).toBe(10);
      expect(result!.attackBonus).toBe(5);
    });

    it('レベルアップ後、余剰経験値が残る', () => {
      const manager = new ExperienceManager();

      manager.gainXp(120);

      expect(manager.level).toBe(2);
      expect(manager.xp).toBe(20);
    });

    it('レベルアップ後、次レベルに必要な経験値が増加する', () => {
      const manager = new ExperienceManager();

      manager.gainXp(100);

      expect(manager.xpToNext).toBe(150); // 100 * 1.5
    });
  });

  describe('カスタムレベルアップボーナス', () => {
    it('カスタムボーナスを指定できる', () => {
      const manager = new ExperienceManager({ hp: 30, mp: 15, attack: 8 });

      const result = manager.gainXp(100);

      expect(result!.hpBonus).toBe(30);
      expect(result!.mpBonus).toBe(15);
      expect(result!.attackBonus).toBe(8);
    });

    it('部分的なカスタムボーナスを指定できる', () => {
      const manager = new ExperienceManager({ hp: 50 });

      const result = manager.gainXp(100);

      expect(result!.hpBonus).toBe(50);
      expect(result!.mpBonus).toBe(10); // デフォルト
      expect(result!.attackBonus).toBe(5); // デフォルト
    });
  });

  describe('状態復元', () => {
    it('セーブデータから状態を復元できる', () => {
      const manager = new ExperienceManager();

      manager.restoreState(10, 500, 1000);

      expect(manager.level).toBe(10);
      expect(manager.xp).toBe(500);
      expect(manager.xpToNext).toBe(1000);
    });
  });
});
