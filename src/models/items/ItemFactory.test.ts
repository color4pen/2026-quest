import { ItemFactory } from './ItemFactory';
import { HealItem } from './HealItem';
import { EquipmentItem } from './EquipmentItem';
import { DamageItem } from './DamageItem';
import { CureItem } from './CureItem';
import { ValuableItem } from './ValuableItem';

describe('ItemFactory — アイテム生成', () => {
  afterEach(() => {
    ItemFactory.clearCache();
  });

  describe('登録済みアイテムの生成', () => {
    it('potion を create すると HealItem インスタンスが返る', () => {
      const item = ItemFactory.create('potion');
      expect(item).toBeInstanceOf(HealItem);
      expect(item.name).toBe('ポーション');
    });

    it('wooden_sword を create すると EquipmentItem インスタンスが返る', () => {
      const item = ItemFactory.create('wooden_sword');
      expect(item).toBeInstanceOf(EquipmentItem);
    });

    it('bomb を create すると DamageItem インスタンスが返る', () => {
      const item = ItemFactory.create('bomb');
      expect(item).toBeInstanceOf(DamageItem);
    });

    it('antidote を create すると CureItem インスタンスが返る', () => {
      const item = ItemFactory.create('antidote');
      expect(item).toBeInstanceOf(CureItem);
    });

    it('camera を create すると ValuableItem インスタンスが返る', () => {
      const item = ItemFactory.create('camera');
      expect(item).toBeInstanceOf(ValuableItem);
    });

    it('同じIDで2回 create しても別インスタンスが返る（キャッシュ汚染なし）', () => {
      const item1 = ItemFactory.create('potion');
      const item2 = ItemFactory.create('potion');
      expect(item1).not.toBe(item2);
      expect(item1.id).toBe(item2.id);
    });
  });

  describe('未登録アイテム', () => {
    it('存在しないIDで create するとエラーがスローされる', () => {
      expect(() => ItemFactory.create('unknown_item')).toThrow('Unknown item id: unknown_item');
    });

    it('exists("unknown_id") は false', () => {
      expect(ItemFactory.exists('unknown_id')).toBe(false);
    });

    it('exists("potion") は true', () => {
      expect(ItemFactory.exists('potion')).toBe(true);
    });
  });

  describe('定義の検索', () => {
    it('getConsumableDefinitions は装備品を含まない', () => {
      const defs = ItemFactory.getConsumableDefinitions();
      expect(defs.every(d => d.type !== 'equipment')).toBe(true);
      expect(defs.some(d => d.type === 'heal')).toBe(true);
    });

    it('getEquipmentDefinitions は消費アイテムを含まない', () => {
      const defs = ItemFactory.getEquipmentDefinitions();
      expect(defs.every(d => d.type === 'equipment')).toBe(true);
      expect(defs.length).toBeGreaterThan(0);
    });

    it('getAllIds は全アイテムIDを返す', () => {
      const ids = ItemFactory.getAllIds();
      expect(ids).toContain('potion');
      expect(ids).toContain('wooden_sword');
      expect(ids).toContain('bomb');
      expect(ids).toContain('camera');
    });
  });
});
