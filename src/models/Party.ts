import { PartyMemberDefinition, PartyState, MAX_PARTY_SIZE, EquipmentSlot } from '../types/party';
import { PartyMember } from './PartyMember';
import { Item, ItemUseContext, ItemUseResult, EquipmentItem } from './items';
import { Inventory } from './Inventory';
import { INITIAL_INVENTORY, INITIAL_GOLD } from '../data/gameConfig';
import { Gold } from './values/Gold';

/**
 * パーティークラス
 * 複数のパーティーメンバーを管理し、共有リソース（お金・アイテム）を持つ
 */
export class Party {
  private members: PartyMember[] = [];
  private _gold: Gold = Gold.of(INITIAL_GOLD);
  private inventory: Inventory;

  constructor() {
    this.inventory = new Inventory(INITIAL_INVENTORY);
  }

  // ==================== メンバー管理 ====================

  /**
   * メンバーを追加
   * @returns 追加成功したかどうか（満員の場合false）
   */
  addMember(definition: PartyMemberDefinition): boolean {
    if (this.isFull()) {
      return false;
    }

    // 同じIDのメンバーがいたら追加しない
    if (this.members.some(m => m.id === definition.id)) {
      return false;
    }

    this.members.push(new PartyMember(definition));
    return true;
  }

  /**
   * メンバーを削除
   */
  removeMember(memberId: string): PartyMember | null {
    const index = this.members.findIndex(m => m.id === memberId);
    if (index === -1) {
      return null;
    }
    return this.members.splice(index, 1)[0];
  }

  /**
   * インデックスでメンバーを取得
   */
  getMember(index: number): PartyMember | null {
    return this.members[index] ?? null;
  }

  /**
   * IDでメンバーを取得
   */
  getMemberById(id: string): PartyMember | null {
    return this.members.find(m => m.id === id) ?? null;
  }

  /**
   * 全メンバーを取得
   */
  getMembers(): PartyMember[] {
    return [...this.members];
  }

  /**
   * 生存メンバーを取得
   */
  getAliveMembers(): PartyMember[] {
    return this.members.filter(m => m.isAlive());
  }

  /**
   * メンバー数を取得
   */
  getMemberCount(): number {
    return this.members.length;
  }

  /**
   * パーティーが満員か
   */
  isFull(): boolean {
    return this.members.length >= MAX_PARTY_SIZE;
  }

  /**
   * 全員死亡か
   */
  isAllDead(): boolean {
    return this.members.length > 0 && this.members.every(m => m.isDead());
  }

  /**
   * リーダー（先頭メンバー）を取得
   */
  getLeader(): PartyMember | null {
    return this.members[0] ?? null;
  }

  // ==================== 共有リソース管理 ====================

  /**
   * 所持金を取得
   */
  getGold(): number {
    return this._gold.amount;
  }

  /**
   * お金を追加
   */
  addGold(amount: number): void {
    this._gold = this._gold.add(amount);
  }

  /**
   * お金を使う
   * @returns 使用成功したかどうか
   */
  spendGold(amount: number): boolean {
    const result = this._gold.spend(amount);
    if (!result) return false;
    this._gold = result;
    return true;
  }

  /**
   * アイテムをIDで取得
   */
  getItem(itemId: string): Item | null {
    return this.inventory.getItem(itemId);
  }

  /**
   * アイテムを追加（IDで）
   */
  addItemById(itemId: string, quantity: number = 1): void {
    this.inventory.addById(itemId, quantity);
  }

  /**
   * アイテムを追加（Itemオブジェクトで）
   */
  addItem(item: Item, quantity: number = 1): void {
    this.inventory.add(item, quantity);
  }

  /**
   * アイテムを使用
   * @param itemId アイテムID
   * @param target 使用対象のメンバー
   * @param isInBattle 戦闘中かどうか
   * @returns 使用結果
   */
  useItemOnMember(itemId: string, target: PartyMember, isInBattle: boolean = false): ItemUseResult {
    const item = this.inventory.getItem(itemId);
    if (!item || !this.inventory.has(itemId)) {
      return { success: false, message: 'アイテムがありません' };
    }

    const context: ItemUseContext = {
      targetHp: target.hp,
      targetMaxHp: target.getEffectiveMaxHp(),
      targetStatusEffects: target.getStatusEffects().map(e => e.type),
      isInBattle,
    };

    // 使用可能かチェック
    if (!item.canUse(context)) {
      return { success: false, message: item.getCannotUseReason(context) };
    }

    // アイテムを使用
    const result = item.use(context);

    if (result.success) {
      // 効果を適用
      if (result.healedAmount !== undefined) {
        target.heal(result.healedAmount);
      }
      if (result.curedEffect !== undefined) {
        target.removeStatusEffect(result.curedEffect as 'poison' | 'influenza');
      }

      // 数量を減らす
      this.inventory.consume(itemId);
    }

    return result;
  }

  /**
   * アイテムを消費（戦闘用ダメージアイテムなど）
   * @returns 消費したアイテム（なければnull）
   */
  consumeItem(itemId: string): Item | null {
    return this.inventory.consume(itemId);
  }

  /**
   * アイテムの所持数を取得
   */
  getItemCount(itemId: string): number {
    return this.inventory.getQuantity(itemId);
  }

  // ==================== パーティー全体操作 ====================

  /**
   * 戦闘後の回復（全員）
   */
  recoverAllAfterBattle(): void {
    this.members.forEach(m => m.recoverAfterBattle());
  }

  /**
   * 全員を全回復
   */
  fullHealAll(): void {
    this.members.forEach(m => m.fullRecover());
  }

  /**
   * 全員の防御状態をリセット
   */
  resetAllDefend(): void {
    this.members.forEach(m => m.resetDefend());
  }

  /**
   * パーティーをリセット（ゲームリセット用）
   */
  reset(): void {
    this.members = [];
    this._gold = Gold.of(INITIAL_GOLD);
    this.inventory = new Inventory(INITIAL_INVENTORY);
  }

  /**
   * インベントリをクリア（セーブデータ復元用）
   */
  clearInventory(): void {
    this.inventory = new Inventory([]);
  }

  // ==================== 装備管理 ====================

  /**
   * メンバーに装備品を装備させる
   * @param memberId メンバーID
   * @param itemId 装備品のアイテムID
   * @returns 装備成功したかどうか
   */
  equipItem(memberId: string, itemId: string): { success: boolean; message: string } {
    const member = this.getMemberById(memberId);
    if (!member) {
      return { success: false, message: 'メンバーが見つかりません' };
    }

    const item = this.inventory.getItem(itemId);
    if (!item || !this.inventory.has(itemId)) {
      return { success: false, message: 'アイテムがありません' };
    }

    if (!(item instanceof EquipmentItem)) {
      return { success: false, message: 'このアイテムは装備できません' };
    }

    // 装備を実行（前の装備がインベントリに戻る）
    const previousEquipment = member.equip(item);

    // インベントリから装備品を削除
    this.inventory.consume(itemId);

    // 前の装備をインベントリに戻す
    if (previousEquipment) {
      this.addItem(previousEquipment);
    }

    return { success: true, message: `${member.name}は${item.name}を装備した！` };
  }

  /**
   * メンバーの装備を外す
   * @param memberId メンバーID
   * @param slot 装備スロット
   * @returns 外した装備品（なければnull）
   */
  unequipItem(memberId: string, slot: EquipmentSlot): { success: boolean; message: string } {
    const member = this.getMemberById(memberId);
    if (!member) {
      return { success: false, message: 'メンバーが見つかりません' };
    }

    const item = member.unequip(slot);
    if (!item) {
      return { success: false, message: '何も装備していません' };
    }

    // インベントリに戻す
    this.addItem(item);

    return { success: true, message: `${item.name}を外した` };
  }

  /**
   * 装備可能なアイテム一覧を取得
   */
  getEquippableItems(): EquipmentItem[] {
    return this.inventory.getEquipmentItems();
  }

  /**
   * 指定スロットの装備可能なアイテム一覧を取得
   */
  getEquippableItemsForSlot(slot: EquipmentSlot): EquipmentItem[] {
    return this.inventory.getEquipmentForSlot(slot);
  }

  // ==================== 状態取得 ====================

  /**
   * 状態を取得（React用）
   */
  getState(): PartyState {
    return {
      members: this.members.map(m => m.getState()),
      gold: this._gold.amount,
      inventory: this.inventory.getState(),
    };
  }
}
