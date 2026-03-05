import { EnemyFactory } from './EnemyFactory';
import { ENEMY_TEMPLATES } from '../data/enemyTemplates';
import { createTestEnemyTemplate } from '../__test-helpers__/factories';

describe('EnemyFactory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createFromTemplate', () => {
    it('指定したテンプレートで敵を生成する', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const template = createTestEnemyTemplate({ name: 'テスト敵' });

      const enemy = EnemyFactory.createFromTemplate(3, 4, template, 5);

      expect(enemy.x).toBe(3);
      expect(enemy.y).toBe(4);
      expect(enemy.name).toBe('テスト敵');
    });
  });

  describe('createRandom', () => {
    it('ランダムなテンプレートで敵を生成する', () => {
      // 最初のテンプレートを選択
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const enemy = EnemyFactory.createRandom(0, 0, 1);

      expect(enemy.name).toBe(ENEMY_TEMPLATES[0].name);
    });

    it('異なる乱数で異なるテンプレートを選択する', () => {
      // 最後のテンプレートを選択
      vi.spyOn(Math, 'random').mockReturnValue(0.99);

      const enemy = EnemyFactory.createRandom(0, 0, 1);

      expect(enemy.name).toBe(ENEMY_TEMPLATES[ENEMY_TEMPLATES.length - 1].name);
    });
  });

  describe('createFromCandidates', () => {
    it('候補リストからランダムに敵を生成する', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const enemy = EnemyFactory.createFromCandidates(
        0, 0,
        ['スライム', 'ゴブリン'],
        1
      );

      expect(enemy.name).toBe('スライム');
    });

    it('候補リストの2番目を選択する', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const enemy = EnemyFactory.createFromCandidates(
        0, 0,
        ['スライム', 'ゴブリン'],
        1
      );

      expect(enemy.name).toBe('ゴブリン');
    });

    it('存在しないテンプレート名の場合はフォールバックする', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const enemy = EnemyFactory.createFromCandidates(
        0, 0,
        ['存在しない敵'],
        1
      );

      expect(warnSpy).toHaveBeenCalledWith(
        'Enemy template not found: 存在しない敵, using random template'
      );
      // フォールバックで最初のテンプレートが選ばれる
      expect(enemy.name).toBe(ENEMY_TEMPLATES[0].name);
    });
  });
});
