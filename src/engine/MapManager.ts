import {
  MapDefinition,
  FixedEnemyPlacement,
  NPC_DEFINITIONS,
  ENEMY_TEMPLATES,
} from '../types/game';
import { SavedTreasureData } from '../types/save';
import {
  Enemy,
  Treasure,
  GameMap,
  GameMapState,
  NPC,
  NPCState,
  TreasureState,
} from '../models';
import { MAPS } from '../data/maps';

export interface MapLoadResult {
  startX: number;
  startY: number;
  mapName: string;
}

export class MapManager {
  private gameMap: GameMap;
  private npcs: NPC[] = [];
  private treasures: Treasure[] = [];
  private fixedEnemies: Enemy[] = [];
  private currentMapId: string;
  private currentMapDefinition: MapDefinition | null = null;
  private treasureStatesCache: Record<string, SavedTreasureData[]> = {};

  constructor(initialMapId: string) {
    this.gameMap = new GameMap();
    this.currentMapId = initialMapId;
  }

  /**
   * マップを読み込み
   * @returns 成功時はプレイヤー開始位置とマップ名。失敗時は null
   */
  loadMap(
    mapId: string,
    playerX?: number,
    playerY?: number,
    options?: {
      skipCache?: boolean;
      leaderLevel?: number;
      getGameState?: (key: string) => number;
    }
  ): MapLoadResult | null {
    const mapDef = MAPS[mapId];
    if (!mapDef) {
      console.error(`Map not found: ${mapId}`);
      return null;
    }

    const skipCache = options?.skipCache ?? false;
    const leaderLevel = options?.leaderLevel ?? 1;
    const getGameState = options?.getGameState;

    // マップ切り替え前に現在のマップの宝箱状態をキャッシュ
    if (!skipCache && this.currentMapId && this.treasures.length > 0) {
      this.cacheTreasureStates();
    }

    this.currentMapId = mapId;
    this.currentMapDefinition = mapDef;
    this.gameMap.loadFromDefinition(mapDef);

    // NPCを配置
    this.npcs = [];
    if (mapDef.npcs) {
      for (const npcPlacement of mapDef.npcs) {
        const npcDef = NPC_DEFINITIONS.find(n => n.id === npcPlacement.npcId);
        if (npcDef) {
          this.npcs.push(new NPC(npcDef, npcPlacement.x, npcPlacement.y));
        }
      }
    }

    // 宝箱を配置
    this.treasures = [];
    if (mapDef.treasures) {
      for (const t of mapDef.treasures) {
        this.treasures.push(new Treasure(t.x, t.y, t.gold));
      }
    }

    // キャッシュされた宝箱状態を適用
    this.applyTreasureStates();

    // 固定敵を配置
    this.fixedEnemies = this.spawnFixedEnemies(mapDef, leaderLevel, getGameState);

    const startX = playerX ?? mapDef.playerStart.x;
    const startY = playerY ?? mapDef.playerStart.y;

    return { startX, startY, mapName: mapDef.name };
  }

  /**
   * 現在のマップの宝箱状態をキャッシュ
   */
  cacheTreasureStates(): void {
    this.treasureStatesCache[this.currentMapId] = this.treasures.map(t => ({
      x: t.x,
      y: t.y,
      opened: t.opened,
    }));
  }

  /**
   * キャッシュされた宝箱状態を現在のマップに適用
   */
  private applyTreasureStates(): void {
    const states = this.treasureStatesCache[this.currentMapId];
    if (!states) return;

    for (const treasure of this.treasures) {
      const savedState = states.find(s => s.x === treasure.x && s.y === treasure.y);
      if (savedState?.opened && !treasure.opened) {
        treasure.open();
      }
    }
  }

  /**
   * 固定敵をスポーン（条件をチェック）
   */
  private spawnFixedEnemies(
    mapDef: MapDefinition,
    leaderLevel: number,
    getGameState?: (key: string) => number
  ): Enemy[] {
    if (!mapDef.fixedEnemies) return [];

    return mapDef.fixedEnemies
      .filter(fe => this.checkSpawnCondition(fe.spawnCondition, getGameState))
      .map(fe => {
        const template = ENEMY_TEMPLATES.find(t => t.name === fe.templateName);
        return new Enemy(fe.x, fe.y, leaderLevel, template);
      });
  }

  /**
   * スポーン条件をチェック
   */
  private checkSpawnCondition(
    cond?: FixedEnemyPlacement['spawnCondition'],
    getGameState?: (key: string) => number
  ): boolean {
    if (!cond) return true;
    if (!getGameState) return true;

    const value = getGameState(cond.key);

    switch (cond.op) {
      case '<':  return value < cond.value;
      case '<=': return value <= cond.value;
      case '==': return value === cond.value;
      case '!=': return value !== cond.value;
      case '>=': return value >= cond.value;
      case '>':  return value > cond.value;
      default:   return false;
    }
  }

  // ==================== Getter ====================

  getGameMap(): GameMap { return this.gameMap; }
  getGameMapState(): GameMapState { return this.gameMap.getState(); }
  getNpcs(): NPC[] { return this.npcs; }
  getNpcStates(): NPCState[] { return this.npcs.map(n => n.getState()); }
  getTreasures(): Treasure[] { return this.treasures; }
  getTreasureStates(): TreasureState[] { return this.treasures.map(t => t.getState()); }
  getFixedEnemies(): Enemy[] { return this.fixedEnemies; }
  getCurrentMapId(): string { return this.currentMapId; }
  getMapName(): string { return this.currentMapDefinition?.name ?? ''; }

  getTreasureStatesCache(): Record<string, SavedTreasureData[]> {
    return this.treasureStatesCache;
  }

  setTreasureStatesCache(cache: Record<string, SavedTreasureData[]>): void {
    this.treasureStatesCache = cache;
  }
}
