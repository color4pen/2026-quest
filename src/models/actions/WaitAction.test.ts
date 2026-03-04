import { WaitAction } from './WaitAction';
import type { ActionContext } from './Action';

describe('WaitAction', () => {
  function createContext(): ActionContext {
    return {
      performer: {
        id: 'goblin',
        name: 'ゴブリン',
        hp: 50,
        maxHp: 50,
        attack: 10,
        defense: 5,
        isDefending: false,
        takeDamage: vi.fn(),
        takeDamageRaw: vi.fn(),
        heal: vi.fn(),
        isAlive: () => true,
        isDead: () => false,
        getAvailableActions: () => [],
      },
      allies: [],
      enemies: [],
    };
  }

  describe('基本情報', () => {
    it('id は wait', () => {
      const action = new WaitAction();
      expect(action.id).toBe('wait');
    });

    it('name は 様子見', () => {
      const action = new WaitAction();
      expect(action.name).toBe('様子見');
    });

    it('targetType は none', () => {
      const action = new WaitAction();
      expect(action.getTargetType()).toBe('none');
    });
  });

  describe('execute', () => {
    it('様子見ログを出力する', () => {
      const action = new WaitAction();
      const context = createContext();

      const result = action.execute(null, context);

      expect(result.success).toBe(true);
      expect(result.logs[0].text).toBe('ゴブリンは様子を見ている...');
      expect(result.logs[0].type).toBe('enemy');
    });
  });
});
