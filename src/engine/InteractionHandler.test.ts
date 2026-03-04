import { InteractionHandler } from './InteractionHandler';
import { Treasure } from '../models/Treasure';
import { Enemy } from '../models/Enemy';
import { Player } from '../models/Player';
import { createTestEnemyTemplate } from '../__test-helpers__/factories';

describe('InteractionHandler', () => {
  const handler = new InteractionHandler();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('オブジェクトとの接触判定', () => {
    it('宝箱のある座標に移動すると treasure 結果とゴールドが返る', () => {
      const treasure = new Treasure(3, 4, 50);
      const player = new Player(3, 3);

      const result = handler.check([treasure], { x: 3, y: 4 }, player);
      expect(result.type).toBe('treasure');
      if (result.type === 'treasure') {
        expect(result.gold).toBe(50);
      }
    });

    it('敵のいる座標に移動すると battle 結果が返る', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const enemy = new Enemy(3, 4, 1, createTestEnemyTemplate());
      const player = new Player(3, 3);

      const result = handler.check([enemy], { x: 3, y: 4 }, player);
      expect(result.type).toBe('battle');
    });

    it('何もない座標では none が返る', () => {
      const player = new Player(3, 3);
      const result = handler.check([], { x: 3, y: 4 }, player);
      expect(result.type).toBe('none');
    });

    it('開封済み宝箱はインタラクション対象にならない', () => {
      const treasure = new Treasure(3, 4, 50);
      treasure.open();
      const player = new Player(3, 3);

      const result = handler.check([treasure], { x: 3, y: 4 }, player);
      expect(result.type).toBe('none');
    });

    it('死亡した敵はインタラクション対象にならない', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const enemy = new Enemy(3, 4, 1, createTestEnemyTemplate());
      enemy.takeDamage(9999);
      const player = new Player(3, 3);

      const result = handler.check([enemy], { x: 3, y: 4 }, player);
      expect(result.type).toBe('none');
    });
  });
});
