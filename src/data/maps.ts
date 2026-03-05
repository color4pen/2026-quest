import { MapDefinition, TileType } from '../types/game';

/**
 * シード付き疑似乱数生成器（mulberry32）
 * マップ生成の決定性を保証する
 */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// タイルの略称（マップ定義を見やすくするため）
const G: TileType = 'grass';
const T: TileType = 'tree';
const P: TileType = 'path';
const W: TileType = 'water';
const F: TileType = 'floor';
const X: TileType = 'wall';
const S: TileType = 'stairs';
const D: TileType = 'door';
const A: TileType = 'sand';
const B: TileType = 'bridge';

/**
 * 村マップ（エンカウントなし）
 */
export const MAP_VILLAGE: MapDefinition = {
  id: 'village',
  name: '始まりの村',
  playerStart: { x: 5, y: 7 },  // 左の家の中からスタート
  tiles: [
    // 20x15のマップ
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    [T, F, F, F, X, G, G, G, G, G, G, G, G, G, X, F, F, F, F, T],
    [T, F, F, F, X, G, G, G, G, P, P, G, G, G, X, F, F, F, F, T],
    [T, F, F, F, D, P, P, P, P, P, P, P, P, P, D, F, F, F, F, T],
    [T, X, X, X, X, G, G, G, G, P, P, G, G, G, X, X, X, X, X, T],
    [T, G, G, G, G, G, G, G, G, P, P, G, G, G, G, G, G, G, G, T],
    [T, G, X, X, X, X, X, X, G, P, P, G, X, X, X, X, X, X, G, T],
    [T, G, X, F, F, F, F, X, G, P, P, G, X, F, F, F, F, X, G, T],
    [T, G, X, F, F, F, F, X, G, P, P, G, X, F, F, F, F, X, G, T],
    [T, G, X, X, X, D, X, X, G, P, P, G, X, X, D, X, X, X, G, T],
    [T, G, G, G, G, P, G, G, G, P, P, G, G, G, P, G, G, G, G, T],
    [T, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, T],
    [T, G, G, G, G, G, G, G, G, P, P, G, G, G, G, G, G, G, G, T],
    [T, G, G, G, G, G, G, G, G, S, S, G, G, G, G, G, G, G, G, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
  ],
  npcs: [
    { npcId: 'innkeeper_1', x: 2, y: 2 },
    { npcId: 'shopkeeper_1', x: 16, y: 2 },
    { npcId: 'elder', x: 15, y: 8 },
    { npcId: 'villager_entrance', x: 8, y: 12 },
    { npcId: 'developer_npc', x: 6, y: 10 },
    { npcId: 'home_pc', x: 3, y: 7 },
  ],
  treasures: [
    { x: 17, y: 3, gold: 50 },
  ],
  warps: [
    // 村から出る → フィールドの村オブジェクト前
    { x: 9, y: 13, toMapId: 'field', toX: 24, toY: 6 },
    { x: 10, y: 13, toMapId: 'field', toX: 25, toY: 6 },
  ],
  // 条件付き扉
  doors: [
    // 自分の家の扉（インフルエンザが治らないと出られない）
    { id: 'home_door', x: 5, y: 9, condition: 'no_influenza' },
  ],
  // エンカウントなし（村は安全）
  encounter: undefined,
};

/**
 * 広大な草原マップ（50x40）- カメラ追従テスト用
 */
function generateLargeField(): TileType[][] {
  const width = 50;
  const height = 40;
  const tiles: TileType[][] = [];
  const rand = seededRandom(2026);

  // 村の位置（北側）- 2x2オブジェクト
  const villageX = 24;
  const villageY = 4;

  // 洞窟の位置（南側）- 2x2オブジェクト
  const caveX = 24;
  const caveY = 34;

  for (let y = 0; y < height; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < width; x++) {
      // 村・洞窟オブジェクトの位置は草地（オブジェクトレイヤーで描画）
      if (
        (x >= villageX && x < villageX + 2 && y >= villageY && y < villageY + 2) ||
        (x >= caveX && x < caveX + 2 && y >= caveY && y < caveY + 2)
      ) {
        row.push(G);
      }

      // === 外周 ===
      else if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push(T);
      }

      // === 道 ===
      // メイン道路（縦）
      else if ((x === 24 || x === 25) && y >= villageY + 2 && y <= caveY - 1) {
        row.push(P);
      }
      // 横道（y=20）
      else if (y === 20 && x >= 5 && x <= 44) {
        row.push(P);
      }

      // === 湖（中央左側） ===
      else if (x >= 8 && x <= 14 && y >= 12 && y <= 18) {
        if ((x === 11 || x === 12) && y === 15) row.push(B); // 橋
        else row.push(W);
      }

      // === 森林エリア（右上） ===
      else if (x >= 36 && x <= 44 && y >= 8 && y <= 16 && x !== 40) {
        if (rand() < 0.4) row.push(T);
        else row.push(G);
      }

      // === 砂地エリア（左下） ===
      else if (x >= 5 && x <= 15 && y >= 26 && y <= 32) {
        row.push(A);
      }

      // === 森の点在 ===
      else if (
        (x === 3 && y === 10) || (x === 18 && y === 12) ||
        (x === 30 && y === 27) || (x === 42 && y === 32) ||
        (x === 17 && y === 25) || (x === 38 && y === 22)
      ) {
        row.push(T);
      }

      // === それ以外は草 ===
      else {
        row.push(G);
      }
    }
    tiles.push(row);
  }

  return tiles;
}

export const MAP_FIELD: MapDefinition = {
  id: 'field',
  name: '広大な草原',
  playerStart: { x: 24, y: 7 },  // 村の前の道からスタート
  tiles: generateLargeField(),
  objects: [
    // 村オブジェクト（2x2）
    {
      id: 'village_entrance',
      x: 24,
      y: 4,
      image: 'village',
      width: 2,
      height: 2,
      walkable: true,  // 通行可能（ワープする）
      warpTo: { mapId: 'village', x: 10, y: 12 },
    },
    // 洞窟オブジェクト（2x2）
    {
      id: 'cave_entrance',
      x: 24,
      y: 34,
      image: 'cave',
      width: 2,
      height: 2,
      walkable: true,  // 通行可能（ワープする）
      warpTo: { mapId: 'dungeon', x: 10, y: 1 },
    },
    // 車オブジェクト（キャンプ場へ）
    {
      id: 'car_to_campsite',
      x: 28,
      y: 5,
      image: 'car',
      width: 2,
      height: 1,
      walkable: true,
      warpTo: { mapId: 'campsite', x: 10, y: 12 },
    },
  ],
  treasures: [
    { x: 5, y: 5, gold: 30 },      // 左上の草地
    { x: 40, y: 20, gold: 50 },    // 横道沿い
    { x: 10, y: 28, gold: 40 },    // 砂地エリア
    { x: 35, y: 25, gold: 60 },    // 中央右の草地
    { x: 20, y: 15, gold: 35 },    // 中央の草地
    { x: 45, y: 30, gold: 100 },   // 右下の草地
  ],
  // warpsは空（村・洞窟はobjects.warpToで処理）
  warps: [],
  encounter: {
    rate: 0.10,
    enemyIds: ['スライム', 'バット', 'ゴブリン', 'コボルト'],
  },
};

/**
 * キャンプ場マップ（エンカウントなし、休息エリア）
 * 奥に湖があり、その中央に鳥居がある緑豊かなキャンプ場
 */
export const MAP_CAMPSITE: MapDefinition = {
  id: 'campsite',
  name: 'キャンプ場',
  playerStart: { x: 10, y: 12 },  // 車の前からスタート
  tiles: [
    // 20x15のマップ - 奥（上）に湖、手前（下）が緑のキャンプエリア
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    [T, G, G, W, W, W, W, W, W, W, W, W, W, W, W, W, W, G, G, T],
    [T, G, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, G, T],
    [T, G, W, W, W, W, W, W, W, G, G, W, W, W, W, W, W, W, G, T],
    [T, G, W, W, W, W, W, W, W, G, G, W, W, W, W, W, W, W, G, T],
    [T, G, G, W, W, W, W, W, W, W, W, W, W, W, W, W, W, G, G, T],
    [T, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, T],
    [T, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, T],
    [T, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, T],
    [T, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, T],
    [T, G, G, G, G, G, G, G, G, P, P, G, G, G, G, G, G, G, G, T],
    [T, G, G, G, G, G, G, G, G, P, P, G, G, G, G, G, G, G, G, T],
    [T, G, G, G, G, G, G, G, G, P, P, G, G, G, G, G, G, G, G, T],
    [T, G, G, G, G, G, G, G, G, P, P, G, G, G, G, G, G, G, G, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
  ],
  objects: [
    // 鳥居（湖の中央）
    {
      id: 'torii',
      x: 9,
      y: 3,
      image: 'torii',
      width: 2,
      height: 2,
      walkable: false,  // 通行不可（湖の中）
    },
    // テント入り口（テント本体より先に定義して優先させる）
    {
      id: 'tent_entrance',
      x: 15,
      y: 11,
      image: 'none',  // 描画しない（テント本体で描画済み）
      width: 2,
      height: 1,
      walkable: true,
      warpTo: { mapId: 'tent_interior', x: 5, y: 6 },
    },
    // テント本体（湖の右側に配置）
    {
      id: 'tent',
      x: 13,
      y: 7,
      image: 'tent',
      width: 5,
      height: 5,
      walkable: false,  // 通行不可
    },
    // テントの傍の車（ワープなし、装飾用、入り口の右）
    {
      id: 'parked_car',
      x: 17,
      y: 12,
      image: 'car',
      width: 2,
      height: 1,
      walkable: false,  // 通行不可
    },
    // 車オブジェクト（フィールドへ戻る）
    {
      id: 'car_to_field',
      x: 9,
      y: 13,
      image: 'car',
      width: 2,
      height: 1,
      walkable: true,
      warpTo: { mapId: 'field', x: 29, y: 6 },  // フィールドの車の下に戻る
    },
  ],
  treasures: [],
  warps: [],
  // エンカウントなし（キャンプ場は安全）
  encounter: undefined,
};

/**
 * テント内マップ（NPC3人、焚き火、ストーブ、テーブル）
 */
export const MAP_TENT_INTERIOR: MapDefinition = {
  id: 'tent_interior',
  name: 'テント内',
  playerStart: { x: 5, y: 7 },  // 入り口から入った位置
  tiles: [
    // 10x8のコンパクトなテント内部
    [X, X, X, X, X, X, X, X, X, X],
    [X, F, F, F, F, F, F, F, F, X],
    [X, F, F, F, F, F, F, F, F, X],
    [X, F, F, F, F, F, F, F, F, X],
    [X, F, F, F, F, F, F, F, F, X],
    [X, F, F, F, F, F, F, F, F, X],
    [X, F, F, F, F, F, F, F, F, X],
    [X, X, X, X, D, D, X, X, X, X],
  ],
  npcs: [
    { npcId: 'camper_1', x: 2, y: 2 },
    { npcId: 'camper_2', x: 7, y: 2 },
    { npcId: 'camper_3', x: 5, y: 4 },
  ],
  objects: [
    // 焚き火（中央）
    {
      id: 'campfire',
      x: 4,
      y: 3,
      image: 'campfire',
      width: 2,
      height: 2,
      walkable: false,
    },
    // ストーブ（左側）
    {
      id: 'stove',
      x: 1,
      y: 4,
      image: 'stove',
      width: 1,
      height: 1,
      walkable: false,
    },
    // テーブル（右側）
    {
      id: 'table',
      x: 7,
      y: 4,
      image: 'table',
      width: 2,
      height: 1,
      walkable: false,
    },
  ],
  treasures: [],
  warps: [
    // テントから出る → キャンプ場のテント前
    { x: 4, y: 7, toMapId: 'campsite', toX: 14, toY: 12 },
    { x: 5, y: 7, toMapId: 'campsite', toX: 15, toY: 12 },
  ],
  encounter: undefined,
};

/**
 * ダンジョンマップ（高エンカウント率）
 */
export const MAP_DUNGEON: MapDefinition = {
  id: 'dungeon',
  name: '洞窟',
  playerStart: { x: 10, y: 1 },
  tiles: [
    [X, X, X, X, X, X, X, X, X, S, S, X, X, X, X, X, X, X, X, X],
    [X, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, X],
    [X, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, X],
    [X, F, F, X, X, X, F, F, F, F, F, F, F, F, X, X, X, F, F, X],
    [X, F, F, X, F, F, F, F, F, F, F, F, F, F, F, F, X, F, F, X],
    [X, F, F, X, F, F, F, F, F, F, F, F, F, F, F, F, X, F, F, X],
    [X, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, X],
    [X, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, X],
    [X, F, F, X, F, F, F, F, F, F, F, F, F, F, F, F, X, F, F, X],
    [X, F, F, X, F, F, F, F, F, F, F, F, F, F, F, F, X, F, F, X],
    [X, F, F, X, X, X, F, F, F, F, F, F, F, F, X, X, X, F, F, X],
    [X, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, X],
    [X, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, X],
    [X, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, X],
    [X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X],
  ],
  treasures: [
    { x: 4, y: 5, gold: 100 },
    { x: 15, y: 9, gold: 100 },
    { x: 10, y: 7, gold: 200 },
  ],
  warps: [
    // ダンジョンから出る → フィールドの洞窟オブジェクト前
    { x: 9, y: 0, toMapId: 'field', toX: 24, toY: 33 },
    { x: 10, y: 0, toMapId: 'field', toX: 25, toY: 33 },
  ],
  encounter: {
    rate: 0.20,
    enemyIds: ['スケルトン', 'ゾンビ', 'オーク', 'ウルフ'],
  },
  fixedEnemies: [
    {
      x: 10,
      y: 13,
      templateName: '洞窟の主',
      spawnCondition: { key: 'quest_forest', op: '<', value: 2 },
    },
  ],
};

// 全マップの定義
export const MAPS: Record<string, MapDefinition> = {
  village: MAP_VILLAGE,
  field: MAP_FIELD,
  campsite: MAP_CAMPSITE,
  tent_interior: MAP_TENT_INTERIOR,
  dungeon: MAP_DUNGEON,
};

// 初期マップ（村の自宅からスタート）
export const INITIAL_MAP_ID = 'village';
