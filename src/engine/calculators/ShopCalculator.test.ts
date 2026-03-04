import { calculatePurchaseCommands } from './ShopCalculator';
import { ShopItem } from '../../types/game';

describe('ShopCalculator', () => {
  describe('calculatePurchaseCommands', () => {
    const createShopItem = (overrides: Partial<ShopItem> = {}): ShopItem => ({
      item: { id: 'potion', name: 'ポーション', description: 'HPを30回復', type: 'heal' },
      price: 50,
      stock: -1, // 無限在庫
      ...overrides,
    });

    it('十分なゴールドがあれば購入成功', () => {
      const shopItem = createShopItem();
      const result = calculatePurchaseCommands(shopItem, 100);

      expect(result.success).toBe(true);
      expect(result.commands).toContainEqual({ type: 'spendGold', amount: 50 });
      expect(result.commands).toContainEqual({ type: 'addItem', itemId: 'potion', quantity: 1 });
      expect(result.commands).toContainEqual({
        type: 'addMessage',
        text: 'ポーションを購入した！',
        messageType: 'loot',
      });
    });

    it('ゴールド不足で購入失敗', () => {
      const shopItem = createShopItem({ price: 100 });
      const result = calculatePurchaseCommands(shopItem, 50);

      expect(result.success).toBe(false);
      expect(result.message).toBe('ゴールドが足りない！');
      expect(result.commands).toHaveLength(0);
    });

    it('在庫切れで購入失敗', () => {
      const shopItem = createShopItem({ stock: 0 });
      const result = calculatePurchaseCommands(shopItem, 100);

      expect(result.success).toBe(false);
      expect(result.message).toBe('在庫切れだ！');
      expect(result.commands).toHaveLength(0);
    });

    it('ちょうどのゴールドで購入成功', () => {
      const shopItem = createShopItem({ price: 100 });
      const result = calculatePurchaseCommands(shopItem, 100);

      expect(result.success).toBe(true);
    });
  });
});
