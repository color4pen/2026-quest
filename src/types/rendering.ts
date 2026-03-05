import { PlayerState } from '../models/Player';
import { EnemyState } from '../models/Enemy';
import { NPCState } from '../models/NPC';
import { TreasureState } from '../models/Treasure';

/**
 * 描画可能なエンティティの型
 * 各モデルの状態をユニオンで表現
 */
export type RenderableEntity =
  | ({ entityType: 'player' } & PlayerState)
  | ({ entityType: 'enemy' } & EnemyState)
  | ({ entityType: 'npc' } & NPCState)
  | ({ entityType: 'treasure' } & TreasureState);
