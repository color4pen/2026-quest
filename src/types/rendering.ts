import { PlayerState } from '../models/Player';
import { EnemyState } from '../models/Enemy';
import { NPCState } from '../models/NPC';
import { TreasureState } from '../models/Treasure';

// 描画定数
export const VIEWPORT_WIDTH = 20;  // 画面に表示するタイル数（横）
export const VIEWPORT_HEIGHT = 15; // 画面に表示するタイル数（縦）

// カメラ状態
export interface CameraState {
  x: number;              // カメラ中心のタイル座標X
  y: number;              // カメラ中心のタイル座標Y
  viewportWidth: number;  // 表示幅（タイル数）
  viewportHeight: number; // 表示高さ（タイル数）
}

// 草の装飾（描画専用）
export interface GrassDecoration {
  x: number;
  y: number;
}

/**
 * 描画可能なエンティティの型
 * 各モデルの状態をユニオンで表現
 */
export type RenderableEntity =
  | ({ entityType: 'player' } & PlayerState)
  | ({ entityType: 'enemy' } & EnemyState)
  | ({ entityType: 'npc' } & NPCState)
  | ({ entityType: 'treasure' } & TreasureState);
