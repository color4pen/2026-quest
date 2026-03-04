import { Enemy } from './Enemy';
import { createTestEnemyTemplate } from '../__test-helpers__/factories';

describe('Enemy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('生成とレベルスケーリング', () => {
    it('プレイヤーレベル5で生成すると、HPがレベル補正で増加する', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const template = createTestEnemyTemplate({ hpMultiplier: 1.0 });
      const enemy = new Enemy(0, 0, 5, template);

      // baseHp = 30 + 5*10 = 80, * 1.0 = 80
      expect(enemy.maxHp).toBe(80);
      expect(enemy.hp).toBe(80);
    });

    it('HP倍率2.0のテンプレートでHPが2倍になる', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const template = createTestEnemyTemplate({ hpMultiplier: 2.0 });
      const enemy = new Enemy(0, 0, 1, template);

      // baseHp = 30 + 1*10 = 40, * 2.0 = 80
      expect(enemy.maxHp).toBe(80);
    });
  });

  describe('ダメージと死亡', () => {
    it('takeDamage でHPが減少する', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const template = createTestEnemyTemplate();
      const enemy = new Enemy(0, 0, 1, template);
      const maxHp = enemy.maxHp;

      enemy.takeDamage(10);
      expect(enemy.hp).toBe(maxHp - 10);
    });

    it('HP 0以下で isDead() が true になる', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const template = createTestEnemyTemplate();
      const enemy = new Enemy(0, 0, 1, template);

      enemy.takeDamage(enemy.maxHp);
      expect(enemy.isDead()).toBe(true);
    });
  });

  describe('インタラクション', () => {
    it('生存中の敵に接触すると battle タイプの結果を返す', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const template = createTestEnemyTemplate();
      const enemy = new Enemy(3, 4, 1, template);

      expect(enemy.canInteract()).toBe(true);
      const result = enemy.onInteract(enemy); // player arg unused
      expect(result.type).toBe('battle');
      expect(result.blockMovement).toBe(true);
    });

    it('死亡した敵には canInteract が false', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const template = createTestEnemyTemplate();
      const enemy = new Enemy(0, 0, 1, template);
      enemy.takeDamage(9999);

      expect(enemy.canInteract()).toBe(false);
    });
  });

  describe('ステート', () => {
    it('getState に必要な情報が含まれる', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const template = createTestEnemyTemplate({ name: 'テストモンスター' });
      const enemy = new Enemy(3, 4, 1, template);

      const state = enemy.getState();
      expect(state.hp).toBe(enemy.hp);
      expect(state.maxHp).toBe(enemy.maxHp);
      expect(state.battleConfig.name).toBe('テストモンスター');
    });
  });
});
