import { DefendAction } from './DefendAction';
import type { ActionContext } from './Action';
import type { Combatant, PlayerCombatant } from '../Combatant';

describe('DefendAction', () => {
  function createMockCombatant(overrides?: Partial<Combatant>): Combatant {
    return {
      id: 'hero',
      name: '勇者',
      hp: 100,
      maxHp: 100,
      attack: 20,
      defense: 10,
      isDefending: false,
      takeDamage: vi.fn().mockReturnValue(10),
      takeDamageRaw: vi.fn(),
      heal: vi.fn().mockReturnValue(10),
      isAlive: () => true,
      isDead: () => false,
      getAvailableActions: () => [],
      ...overrides,
    };
  }

  function createMockPlayerCombatant(overrides?: Partial<PlayerCombatant>): PlayerCombatant {
    return {
      ...createMockCombatant(),
      mp: 30,
      maxMp: 30,
      useMp: vi.fn().mockReturnValue(true),
      canUseSkill: vi.fn().mockReturnValue(true),
      defend: vi.fn(),
      resetDefend: vi.fn(),
      ...overrides,
    };
  }

  function createContext(performer: Combatant = createMockCombatant()): ActionContext {
    return {
      performer,
      allies: [],
      enemies: [],
    };
  }

  describe('基本情報', () => {
    it('id は defend', () => {
      const action = new DefendAction();
      expect(action.id).toBe('defend');
    });

    it('name は 防御', () => {
      const action = new DefendAction();
      expect(action.name).toBe('防御');
    });

    it('type は defend', () => {
      const action = new DefendAction();
      expect(action.type).toBe('defend');
    });

    it('targetType は self', () => {
      const action = new DefendAction();
      expect(action.getTargetType()).toBe('self');
    });
  });

  describe('canExecute', () => {
    it('生存していれば実行可能', () => {
      const action = new DefendAction();
      const context = createContext();

      expect(action.canExecute(context)).toBe(true);
    });

    it('死亡していれば実行不可', () => {
      const action = new DefendAction();
      const context = createContext(createMockCombatant({ isAlive: () => false }));

      expect(action.canExecute(context)).toBe(false);
    });
  });

  describe('execute', () => {
    it('成功を返す', () => {
      const action = new DefendAction();
      const context = createContext();

      const result = action.execute(null, context);

      expect(result.success).toBe(true);
    });

    it('防御ログが出力される', () => {
      const action = new DefendAction();
      const context = createContext();

      const result = action.execute(null, context);

      expect(result.logs.length).toBe(1);
      expect(result.logs[0].text).toBe('勇者は防御の構えをとった！');
      expect(result.logs[0].type).toBe('player');
    });

    it('PlayerCombatant の場合 defend() が呼ばれる', () => {
      const action = new DefendAction();
      const performer = createMockPlayerCombatant();
      const context = createContext(performer);

      action.execute(null, context);

      expect(performer.defend).toHaveBeenCalled();
    });
  });
});
