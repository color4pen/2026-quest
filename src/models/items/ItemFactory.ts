import { Item } from './Item';
import { HealItem } from './HealItem';
import { CureItem } from './CureItem';
import { DamageItem } from './DamageItem';
import { ValuableItem } from './ValuableItem';
import { EquipmentItem } from './EquipmentItem';
import type { EquipmentSlot, EquipmentStats } from '../../types/party';

/**
 * アイテム定義（ファクトリ用）
 * battle.ts の ItemDefinition と互換性を持たせる
 */
export interface ItemDefinitionData {
  id: string;
  name: string;
  description: string;
  type: 'heal' | 'cure' | 'damage' | 'valuable' | 'equipment' | 'buff';
  value?: number;
  target?: 'enemy' | 'self' | 'none';  // バトル時のターゲット
  cureEffect?: string;
  // 装備品用
  slot?: EquipmentSlot;
  stats?: EquipmentStats;
}

/**
 * 全アイテム定義
 */
const ITEM_DEFINITIONS: ItemDefinitionData[] = [
  // 回復アイテム
  {
    id: 'potion',
    name: 'ポーション',
    description: 'HPを50回復',
    type: 'heal',
    value: 50,
    target: 'self',
  },
  {
    id: 'hi_potion',
    name: 'ハイポーション',
    description: 'HPを100回復',
    type: 'heal',
    value: 100,
    target: 'self',
  },
  {
    id: 'calonal',
    name: 'カロナール',
    description: 'HPを30回復',
    type: 'heal',
    value: 30,
    target: 'self',
  },
  // ダメージアイテム
  {
    id: 'bomb',
    name: '爆弾',
    description: '敵に50ダメージ',
    type: 'damage',
    value: 50,
    target: 'enemy',
  },
  // 治療アイテム
  {
    id: 'tamiflu',
    name: 'タミフル',
    description: 'インフルエンザを治す',
    type: 'cure',
    value: 0,
    target: 'self',
    cureEffect: 'influenza',
  },
  {
    id: 'antidote',
    name: 'どくけし草',
    description: '毒状態を治す',
    type: 'cure',
    value: 0,
    target: 'self',
    cureEffect: 'poison',
  },
  {
    id: 'elixir',
    name: '秘薬',
    description: 'HP・MPを完全回復する伝説の薬',
    type: 'heal',
    value: 9999,
    target: 'self',
  },
  // 貴重品
  {
    id: 'camera',
    name: 'カメラ',
    description: '思い出を記録する貴重品',
    type: 'valuable',
    value: 0,
    target: 'none',
  },

  // ==================== 装備品：武器 ====================
  {
    id: 'wooden_sword',
    name: '木の剣',
    description: '初心者用の木製の剣',
    type: 'equipment',
    slot: 'weapon',
    stats: { attack: 3 },
  },
  {
    id: 'iron_sword',
    name: '鉄の剣',
    description: '丈夫な鉄製の剣',
    type: 'equipment',
    slot: 'weapon',
    stats: { attack: 8 },
  },
  {
    id: 'steel_sword',
    name: '鋼の剣',
    description: '鋭い切れ味の鋼鉄の剣',
    type: 'equipment',
    slot: 'weapon',
    stats: { attack: 15 },
  },
  {
    id: 'magic_staff',
    name: '魔法の杖',
    description: '魔力を高める杖',
    type: 'equipment',
    slot: 'weapon',
    stats: { attack: 5, maxMp: 20 },
  },

  // ==================== 装備品：防具 ====================
  {
    id: 'leather_armor',
    name: '革の鎧',
    description: '軽くて動きやすい革製の鎧',
    type: 'equipment',
    slot: 'armor',
    stats: { defense: 3 },
  },
  {
    id: 'iron_armor',
    name: '鉄の鎧',
    description: '頑丈な鉄製の鎧',
    type: 'equipment',
    slot: 'armor',
    stats: { defense: 8 },
  },
  {
    id: 'steel_armor',
    name: '鋼の鎧',
    description: '最高級の防御力を誇る鎧',
    type: 'equipment',
    slot: 'armor',
    stats: { defense: 15 },
  },
  {
    id: 'mage_robe',
    name: '魔法使いのローブ',
    description: '魔力を高める特殊なローブ',
    type: 'equipment',
    slot: 'armor',
    stats: { defense: 2, maxMp: 30 },
  },

  // ==================== 装備品：装飾品 ====================
  {
    id: 'power_ring',
    name: '力の指輪',
    description: '装着者の攻撃力を高める',
    type: 'equipment',
    slot: 'accessory',
    stats: { attack: 5 },
  },
  {
    id: 'guard_ring',
    name: '守りの指輪',
    description: '装着者の防御力を高める',
    type: 'equipment',
    slot: 'accessory',
    stats: { defense: 5 },
  },
  {
    id: 'life_pendant',
    name: '命のペンダント',
    description: '最大HPを増加させる',
    type: 'equipment',
    slot: 'accessory',
    stats: { maxHp: 30 },
  },
  {
    id: 'mana_pendant',
    name: '魔力のペンダント',
    description: '最大MPを増加させる',
    type: 'equipment',
    slot: 'accessory',
    stats: { maxMp: 20 },
  },
];

/**
 * アイテムファクトリ
 * IDからアイテムインスタンスを生成
 */
export class ItemFactory {
  private static definitionCache: Map<string, ItemDefinitionData> = new Map();

  /**
   * IDからアイテムを生成
   * 毎回新しいインスタンスを返す（mutation リスクを排除）
   */
  static create(id: string): Item {
    let definition = this.definitionCache.get(id);
    if (!definition) {
      definition = ITEM_DEFINITIONS.find(d => d.id === id);
      if (!definition) {
        throw new Error(`Unknown item id: ${id}`);
      }
      this.definitionCache.set(id, definition);
    }

    return this.createFromDefinition(definition);
  }

  /**
   * 定義からアイテムを生成
   */
  private static createFromDefinition(def: ItemDefinitionData): Item {
    switch (def.type) {
      case 'heal':
        return new HealItem(def.id, def.name, def.description, def.value ?? 0);
      case 'damage':
        return new DamageItem(def.id, def.name, def.description, def.value ?? 0);
      case 'cure':
        if (!def.cureEffect) {
          throw new Error(`Cure item ${def.id} requires cureEffect`);
        }
        return new CureItem(
          def.id,
          def.name,
          def.description,
          def.cureEffect as 'poison' | 'influenza'
        );
      case 'valuable':
        return new ValuableItem(def.id, def.name, def.description);
      case 'equipment':
        if (!def.slot || !def.stats) {
          throw new Error(`Equipment item ${def.id} requires slot and stats`);
        }
        return new EquipmentItem(
          def.id,
          def.name,
          def.description,
          def.slot,
          def.stats
        );
      default:
        throw new Error(`Unknown item type: ${def.type}`);
    }
  }

  /**
   * 全アイテムIDを取得
   */
  static getAllIds(): string[] {
    return ITEM_DEFINITIONS.map(d => d.id);
  }

  /**
   * IDが存在するかチェック
   */
  static exists(id: string): boolean {
    return ITEM_DEFINITIONS.some(d => d.id === id);
  }

  /**
   * キャッシュをクリア（テスト用）
   */
  static clearCache(): void {
    this.definitionCache.clear();
  }

  /**
   * IDからアイテム定義を取得（インスタンス化せずに定義のみ）
   */
  static getDefinition(id: string): ItemDefinitionData | undefined {
    return ITEM_DEFINITIONS.find(d => d.id === id);
  }

  /**
   * 全アイテム定義を取得
   */
  static getAllDefinitions(): ItemDefinitionData[] {
    return [...ITEM_DEFINITIONS];
  }

  /**
   * 消費アイテム（heal, cure, damage）の定義を取得
   */
  static getConsumableDefinitions(): ItemDefinitionData[] {
    return ITEM_DEFINITIONS.filter(d =>
      d.type === 'heal' || d.type === 'cure' || d.type === 'damage'
    );
  }

  /**
   * 装備品の定義を取得
   */
  static getEquipmentDefinitions(): ItemDefinitionData[] {
    return ITEM_DEFINITIONS.filter(d => d.type === 'equipment');
  }
}
