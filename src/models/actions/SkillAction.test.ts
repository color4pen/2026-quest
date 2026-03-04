import { SkillAction } from './SkillAction';
import type { ActionContext } from './Action';
import type { Combatant, PlayerCombatant } from '../Combatant';
import type { SkillDefinition } from '../../types/battle';

describe('SkillAction', () => {
  const attackSkill: SkillDefinition = {
    id: 'fire',
    name: 'ファイア',
    description: '炎で攻撃',
    mpCost: 5,
    power: 1.5,
    type: 'attack',
    target: 'enemy',
  };

  const healSkill: SkillDefinition = {
    id: 'heal',
    name: 'ヒール',
    description: 'HPを回復',
    mpCost: 3,
    power: 30,
    type: 'heal',
    target: 'self',
  };

  function createMockCombatant(overrides?: Partial<Combatant>): Combatant {
    return {
      id: 'mage',
      name: '魔法使い',
      hp: 100,
      maxHp: 100,
      attack: 15,
      defense: 5,
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

  function createTarget(hp: number = 100): Combatant & { currentHp: number } {
    let currentHp = hp;
    const maxHp = hp;
    return {
      id: 'enemy',
      name: 'ゴブリン',
      get hp() { return currentHp; },
      get currentHp() { return currentHp; },
      maxHp,
      attack: 10,
      defense: 5,
      isDefending: false,
      takeDamage: (amount: number) => {
        const damage = Math.min(currentHp, amount);
        currentHp -= damage;
        return damage;
      },
      takeDamageRaw: (amount: number) => { currentHp -= amount; },
      heal: (amount: number) => {
        const healed = Math.min(maxHp - currentHp, amount);
        currentHp += healed;
        return healed;
      },
      isAlive: () => currentHp > 0,
      isDead: () => currentHp <= 0,
      getAvailableActions: () => [],
    };
  }

  describe('基本情報', () => {
    it('攻撃スキルの id は skill_[スキルID]', () => {
      const action = new SkillAction(attackSkill);
      expect(action.id).toBe('skill_fire');
    });

    it('スキル名が name になる', () => {
      const action = new SkillAction(attackSkill);
      expect(action.name).toBe('ファイア');
    });

    it('type は skill', () => {
      const action = new SkillAction(attackSkill);
      expect(action.type).toBe('skill');
    });

    it('攻撃スキルの targetType は single_enemy', () => {
      const action = new SkillAction(attackSkill);
      expect(action.getTargetType()).toBe('single_enemy');
    });

    it('回復スキルの targetType は self', () => {
      const action = new SkillAction(healSkill);
      expect(action.getTargetType()).toBe('self');
    });
  });

  describe('canExecute', () => {
    it('生存していれば実行可能（Combatant）', () => {
      const action = new SkillAction(attackSkill);
      const context = createContext();

      expect(action.canExecute(context)).toBe(true);
    });

    it('死亡していれば実行不可', () => {
      const action = new SkillAction(attackSkill);
      const context = createContext(createMockCombatant({ isAlive: () => false }));

      expect(action.canExecute(context)).toBe(false);
    });

    it('PlayerCombatant で MP が足りなければ実行不可', () => {
      const action = new SkillAction(attackSkill);
      const performer = createMockPlayerCombatant({
        canUseSkill: vi.fn().mockReturnValue(false),
      });
      const context = createContext(performer);

      expect(action.canExecute(context)).toBe(false);
    });

    it('PlayerCombatant で MP が足りれば実行可能', () => {
      const action = new SkillAction(attackSkill);
      const performer = createMockPlayerCombatant({
        canUseSkill: vi.fn().mockReturnValue(true),
      });
      const context = createContext(performer);

      expect(action.canExecute(context)).toBe(true);
    });
  });

  describe('execute - 攻撃スキル', () => {
    it('ターゲットにダメージを与える', () => {
      const action = new SkillAction(attackSkill);
      const context = createContext();
      const target = createTarget(100);

      const result = action.execute(target, context);

      expect(result.success).toBe(true);
      expect(target.isDead() || target.hp < 100).toBe(true);
    });

    it('スキル名のログが出力される', () => {
      const action = new SkillAction(attackSkill);
      const context = createContext();
      const target = createTarget(100);

      const result = action.execute(target, context);

      expect(result.logs[0].text).toBe('魔法使いのファイア！');
      expect(result.logs[0].type).toBe('player');
    });

    it('ターゲットを倒すと倒したログが出る', () => {
      const action = new SkillAction(attackSkill);
      const performer = createMockCombatant({ attack: 100 }); // 高攻撃力
      const context = createContext(performer);
      const target = createTarget(10);

      const result = action.execute(target, context);

      expect(target.isDead()).toBe(true);
      expect(result.logs.some(log => log.text.includes('倒した'))).toBe(true);
    });

    it('ターゲットがない場合は失敗', () => {
      const action = new SkillAction(attackSkill);
      const context = createContext();

      const result = action.execute(null, context);

      expect(result.success).toBe(false);
    });
  });

  describe('execute - 回復スキル', () => {
    it('ターゲットを回復する', () => {
      const action = new SkillAction(healSkill);
      const context = createContext();
      const target = createTarget(100);
      target.takeDamage(50); // HP を 50 に

      const result = action.execute(target, context);

      expect(result.success).toBe(true);
      // heal が呼ばれたことを確認
      expect(result.logs.some(log => log.text.includes('回復'))).toBe(true);
    });

    it('回復ログが出力される', () => {
      const action = new SkillAction(healSkill);
      const context = createContext();
      const target = createTarget(100);
      target.takeDamage(50);

      const result = action.execute(target, context);

      expect(result.logs[0].text).toBe('魔法使いのヒール！');
      expect(result.logs[1].text).toContain('回復した');
      expect(result.logs[1].type).toBe('heal');
    });
  });

  describe('execute - MP消費（PlayerCombatant）', () => {
    it('PlayerCombatant の useMp が呼ばれる', () => {
      const action = new SkillAction(attackSkill);
      const useMpMock = vi.fn().mockReturnValue(true);
      const performer = createMockPlayerCombatant({ useMp: useMpMock });
      const context = createContext(performer);
      const target = createTarget(100);

      action.execute(target, context);

      expect(useMpMock).toHaveBeenCalledWith(5); // attackSkill.mpCost
    });

    it('MP不足で useMp が false を返すと失敗', () => {
      const action = new SkillAction(attackSkill);
      const performer = createMockPlayerCombatant({
        useMp: vi.fn().mockReturnValue(false),
      });
      const context = createContext(performer);
      const target = createTarget(100);

      const result = action.execute(target, context);

      expect(result.success).toBe(false);
      expect(result.logs[0].text).toBe('MPが足りない！');
    });
  });
});
