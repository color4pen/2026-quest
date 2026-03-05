import {
  Position,
  NPCType,
  NPCDefinition,
  DialogueData,
  ShopItem,
  ConditionalStartId,
  MAP_WIDTH,
  MAP_HEIGHT,
} from '../types/game';
import { NPC_DEFINITIONS } from '../data/npcDefinitions';
import {
  GameEntity,
  GameEntityState,
  Interactable,
  InteractionResult,
} from './base';

/**
 * NPC状態（React用）
 */
export interface NPCState extends GameEntityState {
  npcId: string;
  name: string;
  type: NPCType;
  renderType?: 'npc' | 'computer';
}

/**
 * NPCクラス
 * GameEntityを継承し、Interactableを実装。
 * 会話・ショップ・宿屋データを所有。
 * 描画ロジックは持たない（プレゼンテーション層が担当）。
 */
export class NPC extends GameEntity implements Interactable {
  public readonly npcId: string;
  public readonly name: string;
  public readonly type: NPCType;
  public readonly image?: string;
  public readonly dialogue: DialogueData;
  public readonly conditionalStartIds?: ConditionalStartId[];
  public readonly shopItems?: ShopItem[];
  public readonly healCost?: number;
  public readonly renderType: 'npc' | 'computer';

  constructor(definition: NPCDefinition, x: number, y: number) {
    super(x, y);

    // NPC定義から設定
    this.npcId = definition.id;
    this.name = definition.name;
    this.type = definition.type;
    this.image = definition.image;
    this.dialogue = definition.dialogue;
    this.conditionalStartIds = definition.conditionalStartIds;
    this.shopItems = definition.shopItems;
    this.healCost = definition.healCost;
    this.renderType = definition.renderType === 'computer' ? 'computer' : 'npc';
  }

  // ==================== Interactable実装 ====================

  /**
   * プレイヤーとの相互作用（会話開始）
   */
  onInteract(_player: GameEntity): InteractionResult {
    return {
      type: 'dialogue',
      data: this,  // 自身を会話対象として渡す
      blockMovement: true,
    };
  }

  /**
   * インタラクション可能か
   */
  canInteract(): boolean {
    return this._active;
  }

  // ==================== 状態管理 ====================

  /**
   * 状態を取得（React用）
   */
  getState(): NPCState {
    return {
      ...this.getBaseState(),
      npcId: this.npcId,
      name: this.name,
      type: this.type,
      renderType: this.renderType,
    };
  }

  // ==================== ファクトリ ====================

  /**
   * NPCを生成（初期配置）
   */
  static spawnNPCs(
    playerPosition: Position,
    excludePositions: Position[]
  ): NPC[] {
    const npcs: NPC[] = [];
    const occupied = new Set([
      `${playerPosition.x},${playerPosition.y}`,
      ...excludePositions.map(p => `${p.x},${p.y}`),
    ]);

    // 各NPC定義に対してスポーン
    for (const definition of NPC_DEFINITIONS) {
      let x: number, y: number;
      let attempts = 0;
      const maxAttempts = 100;

      do {
        x = Math.floor(Math.random() * MAP_WIDTH);
        y = Math.floor(Math.random() * MAP_HEIGHT);
        attempts++;
      } while (
        attempts < maxAttempts &&
        (occupied.has(`${x},${y}`) ||
          // プレイヤーから少し離れた場所に配置
          Math.abs(x - playerPosition.x) + Math.abs(y - playerPosition.y) < 2)
      );

      if (attempts < maxAttempts) {
        occupied.add(`${x},${y}`);
        npcs.push(new NPC(definition, x, y));
      }
    }

    return npcs;
  }
}
