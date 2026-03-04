import { MapManager } from './MapManager';

describe('MapManager', () => {
  describe('マップ読み込み', () => {
    it('有効なマップIDで読み込むと開始座標とマップ名が返る', () => {
      const mgr = new MapManager('village');
      const result = mgr.loadMap('village');

      expect(result).not.toBeNull();
      expect(result!.mapName).toBeTruthy();
      expect(typeof result!.startX).toBe('number');
      expect(typeof result!.startY).toBe('number');
    });

    it('無効なマップIDでは null が返る', () => {
      const mgr = new MapManager('village');
      const result = mgr.loadMap('nonexistent_map');
      expect(result).toBeNull();
    });

    it('playerX/Y を指定すると開始座標が上書きされる', () => {
      const mgr = new MapManager('village');
      const result = mgr.loadMap('village', 7, 8);

      expect(result).not.toBeNull();
      expect(result!.startX).toBe(7);
      expect(result!.startY).toBe(8);
    });
  });

  describe('宝箱状態のキャッシュ', () => {
    it('キャッシュを set/get できる', () => {
      const mgr = new MapManager('village');
      const cache = { 'map1': [{ x: 1, y: 2, opened: true }] };
      mgr.setTreasureStatesCache(cache);

      expect(mgr.getTreasureStatesCache()).toEqual(cache);
    });
  });

  describe('ゲッター', () => {
    it('loadMap 後にマップ名とIDが取得できる', () => {
      const mgr = new MapManager('village');
      mgr.loadMap('village');

      expect(mgr.getCurrentMapId()).toBe('village');
      expect(mgr.getMapName()).toBeTruthy();
    });

    it('loadMap 後に GameMap のステートが取得できる', () => {
      const mgr = new MapManager('village');
      mgr.loadMap('village');

      const mapState = mgr.getGameMapState();
      expect(mapState.id).toBe('village');
      expect(mapState.tiles.length).toBeGreaterThan(0);
    });
  });
});
