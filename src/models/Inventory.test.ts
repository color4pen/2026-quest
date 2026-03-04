import { Inventory } from './Inventory';

describe('Inventory', () => {
  describe('アイテムの追加と検索', () => {
    it('薬草を3つ追加すると getQuantity が3を返す', () => {
      const inv = new Inventory();
      inv.addById('potion', 3);
      expect(inv.getQuantity('potion')).toBe(3);
    });

    it('存在しないアイテムの getQuantity は0', () => {
      const inv = new Inventory();
      expect(inv.getQuantity('nonexistent')).toBe(0);
    });

    it('has でアイテムの存在を確認できる', () => {
      const inv = new Inventory();
      inv.addById('potion', 1);
      expect(inv.has('potion')).toBe(true);
      expect(inv.has('bomb')).toBe(false);
    });

    it('初期アイテムをコンストラクタで渡せる', () => {
      const inv = new Inventory([{ itemId: 'potion', quantity: 5 }]);
      expect(inv.getQuantity('potion')).toBe(5);
    });
  });

  describe('アイテムの消費', () => {
    it('consume で在庫が1減る', () => {
      const inv = new Inventory([{ itemId: 'potion', quantity: 3 }]);
      const item = inv.consume('potion');
      expect(item).not.toBeNull();
      expect(inv.getQuantity('potion')).toBe(2);
    });

    it('在庫1のアイテムを consume するとエントリが削除される', () => {
      const inv = new Inventory([{ itemId: 'potion', quantity: 1 }]);
      inv.consume('potion');
      expect(inv.has('potion')).toBe(false);
      expect(inv.size).toBe(0);
    });

    it('在庫0のアイテムを consume すると null が返る', () => {
      const inv = new Inventory();
      expect(inv.consume('potion')).toBeNull();
    });
  });

  describe('フィルタリング', () => {
    it('getEquipmentItems は装備品のみ返す', () => {
      const inv = new Inventory([
        { itemId: 'potion', quantity: 1 },
        { itemId: 'iron_sword', quantity: 1 },
        { itemId: 'leather_armor', quantity: 1 },
      ]);
      const equipment = inv.getEquipmentItems();
      expect(equipment.length).toBe(2);
      expect(equipment.every(e => e.type === 'equipment')).toBe(true);
    });

    it('getBattleItems は戦闘で使えるアイテムのみ返す', () => {
      const inv = new Inventory([
        { itemId: 'potion', quantity: 1 },
        { itemId: 'bomb', quantity: 1 },
        { itemId: 'iron_sword', quantity: 1 },
        { itemId: 'camera', quantity: 1 },
      ]);
      const battleItems = inv.getBattleItems();
      // potion, bomb は戦闘OK。iron_sword, camera は戦闘NG
      expect(battleItems.length).toBe(2);
    });

    it('getMenuItems はメニューで使えるアイテムのみ返す', () => {
      const inv = new Inventory([
        { itemId: 'potion', quantity: 1 },
        { itemId: 'bomb', quantity: 1 },
        { itemId: 'iron_sword', quantity: 1 },
      ]);
      const menuItems = inv.getMenuItems();
      // potion はメニューOK。bomb, iron_sword はメニューNG
      expect(menuItems.length).toBe(1);
      expect(menuItems[0].item.id).toBe('potion');
    });
  });

  describe('集計', () => {
    it('size は種類数を返す', () => {
      const inv = new Inventory([
        { itemId: 'potion', quantity: 5 },
        { itemId: 'bomb', quantity: 3 },
      ]);
      expect(inv.size).toBe(2);
    });

    it('totalQuantity は全数量合計を返す', () => {
      const inv = new Inventory([
        { itemId: 'potion', quantity: 5 },
        { itemId: 'bomb', quantity: 3 },
      ]);
      expect(inv.totalQuantity).toBe(8);
    });
  });
});
