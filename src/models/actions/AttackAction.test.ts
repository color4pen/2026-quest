import { AttackAction } from './AttackAction';
import type { ActionContext } from './Action';

describe('AttackAction', () => {
  function createContext(overrides?: Partial<ActionContext>): ActionContext {
    return {
      performer: {
        id: 'hero',
        name: '勇者',
        attack: 20,
        defense: 10,
        isDefending: false,
        isAlive: () => true,
      },
      allies: [],
      enemies: [],
      ...overrides,
    };
  }

  function createTarget(hp: number = 100) {
    let currentHp = hp;
    return {
      name: 'スライム',
      takeDamage: (amount: number) => {
        const damage = Math.min(currentHp, amount);
        currentHp -= damage;
        return damage;
      },
      heal: (amount: number) => {
        currentHp = Math.min(hp, currentHp + amount);
        return amount;
      },
      isDead: () => currentHp <= 0,
      getHp: () => currentHp,
    };
  }

  describe('基本情報', () => {
    it('id は attack', () => {
      const action = new AttackAction();
      expect(action.id).toBe('attack');
    });

    it('name は 攻撃', () => {
      const action = new AttackAction();
      expect(action.name).toBe('攻撃');
    });

    it('type は attack', () => {
      const action = new AttackAction();
      expect(action.type).toBe('attack');
    });

    it('targetType は single_enemy', () => {
      const action = new AttackAction();
      expect(action.getTargetType()).toBe('single_enemy');
    });
  });

  describe('canExecute', () => {
    it('生存していれば実行可能', () => {
      const action = new AttackAction();
      const context = createContext();

      expect(action.canExecute(context)).toBe(true);
    });

    it('死亡していれば実行不可', () => {
      const action = new AttackAction();
      const context = createContext({
        performer: {
          id: 'hero',
          name: '勇者',
          attack: 20,
          defense: 10,
          isDefending: false,
          isAlive: () => false,
        },
      });

      expect(action.canExecute(context)).toBe(false);
    });
  });

  describe('execute', () => {
    it('ターゲットにダメージを与える', () => {
      const action = new AttackAction();
      const context = createContext();
      const target = createTarget(100);

      const result = action.execute(target, context);

      expect(result.success).toBe(true);
      expect(target.getHp()).toBeLessThan(100);
    });

    it('攻撃ログが出力される', () => {
      const action = new AttackAction();
      const context = createContext();
      const target = createTarget(100);

      const result = action.execute(target, context);

      expect(result.logs.length).toBeGreaterThanOrEqual(2);
      expect(result.logs[0].text).toBe('勇者の攻撃！');
      expect(result.logs[0].type).toBe('player');
      expect(result.logs[1].type).toBe('damage');
    });

    it('ターゲットを倒すと倒したログが出る', () => {
      const action = new AttackAction();
      const context = createContext({
        performer: {
          id: 'hero',
          name: '勇者',
          attack: 100, // 高攻撃力
          defense: 10,
          isDefending: false,
          isAlive: () => true,
        },
      });
      const target = createTarget(10); // 低HP

      const result = action.execute(target, context);

      expect(target.isDead()).toBe(true);
      expect(result.logs.some(log => log.text.includes('倒した'))).toBe(true);
    });

    it('ターゲットがない場合は失敗', () => {
      const action = new AttackAction();
      const context = createContext();

      const result = action.execute(null, context);

      expect(result.success).toBe(false);
    });
  });
});
