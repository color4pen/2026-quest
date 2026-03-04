import { ItemDefinitionData } from '../models/items/ItemFactory';

// NPC種別
export type NPCType = 'villager' | 'shopkeeper' | 'innkeeper';

// ゲーム状態の条件
export interface StateCondition {
  key: string;           // STATE_KEYS の値
  op: '==' | '!=' | '>=' | '>' | '<=' | '<';
  value: number;
}

// 条件付き会話開始ID
export interface ConditionalStartId {
  conditions: StateCondition[];  // AND条件（すべて満たす必要あり）
  startId: string;
}

// 会話選択肢
export interface DialogueChoice {
  id: string;
  text: string;
  action?: DialogueAction;
  nextDialogueId?: string;
}

// 選択肢のアクション
export type DialogueAction =
  | { type: 'none' }
  | { type: 'open_shop' }
  | { type: 'heal'; cost: number }
  | { type: 'give_item'; item: ItemDefinitionData; quantity: number }
  | { type: 'set_state'; key: string; value: number }
  | { type: 'close' };

// 会話ノード
export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
  nextId?: string;  // 選択肢がない場合の次のノード
}

// 会話データ
export interface DialogueData {
  startId: string;
  nodes: DialogueNode[];
}

// 会話状態
export interface DialogueState {
  isActive: boolean;
  npcName: string;
  npcType: NPCType;
  npcImage?: string;  // NPC画像パス
  currentNode: DialogueNode | null;
  isComplete: boolean;
}

// ショップ状態
export interface ShopState {
  isActive: boolean;
  shopName: string;
  items: ShopItem[];
}

// ショップアイテム
export interface ShopItem {
  item: ItemDefinitionData;
  price: number;
  stock: number;  // -1 = 無限
}

// NPC描画タイプ
export type NPCRenderType = 'npc' | 'computer';

// NPC定義
export interface NPCDefinition {
  id: string;
  name: string;
  type: NPCType;
  renderType?: NPCRenderType;  // 描画タイプ（デフォルト: 'npc'）
  image?: string;  // 画像パス（例: '/assets/images/npcs/villager.png'）
  dialogue: DialogueData;
  /** 条件付き会話開始（上から順に評価、最初にマッチしたものを使用） */
  conditionalStartIds?: ConditionalStartId[];
  shopItems?: ShopItem[];
  healCost?: number;
}
