import { GameMap } from './GameMap';
import { createTestMapDef } from '../__test-helpers__/factories';
import type { TileType } from '../types/game';

describe('GameMap', () => {
  describe('マップの読み込み', () => {
    it('MapDefinition からタイルデータが正しく設定される', () => {
      const map = new GameMap();
      const tiles: TileType[][] = [
        ['grass', 'path', 'tree'],
        ['water', 'grass', 'wall'],
      ];
      map.loadFromDefinition(createTestMapDef({ tiles }));

      expect(map.getTile({ x: 0, y: 0 })).toBe('grass');
      expect(map.getTile({ x: 1, y: 0 })).toBe('path');
      expect(map.getTile({ x: 2, y: 0 })).toBe('tree');
    });

    it('マップ名とIDが取得できる', () => {
      const map = new GameMap();
      map.loadFromDefinition(createTestMapDef({ id: 'forest', name: '森' }));

      expect(map.getId()).toBe('forest');
      expect(map.getName()).toBe('森');
    });
  });

  describe('移動判定', () => {
    let map: GameMap;

    beforeEach(() => {
      map = new GameMap();
      const tiles: TileType[][] = [
        ['grass', 'tree', 'water', 'wall', 'path'],
      ];
      map.loadFromDefinition(createTestMapDef({ tiles }));
    });

    it('草タイルは歩行可能', () => {
      expect(map.isWalkable({ x: 0, y: 0 })).toBe(true);
    });

    it('木タイルは歩行不可', () => {
      expect(map.isWalkable({ x: 1, y: 0 })).toBe(false);
    });

    it('水タイルは歩行不可', () => {
      expect(map.isWalkable({ x: 2, y: 0 })).toBe(false);
    });

    it('壁タイルは歩行不可', () => {
      expect(map.isWalkable({ x: 3, y: 0 })).toBe(false);
    });

    it('道タイルは歩行可能', () => {
      expect(map.isWalkable({ x: 4, y: 0 })).toBe(true);
    });

    it('マップ外座標は歩行不可', () => {
      expect(map.isWalkable({ x: -1, y: 0 })).toBe(false);
      expect(map.isWalkable({ x: 100, y: 0 })).toBe(false);
    });
  });

  describe('ワープポイント', () => {
    it('ワープ座標にいると WarpPoint が返る', () => {
      const map = new GameMap();
      map.loadFromDefinition(createTestMapDef({
        warps: [{ x: 3, y: 3, toMapId: 'dungeon', toX: 1, toY: 1 }],
      }));

      const warp = map.getWarpAt({ x: 3, y: 3 });
      expect(warp).toBeDefined();
      expect(warp!.toMapId).toBe('dungeon');
    });

    it('ワープのない座標では undefined', () => {
      const map = new GameMap();
      map.loadFromDefinition(createTestMapDef());

      expect(map.getWarpAt({ x: 0, y: 0 })).toBeUndefined();
    });
  });

  describe('ブロック理由', () => {
    it('水タイルは「水があって進めない！」', () => {
      const map = new GameMap();
      map.loadFromDefinition(createTestMapDef({ tiles: [['water']] }));
      expect(map.getBlockedReason({ x: 0, y: 0 })).toBe('水があって進めない！');
    });

    it('歩行可能タイルは null', () => {
      const map = new GameMap();
      map.loadFromDefinition(createTestMapDef({ tiles: [['grass']] }));
      expect(map.getBlockedReason({ x: 0, y: 0 })).toBeNull();
    });
  });
});
