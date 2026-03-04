import { ItemAction } from './ItemAction';
import type { ActionContext } from './Action';
import { HealItem } from '../items/HealItem';
import { DamageItem } from '../items/DamageItem';
import { CureItem } from '../items/CureItem';

describe('ItemAction', () => {
  const healPotion = new HealItem('potion', 'ポーション', 'HPを30回復', 30);
  const bomb = new DamageItem('bomb', '爆弾', '敵に50ダメージ', 50);
  const antidote = new CureItem('antidote', '解毒薬', '毒を治す', 'poison');

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

  function createAllyTarget(hp: number = 100, maxHp: number = 100) {
    let currentHp = hp;
    let isPoisoned = false;
    return {
      name: '仲間',
      hp: currentHp,
      maxHp,
      heal: (amount: number) => {
        const healed = Math.min(maxHp - currentHp, amount);
        currentHp += healed;
        return healed;
      },
      hasStatusEffect: (type: string) => type === 'poison' && isPoisoned,
      removeStatusEffect: (type: string) => {
        if (type === 'poison') isPoisoned = false;
        return true;
      },
      setPoison: (val: boolean) => { isPoisoned = val; },
      getHp: () => currentHp,
    };
  }

  function createEnemyTarget(hp: number = 100) {
    let currentHp = hp;
    return {
      name: 'ゴブリン',
      takeDamage: (amount: number) => {
        const damage = Math.min(currentHp, amount);
        currentHp -= damage;
        return damage;
      },
      isDead: () => currentHp <= 0,
      getHp: () => currentHp,
    };
  }

  describe('基本情報', () => {
    it('id は item_[アイテムID]', () => {
      const action = new ItemAction(healPotion);
      expect(action.id).toBe('item_potion');
    });

    it('アイテム名が name になる', () => {
      const action = new ItemAction(healPotion);
      expect(action.name).toBe('ポーション');
    });

    it('type は item', () => {
      const action = new ItemAction(healPotion);
      expect(action.type).toBe('item');
    });

    it('回復アイテムの targetType は self', () => {
      const action = new ItemAction(healPotion);
      expect(action.getTargetType()).toBe('self');
    });

    it('ダメージアイテムの targetType は single_enemy', () => {
      const action = new ItemAction(bomb);
      expect(action.getTargetType()).toBe('single_enemy');
    });
  });

  describe('canExecute', () => {
    it('生存していれば実行可能', () => {
      const action = new ItemAction(healPotion);
      const context = createContext();

      expect(action.canExecute(context)).toBe(true);
    });

    it('死亡していれば実行不可', () => {
      const action = new ItemAction(healPotion);
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

  describe('execute - 回復アイテム', () => {
    it('ターゲットを回復する', () => {
      const action = new ItemAction(healPotion);
      const context = createContext();
      const target = createAllyTarget(70, 100); // HP70/100

      const result = action.execute(target, context);

      expect(result.success).toBe(true);
      expect(target.getHp()).toBe(100); // 30回復で100に
    });

    it('回復ログが出力される', () => {
      const action = new ItemAction(healPotion);
      const context = createContext();
      const target = createAllyTarget(70, 100);

      const result = action.execute(target, context);

      expect(result.logs[0].text).toBe('勇者はポーションを使った！');
      expect(result.logs[1].text).toContain('回復した');
      expect(result.logs[1].type).toBe('heal');
    });
  });

  describe('execute - ダメージアイテム', () => {
    it('ターゲットにダメージを与える', () => {
      const action = new ItemAction(bomb);
      const context = createContext();
      const target = createEnemyTarget(100);

      const result = action.execute(target, context);

      expect(result.success).toBe(true);
      expect(target.getHp()).toBe(50); // 50ダメージ
    });

    it('ダメージログが出力される', () => {
      const action = new ItemAction(bomb);
      const context = createContext();
      const target = createEnemyTarget(100);

      const result = action.execute(target, context);

      expect(result.logs[0].text).toBe('勇者は爆弾を使った！');
      expect(result.logs[1].text).toContain('50 のダメージ');
      expect(result.logs[1].type).toBe('damage');
    });

    it('ターゲットを倒すと倒したログが出る', () => {
      const action = new ItemAction(bomb);
      const context = createContext();
      const target = createEnemyTarget(30); // HP30

      const result = action.execute(target, context);

      expect(target.isDead()).toBe(true);
      expect(result.logs.some(log => log.text.includes('倒した'))).toBe(true);
    });

    it('ターゲットがない場合は失敗', () => {
      const action = new ItemAction(bomb);
      const context = createContext();

      const result = action.execute(null, context);

      expect(result.success).toBe(false);
    });
  });

  describe('execute - 治療アイテム', () => {
    it('状態異常を治す', () => {
      const action = new ItemAction(antidote);
      const context = createContext();
      const target = createAllyTarget(100, 100);
      target.setPoison(true);

      const result = action.execute(target, context);

      expect(result.success).toBe(true);
      expect(result.logs[1].text).toContain('毒が治った');
      expect(result.logs[1].type).toBe('heal');
    });

    it('状態異常がない場合は効果なし', () => {
      const action = new ItemAction(antidote);
      const context = createContext();
      const target = createAllyTarget(100, 100);

      const result = action.execute(target, context);

      expect(result.success).toBe(true);
      expect(result.logs[1].text).toBe('しかし効果がなかった...');
    });
  });

  describe('execute - アイテム消費', () => {
    it('itemConsumer が渡されると consumeItem が呼ばれる', () => {
      const action = new ItemAction(healPotion);
      const context = createContext();
      const target = createAllyTarget(70, 100);
      const consumeMock = vi.fn().mockReturnValue(healPotion);
      const itemConsumer = { consumeItem: consumeMock };

      action.execute(target, context, itemConsumer);

      expect(consumeMock).toHaveBeenCalledWith('potion');
    });

    it('アイテムがなくて consumeItem が null を返すと失敗', () => {
      const action = new ItemAction(healPotion);
      const context = createContext();
      const target = createAllyTarget(70, 100);
      const itemConsumer = { consumeItem: () => null };

      const result = action.execute(target, context, itemConsumer);

      expect(result.success).toBe(false);
      expect(result.logs[0].text).toBe('アイテムがない！');
    });
  });
});
