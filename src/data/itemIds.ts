/**
 * アイテムID定数
 * マジックストリングを避けるため、全アイテムIDを定数化
 */
export const ITEM_IDS = {
  // 回復アイテム
  POTION: 'potion',
  HI_POTION: 'hi_potion',
  CALONAL: 'calonal',
  ELIXIR: 'elixir',

  // ダメージアイテム
  BOMB: 'bomb',

  // 治療アイテム
  TAMIFLU: 'tamiflu',
  ANTIDOTE: 'antidote',

  // 貴重品
  CAMERA: 'camera',

  // 武器
  WOODEN_SWORD: 'wooden_sword',
  IRON_SWORD: 'iron_sword',
  STEEL_SWORD: 'steel_sword',
  MAGIC_STAFF: 'magic_staff',

  // 防具
  LEATHER_ARMOR: 'leather_armor',
  IRON_ARMOR: 'iron_armor',
  STEEL_ARMOR: 'steel_armor',
  MAGE_ROBE: 'mage_robe',

  // 装飾品
  POWER_RING: 'power_ring',
  GUARD_RING: 'guard_ring',
  LIFE_PENDANT: 'life_pendant',
  MANA_PENDANT: 'mana_pendant',
} as const;

export type ItemId = typeof ITEM_IDS[keyof typeof ITEM_IDS];
