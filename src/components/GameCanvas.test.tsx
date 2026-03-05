import { render } from '../test/helpers';
import { GameCanvas } from './GameCanvas';
import { RenderableEntity } from '../types/rendering';
import { CameraState, GrassDecoration, TileType } from '../types/game';
import { GameMapState } from '../models';

// テスト用のシンプルなマップ
function createTestMap(tiles: TileType[][] = [[]]): GameMapState {
  const decorations: (GrassDecoration[] | null)[][] = tiles.map(row =>
    row.map(() => null)
  );
  return {
    id: 'test-map',
    name: 'テストマップ',
    tiles,
    grassDecorations: decorations,
    objects: [],
    npcs: [],
    enemies: [],
    treasures: [],
    warps: [],
    randomEncounter: null,
  };
}

function createCamera(overrides: Partial<CameraState> = {}): CameraState {
  return {
    x: 5,
    y: 5,
    viewportWidth: 10,
    viewportHeight: 8,
    ...overrides,
  };
}

// テスト用のプレイヤーエンティティ
function createPlayerEntity(x: number = 1, y: number = 1): RenderableEntity {
  return {
    entityType: 'player',
    id: 'player_0',
    x,
    y,
    active: true,
  };
}

describe('GameCanvas', () => {
  describe('基本表示', () => {
    it('game-screen クラスを持つコンテナが表示される', () => {
      const tiles: TileType[][] = [
        ['grass', 'grass', 'grass'],
        ['grass', 'path', 'grass'],
        ['grass', 'grass', 'grass'],
      ];
      const map = createTestMap(tiles);
      const camera = createCamera();

      const { container } = render(
        <GameCanvas entities={[]} map={map} camera={camera} />
      );

      expect(container.querySelector('.game-screen')).toBeInTheDocument();
    });

    it('canvas 要素が存在し、正しいサイズを持つ', () => {
      const tiles: TileType[][] = [['grass']];
      const map = createTestMap(tiles);
      const camera = createCamera();

      const { container } = render(
        <GameCanvas entities={[]} map={map} camera={camera} />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '640');
      expect(canvas).toHaveAttribute('height', '480');
      expect(canvas).toHaveAttribute('id', 'gameCanvas');
    });
  });

  describe('エンティティ描画', () => {
    it('空の entities 配列でもエラーにならない', () => {
      const tiles: TileType[][] = [['grass']];
      const map = createTestMap(tiles);
      const camera = createCamera();

      expect(() => {
        render(<GameCanvas entities={[]} map={map} camera={camera} />);
      }).not.toThrow();
    });

    it('プレイヤーエンティティを渡してもエラーにならない', () => {
      const tiles: TileType[][] = [
        ['grass', 'grass', 'grass'],
        ['grass', 'grass', 'grass'],
        ['grass', 'grass', 'grass'],
      ];
      const map = createTestMap(tiles);
      const camera = createCamera({ x: 1, y: 1 });
      const player = createPlayerEntity(1, 1);

      expect(() => {
        render(<GameCanvas entities={[player]} map={map} camera={camera} />);
      }).not.toThrow();
    });
  });

  describe('タイルタイプの描画', () => {
    const tileTypes: TileType[] = [
      'grass', 'tree', 'path', 'water', 'floor', 'wall',
      'stairs', 'door', 'sand', 'bridge',
    ];

    tileTypes.forEach((tileType) => {
      it(`${tileType} タイプのタイルを描画できる`, () => {
        const tiles: TileType[][] = [[tileType]];
        const map = createTestMap(tiles);
        const camera = createCamera({ x: 0, y: 0 });

        expect(() => {
          render(<GameCanvas entities={[]} map={map} camera={camera} />);
        }).not.toThrow();
      });
    });
  });

  describe('カメラ位置', () => {
    it('異なるカメラ位置でも正常に描画される', () => {
      const tiles: TileType[][] = Array(20).fill(null).map(() =>
        Array(20).fill('grass') as TileType[]
      );
      const map = createTestMap(tiles);

      // 様々なカメラ位置でテスト
      const cameraPositions = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 5, y: 15 },
      ];

      cameraPositions.forEach(({ x, y }) => {
        const camera = createCamera({ x, y });
        expect(() => {
          render(<GameCanvas entities={[]} map={map} camera={camera} />);
        }).not.toThrow();
      });
    });
  });

  describe('草の装飾', () => {
    it('草の装飾があるマップでも正常に描画される', () => {
      const tiles: TileType[][] = [['grass', 'grass']];
      const decorations: (GrassDecoration[] | null)[][] = [
        [
          [{ x: 5, y: 5 }, { x: 10, y: 10 }],
          null,
        ],
      ];
      const map: GameMapState = {
        id: 'test-map',
        name: 'テストマップ',
        tiles,
        grassDecorations: decorations,
        npcs: [],
        enemies: [],
        treasures: [],
        warps: [],
        randomEncounter: null,
      };
      const camera = createCamera({ x: 0, y: 0 });

      expect(() => {
        render(<GameCanvas entities={[]} map={map} camera={camera} />);
      }).not.toThrow();
    });
  });
});
