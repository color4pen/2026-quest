import { SkillAction } from './SkillAction';
import type { ActionContext } from './Action';
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

  function createContext(overrides?: Partial<ActionContext>): ActionContext {
    return {
      performer: {
        id: 'mage',
        name: '魔法使い',
        attack: 15,
        defense: 5,
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
    const maxHp = hp;
    return {
      name: 'ゴブリン',
      takeDamage: (amount: number) => {
        const damage = Math.min(currentHp, amount);
        currentHp -= damage;
        return damage;
      },
      heal: (amount: number) => {
        const healed = Math.min(maxHp - currentHp, amount);
        currentHp += healed;
        return healed;
      },
      isDead: () => currentHp <= 0,
      getHp: () => currentHp,
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
    it('生存していれば実行可能', () => {
      const action = new SkillAction(attackSkill);
      const context = createContext();

      expect(action.canExecute(context)).toBe(true);
    });

    it('死亡していれば実行不可', () => {
      const action = new SkillAction(attackSkill);
      const context = createContext({
        performer: {
          id: 'mage',
          name: '魔法使い',
          attack: 15,
          defense: 5,
          isDefending: false,
          isAlive: () => false,
        },
      });

      expect(action.canExecute(context)).toBe(false);
    });

    it('MPが足りなければ実行不可（mpCheckerあり）', () => {
      const action = new SkillAction(attackSkill);
      const context = createContext();
      const mpChecker = { canUseSkill: () => false };

      expect(action.canExecute(context, mpChecker)).toBe(false);
    });

    it('MPが足りれば実行可能（mpCheckerあり）', () => {
      const action = new SkillAction(attackSkill);
      const context = createContext();
      const mpChecker = { canUseSkill: () => true };

      expect(action.canExecute(context, mpChecker)).toBe(true);
    });
  });

  describe('execute - 攻撃スキル', () => {
    it('ターゲットにダメージを与える', () => {
      const action = new SkillAction(attackSkill);
      const context = createContext();
      const target = createTarget(100);

      const result = action.execute(target, context);

      expect(result.success).toBe(true);
      expect(target.getHp()).toBeLessThan(100);
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
      const context = createContext({
        performer: {
          id: 'mage',
          name: '魔法使い',
          attack: 100, // 高攻撃力
          defense: 5,
          isDefending: false,
          isAlive: () => true,
        },
      });
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
      expect(target.getHp()).toBeGreaterThan(50);
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

  describe('execute - MP消費', () => {
    it('mpUser が渡されると useMp が呼ばれる', () => {
      const action = new SkillAction(attackSkill);
      const context = createContext();
      const target = createTarget(100);
      const useMpMock = vi.fn().mockReturnValue(true);
      const mpUser = { useMp: useMpMock };

      action.execute(target, context, mpUser);

      expect(useMpMock).toHaveBeenCalledWith(5); // attackSkill.mpCost
    });

    it('MP不足で useMp が false を返すと失敗', () => {
      const action = new SkillAction(attackSkill);
      const context = createContext();
      const target = createTarget(100);
      const mpUser = { useMp: () => false };

      const result = action.execute(target, context, mpUser);

      expect(result.success).toBe(false);
      expect(result.logs[0].text).toBe('MPが足りない！');
    });
  });
});
