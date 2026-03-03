/**
 * 装備ステータスブロック値オブジェクト
 *
 * 装備品のステータスボーナスを不変オブジェクトとして管理。
 * 複数装備の合算処理を一元化する。
 */
import type { EquipmentStats } from '../../types/party';

export class EquipmentStatBlock {
  constructor(
    readonly attack: number = 0,
    readonly defense: number = 0,
    readonly maxHp: number = 0,
    readonly maxMp: number = 0,
  ) {}

  /** ゼロ値 */
  static readonly ZERO = new EquipmentStatBlock(0, 0, 0, 0);

  /** EquipmentStats インターフェースから変換 */
  static fromEquipmentStats(stats: EquipmentStats): EquipmentStatBlock {
    return new EquipmentStatBlock(
      stats.attack ?? 0,
      stats.defense ?? 0,
      stats.maxHp ?? 0,
      stats.maxMp ?? 0,
    );
  }

  /** 2つのブロックを加算した新しいブロックを返す */
  add(other: EquipmentStatBlock): EquipmentStatBlock {
    return new EquipmentStatBlock(
      this.attack + other.attack,
      this.defense + other.defense,
      this.maxHp + other.maxHp,
      this.maxMp + other.maxMp,
    );
  }

  /** 複数ブロックを合算（null は無視） */
  static sum(...blocks: (EquipmentStatBlock | null)[]): EquipmentStatBlock {
    let result = EquipmentStatBlock.ZERO;
    for (const block of blocks) {
      if (block) {
        result = result.add(block);
      }
    }
    return result;
  }
}
