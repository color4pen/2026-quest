import { Item, ItemFactory, EquipmentItem } from './items';
import { EquipmentSlot } from '../types/party';

/**
 * インベントリエントリ
 */
export interface InventoryEntry {
  item: Item;
  quantity: number;
}

/**
 * インベントリ状態（React用）
 */
export interface InventoryState {
  item: ReturnType<Item['getInfo']>;
  quantity: number;
  canUseInMenu: boolean;
  canUseInBattle: boolean;
}

/**
 * インベントリ管理クラス
 * アイテムの追加・削除・検索を一元管理
 */
export class Inventory {
  private entries: Map<string, InventoryEntry> = new Map();

  constructor(initialItems?: { itemId: string; quantity: number }[]) {
    if (initialItems) {
      for (const { itemId, quantity } of initialItems) {
        this.addById(itemId, quantity);
      }
    }
  }

  // ==================== 検索 ====================

  /**
   * アイテムIDでエントリを取得
   */
  getEntry(itemId: string): InventoryEntry | null {
    return this.entries.get(itemId) ?? null;
  }

  /**
   * アイテムIDでアイテムを取得
   */
  getItem(itemId: string): Item | null {
    return this.entries.get(itemId)?.item ?? null;
  }

  /**
   * アイテムの所持数を取得
   */
  getQuantity(itemId: string): number {
    return this.entries.get(itemId)?.quantity ?? 0;
  }

  /**
   * アイテムを持っているか
   */
  has(itemId: string): boolean {
    const entry = this.entries.get(itemId);
    return entry !== undefined && entry.quantity > 0;
  }

  // ==================== 追加・削除 ====================

  /**
   * アイテムをIDで追加
   */
  addById(itemId: string, quantity: number = 1): void {
    const existing = this.entries.get(itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      const item = ItemFactory.create(itemId);
      this.entries.set(itemId, { item, quantity });
    }
  }

  /**
   * アイテムオブジェクトで追加
   */
  add(item: Item, quantity: number = 1): void {
    const existing = this.entries.get(item.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.entries.set(item.id, { item, quantity });
    }
  }

  /**
   * アイテムを1つ消費
   * @returns 消費したアイテム（ない場合はnull）
   */
  consume(itemId: string): Item | null {
    const entry = this.entries.get(itemId);
    if (!entry || entry.quantity <= 0) {
      return null;
    }

    entry.quantity--;
    const item = entry.item;

    if (entry.quantity <= 0) {
      this.entries.delete(itemId);
    }

    return item;
  }

  /**
   * アイテムを削除（数量指定）
   * @returns 実際に削除した数
   */
  remove(itemId: string, quantity: number = 1): number {
    const entry = this.entries.get(itemId);
    if (!entry) {
      return 0;
    }

    const removed = Math.min(entry.quantity, quantity);
    entry.quantity -= removed;

    if (entry.quantity <= 0) {
      this.entries.delete(itemId);
    }

    return removed;
  }

  // ==================== フィルタリング ====================

  /**
   * 全エントリを取得
   */
  getAll(): InventoryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * 装備可能アイテムを取得
   */
  getEquipmentItems(): EquipmentItem[] {
    return this.getAll()
      .filter(entry => entry.item instanceof EquipmentItem)
      .map(entry => entry.item as EquipmentItem);
  }

  /**
   * 特定スロットの装備アイテムを取得
   */
  getEquipmentForSlot(slot: EquipmentSlot): EquipmentItem[] {
    return this.getAll()
      .filter(entry => entry.item instanceof EquipmentItem && entry.item.slot === slot)
      .map(entry => entry.item as EquipmentItem);
  }

  /**
   * 戦闘で使用可能なアイテムを取得
   */
  getBattleItems(): InventoryEntry[] {
    return this.getAll().filter(entry => entry.item.canUseInBattle());
  }

  /**
   * メニューで使用可能なアイテムを取得
   */
  getMenuItems(): InventoryEntry[] {
    return this.getAll().filter(entry => entry.item.canUseInMenu());
  }

  // ==================== 状態 ====================

  /**
   * インベントリをクリア
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * アイテム数を取得
   */
  get size(): number {
    return this.entries.size;
  }

  /**
   * 総アイテム数（数量合計）を取得
   */
  get totalQuantity(): number {
    let total = 0;
    for (const entry of this.entries.values()) {
      total += entry.quantity;
    }
    return total;
  }

  /**
   * 状態を取得（React用）
   */
  getState(): InventoryState[] {
    return this.getAll().map(entry => ({
      item: entry.item.getInfo(),
      quantity: entry.quantity,
      canUseInMenu: entry.item.canUseInMenu(),
      canUseInBattle: entry.item.canUseInBattle(),
    }));
  }
}
