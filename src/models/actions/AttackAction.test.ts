import { AttackAction } from './AttackAction';
import type { ActionContext } from './Action';
import type { Combatant, PlayerCombatant } from '../Combatant';

describe('AttackAction', () => {
  // プレイヤー側の performer（isPlayerCombatant = true）
  function createPlayerPerformer(overrides?: Partial<PlayerCombatant>): PlayerCombatant {
    return {
      id: 'hero',
      name: '勇者',
      hp: 100,
      maxHp: 100,
      mp: 30,
      maxMp: 30,
      attack: 20,
      defense: 10,
      isDefending: false,
      takeDamage: vi.fn().mockReturnValue(10),
      takeDamageRaw: vi.fn(),
      heal: vi.fn().mockReturnValue(10),
      isAlive: () => true,
      isDead: () => false,
      getAvailableActions: () => [],
      useMp: vi.fn().mockReturnValue(true),
      canUseSkill: vi.fn().mockReturnValue(true),
      defend: vi.fn(),
      resetDefend: vi.fn(),
      ...overrides,
    };
  }

  // 敵側の performer（isPlayerCombatant = false）
  function createEnemyPerformer(overrides?: Partial<Combatant>): Combatant {
    return {
      id: 'goblin',
      name: 'ゴブリン',
      hp: 50,
      maxHp: 50,
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

  function createContext(performer?: Combatant): ActionContext {
    return {
      performer: performer ?? createPlayerPerformer(),
      allies: [],
      enemies: [],
    };
  }

  function createTarget(hp: number = 100, options: { isDefending?: boolean } = {}) {
    let currentHp = hp;
    return {
      name: 'スライム',
      isDefending: options.isDefending ?? false,
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
      isAlive: () => currentHp > 0,
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
      const context = createContext(createPlayerPerformer({ isAlive: () => false }));

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
      const context = createContext(createPlayerPerformer({ attack: 100 }));
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

    it('敵が攻撃するとログタイプが enemy になる', () => {
      const action = new AttackAction();
      const context = createContext(createEnemyPerformer());
      const target = createTarget(100);

      const result = action.execute(target, context);

      expect(result.logs[0].type).toBe('enemy');
    });

    it('防御中のターゲットには防御ログが出る', () => {
      const action = new AttackAction();
      const context = createContext();
      const target = createTarget(100, { isDefending: true });

      const result = action.execute(target, context);

      expect(result.logs[0].text).toContain('防御した');
    });
  });

  describe('オプション', () => {
    it('name オプションで攻撃名を変更できる', () => {
      const action = new AttackAction({ name: '強攻撃' });
      expect(action.name).toBe('強攻撃');

      const context = createContext();
      const target = createTarget(100);
      const result = action.execute(target, context);

      expect(result.logs[0].text).toBe('勇者の強攻撃！');
    });

    it('multiplier オプションでダメージ倍率を変更できる', () => {
      const normalAction = new AttackAction();
      const powerAction = new AttackAction({ multiplier: 2.0 });
      const context = createContext(createPlayerPerformer({ attack: 10 }));

      const normalTarget = createTarget(1000);
      const powerTarget = createTarget(1000);

      normalAction.execute(normalTarget, context);
      powerAction.execute(powerTarget, context);

      // 2倍ダメージなので、powerTarget の方が多く減っている
      expect(powerTarget.getHp()).toBeLessThan(normalTarget.getHp());
    });

    it('poisonChance オプションで毒を付与できる', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1); // 毒付与成功

      const action = new AttackAction({ poisonChance: 0.3 });
      const context = createContext(createEnemyPerformer());
      const target = {
        ...createTarget(100),
        isPoisoned: false,
        poison: vi.fn(),
      };

      const result = action.execute(target, context);

      expect(target.poison).toHaveBeenCalled();
      expect(result.logs.some(l => l.text.includes('毒を受けた'))).toBe(true);

      vi.restoreAllMocks();
    });

    it('既に毒状態のターゲットには毒を付与しない', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1);

      const action = new AttackAction({ poisonChance: 0.3 });
      const context = createContext(createEnemyPerformer());
      const target = {
        ...createTarget(100),
        isPoisoned: true,
        poison: vi.fn(),
      };

      action.execute(target, context);

      expect(target.poison).not.toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });
});
