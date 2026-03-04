import { HealItem } from './HealItem';
import { CureItem } from './CureItem';
import { DamageItem } from './DamageItem';
import type { ItemUseContext } from './Item';

describe('HealItem — 薬草系アイテム', () => {
  const potion = new HealItem('potion', 'ポーション', 'HPを50回復', 50);

  describe('HPが減っているキャラに使用', () => {
    it('ポーション(回復量50)をHP 50/100のキャラに使うと、50回復してHP 100になる', () => {
      const ctx: ItemUseContext = { targetHp: 50, targetMaxHp: 100, targetStatusEffects: [], isInBattle: false };
      const result = potion.use(ctx);
      expect(result.success).toBe(true);
      expect(result.healedAmount).toBe(50);
    });

    it('HP 90/100のキャラに使うと、10だけ回復して100になる', () => {
      const ctx: ItemUseContext = { targetHp: 90, targetMaxHp: 100, targetStatusEffects: [], isInBattle: false };
      const result = potion.use(ctx);
      expect(result.success).toBe(true);
      expect(result.healedAmount).toBe(10);
    });
  });

  describe('HP満タンのキャラへの使用制限', () => {
    const fullHpCtx: ItemUseContext = { targetHp: 100, targetMaxHp: 100, targetStatusEffects: [], isInBattle: false };

    it('canUse が false を返す', () => {
      expect(potion.canUse(fullHpCtx)).toBe(false);
    });

    it('getCannotUseReason が「HPは満タンです」を返す', () => {
      expect(potion.getCannotUseReason(fullHpCtx)).toBe('HPは満タンです');
    });
  });

  describe('使用可能場面', () => {
    it('メニューから使用可能', () => {
      expect(potion.canUseInMenu()).toBe(true);
    });

    it('戦闘中も使用可能', () => {
      expect(potion.canUseInBattle()).toBe(true);
    });

    it('味方対象アイテムである', () => {
      expect(potion.isTargetAlly()).toBe(true);
      expect(potion.isTargetEnemy()).toBe(false);
    });
  });
});

describe('CureItem — 状態異常回復アイテム', () => {
  const antidote = new CureItem('antidote', 'どくけし草', '毒状態を治す', 'poison');

  describe('毒状態のキャラに解毒剤を使用', () => {
    it('毒を解除し、curedEffect に "poison" を返す', () => {
      const ctx: ItemUseContext = { targetHp: 50, targetMaxHp: 100, targetStatusEffects: ['poison'], isInBattle: false };
      const result = antidote.use(ctx);
      expect(result.success).toBe(true);
      expect(result.curedEffect).toBe('poison');
    });
  });

  describe('毒でないキャラに解毒剤を使用', () => {
    const healthyCtx: ItemUseContext = { targetHp: 50, targetMaxHp: 100, targetStatusEffects: [], isInBattle: false };

    it('canUse が false を返す', () => {
      expect(antidote.canUse(healthyCtx)).toBe(false);
    });

    it('「毒ではありません」と表示される', () => {
      expect(antidote.getCannotUseReason(healthyCtx)).toBe('毒ではありません');
    });
  });
});

describe('DamageItem — 攻撃アイテム', () => {
  const bomb = new DamageItem('bomb', '爆弾', '敵に50ダメージ', 50);

  describe('戦闘中に使用', () => {
    it('爆弾(ダメージ50)を使うと damageDealt: 50 を返す', () => {
      const ctx: ItemUseContext = { targetHp: 0, targetMaxHp: 0, targetStatusEffects: [], isInBattle: true };
      const result = bomb.use(ctx);
      expect(result.success).toBe(true);
      expect(result.damageDealt).toBe(50);
    });
  });

  describe('フィールドでは使用不可', () => {
    it('canUseInMenu が false', () => {
      expect(bomb.canUseInMenu()).toBe(false);
    });

    it('「戦闘中のみ使用できます」と表示される', () => {
      const ctx: ItemUseContext = { targetHp: 0, targetMaxHp: 0, targetStatusEffects: [], isInBattle: false };
      expect(bomb.getCannotUseReason(ctx)).toBe('このアイテムは戦闘中のみ使用できます');
    });

    it('敵対象アイテムである', () => {
      expect(bomb.isTargetEnemy()).toBe(true);
      expect(bomb.isTargetAlly()).toBe(false);
    });
  });
});
