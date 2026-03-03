import {
  Position,
  NPCType,
  NPCDefinition,
  DialogueData,
  ShopItem,
  ConditionalStartId,
  NPC_DEFINITIONS,
  MAP_WIDTH,
  MAP_HEIGHT,
} from '../types/game';
import {
  GameObject,
  GameObjectState,
  NPCRenderer,
  ComputerRenderer,
  Interactable,
  InteractionResult,
} from '../components/game';

/**
 * NPC状態（React用）
 */
export interface NPCState extends GameObjectState {
  npcId: string;
  name: string;
  type: NPCType;
}

/**
 * NPCクラス
 * GameObjectを継承し、Interactableを実装
 * 会話・ショップ・宿屋データを所有
 */
export class NPC extends GameObject implements Interactable {
  public readonly npcId: string;
  public readonly name: string;
  public readonly type: NPCType;
  public readonly image?: string;
  public readonly dialogue: DialogueData;
  public readonly conditionalStartIds?: ConditionalStartId[];
  public readonly shopItems?: ShopItem[];
  public readonly healCost?: number;

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

    // Rendererを設定（renderTypeに応じて切り替え）
    if (definition.renderType === 'computer') {
      this.renderer = new ComputerRenderer(this.transform);
    } else {
      // デフォルト: NPC種別で色を変える人型描画
      const colors = NPCRenderer.getColorsForType(this.type);
      this.renderer = new NPCRenderer(this.transform, colors);
    }
  }

  // ==================== Interactable実装 ====================

  /**
   * プレイヤーとの相互作用（会話開始）
   */
  onInteract(_player: GameObject): InteractionResult {
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
