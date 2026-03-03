import {
  TileType,
  Position,
  GrassDecoration,
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  MapDefinition,
  EncounterConfig,
  WarpPoint,
} from '../types/game';
import { Door } from './Door';

export interface GameMapState {
  id: string;
  name: string;
  tiles: TileType[][];
  grassDecorations: (GrassDecoration[] | null)[][];
}

export class GameMap {
  private id: string;
  private name: string;
  private tiles: TileType[][];
  private grassDecorations: (GrassDecoration[] | null)[][];
  private warps: WarpPoint[];
  private doors: Door[];
  private encounter: EncounterConfig | undefined;

  constructor() {
    this.id = '';
    this.name = '';
    this.tiles = [];
    this.grassDecorations = [];
    this.warps = [];
    this.doors = [];
    this.encounter = undefined;
  }

  /**
   * マップ定義から読み込み
   */
  public loadFromDefinition(definition: MapDefinition): void {
    this.id = definition.id;
    this.name = definition.name;
    this.warps = definition.warps ?? [];
    this.doors = (definition.doors ?? []).map(d => new Door(d));
    this.encounter = definition.encounter;

    // タイルをコピー
    this.tiles = definition.tiles.map(row => [...row]);

    // 草地の装飾を生成
    this.grassDecorations = [];
    for (let y = 0; y < this.tiles.length; y++) {
      const decorRow: (GrassDecoration[] | null)[] = [];
      for (let x = 0; x < this.tiles[y].length; x++) {
        if (this.tiles[y][x] === 'grass') {
          decorRow.push(this.generateGrassDecorations());
        } else {
          decorRow.push(null);
        }
      }
      this.grassDecorations.push(decorRow);
    }
  }

  /**
   * ランダムマップを生成（後方互換性のため残す）
   */
  public generate(): void {
    this.id = 'random';
    this.name = 'ランダムマップ';
    this.warps = [];
    this.encounter = {
      rate: 0.15,
      enemyIds: ['スライム', 'バット', 'ゴブリン'],
    };

    this.tiles = [];
    this.grassDecorations = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
      const row: TileType[] = [];
      const decorRow: (GrassDecoration[] | null)[] = [];

      for (let x = 0; x < MAP_WIDTH; x++) {
        const rand = Math.random();

        if (rand < 0.7) {
          row.push('grass');
          decorRow.push(this.generateGrassDecorations());
        } else if (rand < 0.85) {
          row.push('tree');
          decorRow.push(null);
        } else if (rand < 0.95) {
          row.push('path');
          decorRow.push(null);
        } else {
          row.push('water');
          decorRow.push(null);
        }
      }

      this.tiles.push(row);
      this.grassDecorations.push(decorRow);
    }
  }

  /**
   * 草地の装飾を生成
   */
  private generateGrassDecorations(): GrassDecoration[] {
    return [
      { x: Math.random() * TILE_SIZE, y: Math.random() * TILE_SIZE },
      { x: Math.random() * TILE_SIZE, y: Math.random() * TILE_SIZE },
      { x: Math.random() * TILE_SIZE, y: Math.random() * TILE_SIZE },
    ];
  }

  /**
   * マップIDを取得
   */
  public getId(): string {
    return this.id;
  }

  /**
   * マップ名を取得
   */
  public getName(): string {
    return this.name;
  }

  /**
   * エンカウント設定を取得
   */
  public getEncounter(): EncounterConfig | undefined {
    return this.encounter;
  }

  /**
   * 指定座標のワープポイントを取得
   */
  public getWarpAt(position: Position): WarpPoint | undefined {
    return this.warps.find(w => w.x === position.x && w.y === position.y);
  }

  /**
   * 指定座標の扉を取得
   */
  public getDoorAt(position: Position): Door | undefined {
    return this.doors.find(d => d.isAt(position));
  }

  /**
   * 指定座標のタイルを取得
   */
  public getTile(position: Position): TileType | null {
    if (!this.isValidPosition(position)) {
      return null;
    }
    return this.tiles[position.y][position.x];
  }

  /**
   * 指定座標のタイルを設定
   */
  public setTile(position: Position, tile: TileType): void {
    if (this.isValidPosition(position)) {
      this.tiles[position.y][position.x] = tile;

      // 草地の場合は装飾も生成
      if (tile === 'grass' && !this.grassDecorations[position.y][position.x]) {
        this.grassDecorations[position.y][position.x] = this.generateGrassDecorations();
      }
    }
  }

  /**
   * 指定座標の装飾を取得
   */
  public getDecorations(position: Position): GrassDecoration[] | null {
    if (!this.isValidPosition(position)) {
      return null;
    }
    return this.grassDecorations[position.y]?.[position.x] ?? null;
  }

  /**
   * 座標がマップ範囲内かチェック
   */
  public isValidPosition(position: Position): boolean {
    return (
      position.x >= 0 &&
      position.x < (this.tiles[0]?.length ?? MAP_WIDTH) &&
      position.y >= 0 &&
      position.y < this.tiles.length
    );
  }

  /**
   * 指定座標が通行可能かチェック
   */
  public isWalkable(position: Position): boolean {
    const tile = this.getTile(position);
    if (tile === null) return false;

    // 通行不可タイル
    const blockedTiles: TileType[] = ['water', 'tree', 'wall'];
    return !blockedTiles.includes(tile);
  }

  /**
   * 通行不能な理由を取得
   */
  public getBlockedReason(position: Position): string | null {
    if (!this.isValidPosition(position)) {
      return 'これ以上進めない！';
    }

    const tile = this.getTile(position);
    switch (tile) {
      case 'water':
        return '水があって進めない！';
      case 'tree':
        return '木が邪魔で進めない！';
      case 'wall':
        return '壁があって進めない！';
      default:
        return null;
    }
  }

  /**
   * プレイヤーの初期位置を確保（草地にする）
   */
  public ensureWalkableAt(position: Position): void {
    if (this.isValidPosition(position) && !this.isWalkable(position)) {
      this.setTile(position, 'path');
    }
  }

  /**
   * 状態をプレーンオブジェクトとして取得（React用）
   */
  public getState(): GameMapState {
    return {
      id: this.id,
      name: this.name,
      tiles: this.tiles.map(row => [...row]),
      grassDecorations: this.grassDecorations.map(row =>
        row.map(decor => decor ? [...decor] : null)
      ),
    };
  }
}
