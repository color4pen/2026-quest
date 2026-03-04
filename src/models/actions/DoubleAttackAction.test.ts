import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DoubleAttackAction } from './DoubleAttackAction';
import type { ActionContext } from './Action';

describe('DoubleAttackAction', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  const createContext = (overrides?: Partial<ActionContext['performer']>): ActionContext => ({
    performer: {
      id: 'hero',
      name: 'テスト勇者',
      attack: 10,
      defense: 5,
      isDefending: false,
      isAlive: () => true,
      ...overrides,
    },
    allies: [],
    enemies: [],
  });

  const createTarget = (hp: number = 100) => {
    let currentHp = hp;
    return {
      name: 'スライム',
      takeDamage: (amount: number) => {
        const actual = Math.min(amount, currentHp);
        currentHp -= actual;
        return actual;
      },
      isDead: () => currentHp <= 0,
      get hp() { return currentHp; },
    };
  };

  it('基本情報が正しい', () => {
    const action = new DoubleAttackAction();
    expect(action.id).toBe('double_attack');
    expect(action.name).toBe('連続攻撃');
    expect(action.type).toBe('attack');
    expect(action.getTargetType()).toBe('single_enemy');
  });

  it('生存中は実行可能', () => {
    const action = new DoubleAttackAction();
    const context = createContext();
    expect(action.canExecute(context)).toBe(true);
  });

  it('死亡中は実行不可', () => {
    const action = new DoubleAttackAction();
    const context = createContext({ isAlive: () => false });
    expect(action.canExecute(context)).toBe(false);
  });

  it('1撃目を実行し、2撃目を followUpActions で返す', () => {
    const action = new DoubleAttackAction();
    const context = createContext({ attack: 10 });
    const target = createTarget(100);

    const result = action.execute(target, context);

    expect(result.success).toBe(true);
    expect(result.logs[0].text).toBe('テスト勇者の連続攻撃！');
    // 1撃目のダメージログ
    const damageLogs = result.logs.filter(l => l.type === 'damage');
    expect(damageLogs.length).toBe(1);
    // 2撃目は followUpActions にある
    expect(result.followUpActions).toBeDefined();
    expect(result.followUpActions!.length).toBe(1);
  });

  it('followUpActions の2撃目がダメージを与える', () => {
    const action = new DoubleAttackAction();
    const context = createContext({ attack: 10 });
    const target = createTarget(100);

    const result = action.execute(target, context);
    const followUp = result.followUpActions![0];
    const followUpResult = followUp.execute(target, context);

    expect(followUpResult.success).toBe(true);
    const damageLogs = followUpResult.logs.filter(l => l.type === 'damage');
    expect(damageLogs.length).toBe(1);
  });

  it('1回目の攻撃で倒した場合 followUpActions は返さない', () => {
    const action = new DoubleAttackAction();
    const context = createContext({ attack: 100 }); // 高攻撃力
    const target = createTarget(5); // 低HP

    const result = action.execute(target, context);

    expect(result.success).toBe(true);
    // ダメージログは1回のみ
    const damageLogs = result.logs.filter(l => l.type === 'damage');
    expect(damageLogs.length).toBe(1);
    // 倒したログが出る
    expect(result.logs.some(l => l.text.includes('を倒した'))).toBe(true);
    // followUpActions がない
    expect(result.followUpActions).toBeUndefined();
  });

  it('ターゲットがいない場合は失敗', () => {
    const action = new DoubleAttackAction();
    const context = createContext();

    const result = action.execute(null, context);

    expect(result.success).toBe(false);
    expect(result.logs[0].text).toBe('ターゲットがいない！');
  });
});
