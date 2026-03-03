/**
 * ゲーム設定
 * ゲーム開始時の初期状態を定義
 */

import { ITEM_IDS, ItemId } from './itemIds';

/**
 * 初期インベントリ
 * アイテムの実体はItemFactoryで管理
 */
export const INITIAL_INVENTORY: { itemId: ItemId; quantity: number }[] = [
  { itemId: ITEM_IDS.POTION, quantity: 3 },
  { itemId: ITEM_IDS.BOMB, quantity: 2 },
  { itemId: ITEM_IDS.CALONAL, quantity: 10 },
  { itemId: ITEM_IDS.TAMIFLU, quantity: 10 },
  { itemId: ITEM_IDS.ANTIDOTE, quantity: 3 },
  { itemId: ITEM_IDS.WOODEN_SWORD, quantity: 1 },
  { itemId: ITEM_IDS.LEATHER_ARMOR, quantity: 1 },
  { itemId: ITEM_IDS.CAMERA, quantity: 1 },
];

/**
 * 初期ゴールド
 */
export const INITIAL_GOLD = 100;
