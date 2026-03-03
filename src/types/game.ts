// 定数
export const TILE_SIZE = 32;
export const VIEWPORT_WIDTH = 20;  // 画面に表示するタイル数（横）
export const VIEWPORT_HEIGHT = 15; // 画面に表示するタイル数（縦）
export const MAP_WIDTH = 20;       // 後方互換性のため残す
export const MAP_HEIGHT = 15;      // 後方互換性のため残す
export const MAX_MESSAGES = 50;

// カメラ状態
export interface CameraState {
  x: number;              // カメラ中心のタイル座標X
  y: number;              // カメラ中心のタイル座標Y
  viewportWidth: number;  // 表示幅（タイル数）
  viewportHeight: number; // 表示高さ（タイル数）
}

// 基本型
export type TileType =
  | 'grass'    // 草地（エンカウントあり）
  | 'tree'     // 木（通行不可）
  | 'path'     // 道（エンカウントなし）
  | 'water'    // 水（通行不可）
  | 'floor'    // 室内床
  | 'wall'     // 壁（通行不可）
  | 'stairs'   // 階段（ワープポイント）
  | 'door'     // 扉
  | 'sand'     // 砂地
  | 'bridge'   // 橋（水上を通過可能）
  // 村オブジェクト（2x2）
  | 'village_tl'  // 村・左上
  | 'village_tr'  // 村・右上
  | 'village_bl'  // 村・左下（入り口）
  | 'village_br'  // 村・右下（入り口）
  // 洞窟オブジェクト（2x2）
  | 'cave_tl'     // 洞窟・左上
  | 'cave_tr'     // 洞窟・右上
  | 'cave_bl'     // 洞窟・左下（入り口）
  | 'cave_br';    // 洞窟・右下（入り口）

export type Direction = 'up' | 'down' | 'left' | 'right';
export type MessageType = 'normal' | 'combat' | 'loot' | 'level-up';

// インターフェース
export interface Position {
  x: number;
  y: number;
}

export interface GrassDecoration {
  x: number;
  y: number;
}

export interface Message {
  id: number;
  text: string;
  type: MessageType;
}

// 敵の基本ステータス
export const ENEMY_BASE_STATS = {
  hp: 30,
  attack: 5,
  xpReward: 25,
  goldMin: 10,
  goldMax: 30,
} as const;

// エンカウント設定
export interface EncounterConfig {
  rate: number;              // エンカウント率（0.0〜1.0、1歩ごとの確率）
  enemyIds: string[];        // 出現する敵の名前リスト
}

// ワープポイント定義
export interface WarpPoint {
  x: number;
  y: number;
  toMapId: string;
  toX: number;
  toY: number;
}

// NPC配置定義
export interface NPCPlacement {
  npcId: string;
  x: number;
  y: number;
}

// 宝箱配置定義
export interface TreasurePlacement {
  x: number;
  y: number;
  gold: number;
}

// 扉配置定義（通過条件付き）
//
// TODO: 鍵などパラメータ付き条件を実装する場合の改善案
// 現在の設計では condition が string のため、パラメータを渡せない。
//
// 改善案: condition をオブジェクトに変更
//   condition?: { type: string; params?: Record<string, unknown> }
//   例: { type: 'has_key', params: { keyId: 'red_key' } }
//
// 鍵システム実装時に必要なもの:
// - アイテムに 'key' タイプを追加
// - Party.hasItem(itemId): boolean メソッド
// - 鍵を消費するかどうかのオプション（consumeOnUse: boolean）
//
export interface DoorPlacement {
  id: string;           // 扉の識別子
  x: number;
  y: number;
  condition?: string;   // 通過条件タイプ（'no_influenza' など）
}

// 固定敵配置定義（ボスなど）
export interface FixedEnemyPlacement {
  x: number;
  y: number;
  templateName: string;  // ENEMY_TEMPLATES の name
  spawnCondition?: {     // 出現条件（省略時は常に出現）
    key: string;
    op: '<' | '<=' | '==' | '!=' | '>=' | '>';
    value: number;
  };
}

// マップ定義
export interface MapDefinition {
  id: string;
  name: string;
  tiles: TileType[][];
  playerStart: Position;
  npcs?: NPCPlacement[];
  treasures?: TreasurePlacement[];
  warps?: WarpPoint[];
  doors?: DoorPlacement[];  // 条件付き扉
  fixedEnemies?: FixedEnemyPlacement[];  // 固定敵（ボスなど）
  encounter?: EncounterConfig;  // なければエンカウントなし
}

// バトル関連の型をre-export
export * from './battle';

// NPC関連の型をre-export
export * from './npc';

// パーティー関連の型をre-export
export * from './party';
