import { Item, ItemType, ItemUseContext, ItemUseResult } from './Item';

/**
 * 貴重品
 * 使用できないアイテム（コレクション用、イベント用など）
 */
export class ValuableItem extends Item {
  public readonly type: ItemType = 'valuable';

  constructor(id: string, name: string, description: string) {
    super(id, name, description);
  }

  canUseInMenu(): boolean {
    return false;
  }

  canUseInBattle(): boolean {
    return false;
  }

  canUse(_context: ItemUseContext): boolean {
    return false;
  }

  use(_context: ItemUseContext): ItemUseResult {
    return {
      success: false,
      message: this.getCannotUseReason({} as ItemUseContext),
    };
  }

  getCannotUseReason(_context: ItemUseContext): string {
    return 'このアイテムは使用できません';
  }
}
