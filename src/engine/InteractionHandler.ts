import { Position } from '../types/game';
import { Enemy, NPC } from '../models';
import { GameEntity, isInteractable } from '../models/base';

export type InteractionResult =
  | { type: 'dialogue'; npc: NPC }
  | { type: 'treasure'; gold: number }
  | { type: 'battle'; enemy: Enemy }
  | { type: 'blocked' }
  | { type: 'none' };

export class InteractionHandler {
  /**
   * 指定位置のインタラクション対象をチェックし、結果を返す
   */
  check(objects: GameEntity[], nextPosition: Position, player: GameEntity): InteractionResult {
    for (const obj of objects) {
      if (obj.isAt(nextPosition) && isInteractable(obj) && obj.canInteract()) {
        const result = obj.onInteract(player);

        switch (result.type) {
          case 'dialogue':
            return { type: 'dialogue', npc: result.data as NPC };
          case 'treasure':
            return { type: 'treasure', gold: (result.data as { gold: number }).gold };
          case 'battle':
            return { type: 'battle', enemy: result.data as Enemy };
        }

        if (result.blockMovement) {
          return { type: 'blocked' };
        }
      }
    }
    return { type: 'none' };
  }
}
