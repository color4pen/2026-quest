/**
 * アイテム使用結果
 */
export interface ItemUseResult {
  success: boolean;
  message: string;
  healedAmount?: number;
  damageDealt?: number;
  curedEffect?: string;
}

/**
 * アイテム使用コンテキスト
 * アイテム使用時に必要な情報を提供
 */
export interface ItemUseContext {
  targetHp: number;
  targetMaxHp: number;
  targetStatusEffects: string[];
  isInBattle: boolean;
}

/**
 * アイテムタイプ
 */
export type ItemType = 'heal' | 'cure' | 'damage' | 'buff' | 'valuable' | 'equipment';

/**
 * アイテム情報（シリアライズ用）
 */
export interface ItemInfo {
  id: string;
  name: string;
  description: string;
  type: ItemType;
}

/**
 * アイテム基底クラス
 * 全てのアイテムはこのクラスを継承する
 */
export abstract class Item {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public abstract readonly type: ItemType;

  constructor(id: string, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  /**
   * メニューから使用可能か
   */
  abstract canUseInMenu(): boolean;

  /**
   * 戦闘中に使用可能か
   */
  abstract canUseInBattle(): boolean;

  /**
   * 対象に使用可能かチェック
   */
  abstract canUse(context: ItemUseContext): boolean;

  /**
   * アイテムを使用
   * @returns 使用結果
   */
  abstract use(context: ItemUseContext): ItemUseResult;

  /**
   * 使用不可の理由を取得
   */
  abstract getCannotUseReason(context: ItemUseContext): string;

  /**
   * 敵に使用するアイテムか
   */
  isTargetEnemy(): boolean {
    return false;
  }

  /**
   * 味方に使用するアイテムか
   */
  isTargetAlly(): boolean {
    return false;
  }

  /**
   * シリアライズ用の情報を取得
   */
  getInfo(): ItemInfo {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
    };
  }
}
