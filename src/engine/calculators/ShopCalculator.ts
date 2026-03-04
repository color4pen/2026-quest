/**
 * ショップ関連のロジック（純粋関数）
 */

import { ShopItem } from '../../types/game';
import { GameCommand, CommandResult, successResult, failureResult } from './types';

/**
 * アイテム購入の判定とコマンド生成
 */
export function calculatePurchaseCommands(
  shopItem: ShopItem,
  currentGold: number
): CommandResult {
  // ゴールド不足
  if (currentGold < shopItem.price) {
    return failureResult('ゴールドが足りない！');
  }

  // 在庫切れ
  if (shopItem.stock === 0) {
    return failureResult('在庫切れだ！');
  }

  const commands: GameCommand[] = [
    { type: 'spendGold', amount: shopItem.price },
    { type: 'addItem', itemId: shopItem.item.id, quantity: 1 },
    { type: 'addMessage', text: `${shopItem.item.name}を購入した！`, messageType: 'loot' },
  ];

  return successResult(`${shopItem.item.name}を購入した！`, commands);
}
