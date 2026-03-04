import { Treasure } from './Treasure';

describe('Treasure', () => {
  describe('宝箱を開ける', () => {
    it('未開封の宝箱を open するとゴールドが返る', () => {
      const treasure = new Treasure(3, 4, 100);
      const gold = treasure.open();
      expect(gold).toBe(100);
      expect(treasure.opened).toBe(true);
    });

    it('開封済みの宝箱を open すると 0 が返る', () => {
      const treasure = new Treasure(3, 4, 100);
      treasure.open();
      expect(treasure.open()).toBe(0);
    });

    it('開封済みの宝箱には canInteract が false', () => {
      const treasure = new Treasure(3, 4, 100);
      expect(treasure.canInteract()).toBe(true);

      treasure.open();
      expect(treasure.canInteract()).toBe(false);
    });
  });

  describe('インタラクション', () => {
    it('未開封の宝箱に onInteract すると treasure タイプが返る', () => {
      const treasure = new Treasure(3, 4, 50);
      const result = treasure.onInteract(treasure); // player arg unused
      expect(result.type).toBe('treasure');
      expect((result.data as { gold: number }).gold).toBe(50);
      expect(result.blockMovement).toBe(false);
    });

    it('開封済みの宝箱に onInteract すると none タイプが返る', () => {
      const treasure = new Treasure(3, 4, 50);
      treasure.open();
      const result = treasure.onInteract(treasure);
      expect(result.type).toBe('none');
    });
  });

  describe('ステート', () => {
    it('getState に gold と opened が含まれる', () => {
      const treasure = new Treasure(3, 4, 75);
      const state = treasure.getState();
      expect(state.gold).toBe(75);
      expect(state.opened).toBe(false);
    });
  });
});
