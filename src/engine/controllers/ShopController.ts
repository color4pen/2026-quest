import { ShopState, ShopItem, MessageType } from '../../types/game';
import { NPC, Party } from '../../models';
import { GameCommand } from '../calculators/types';
import { calculatePurchaseCommands } from '../calculators/ShopCalculator';

export interface ShopCallbacks {
  executeCommands: (commands: GameCommand[]) => void;
  addMessage: (text: string, type: MessageType) => void;
  onShopOpen: (state: ShopState) => void;
  onShopClose: () => void;
  notifyListeners: () => void;
}

/**
 * ショップフェーズを制御
 */
export class ShopController {
  private state: ShopState | null = null;

  constructor(
    private party: Party,
    private callbacks: ShopCallbacks
  ) {}

  /**
   * ショップを開く
   */
  public open(npc: NPC): void {
    if (!npc.shopItems) return;

    this.state = {
      isActive: true,
      shopName: npc.name,
      items: npc.shopItems.map((item) => ({
        ...item,
        item: { ...item.item },
      })),
    };

    this.callbacks.onShopOpen(this.state);
    this.callbacks.notifyListeners();
  }

  /**
   * アイテムを購入
   */
  public buyItem(shopItem: ShopItem): boolean {
    const result = calculatePurchaseCommands(shopItem, this.party.getGold());

    if (!result.success) {
      this.callbacks.addMessage(result.message, 'normal');
      this.callbacks.notifyListeners();
      return false;
    }

    this.callbacks.executeCommands(result.commands);

    // 在庫を減らす
    if (shopItem.stock > 0) {
      shopItem.stock--;
    }

    this.callbacks.notifyListeners();
    return true;
  }

  /**
   * ショップを閉じる
   */
  public close(): void {
    this.state = null;
    this.callbacks.onShopClose();
    this.callbacks.notifyListeners();
  }

  /**
   * ショップ状態を取得
   */
  public getState(): ShopState | null {
    return this.state;
  }

  /**
   * ショップが開いているかどうか
   */
  public isActive(): boolean {
    return this.state !== null;
  }
}
