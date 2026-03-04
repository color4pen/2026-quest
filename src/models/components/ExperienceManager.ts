import { DEFAULT_LEVEL_UP_BONUS } from '../../types/party';

/**
 * レベルアップ時のボーナス設定
 */
export interface LevelUpBonus {
  hp: number;
  mp: number;
  attack: number;
}

/**
 * レベルアップ結果
 */
export interface LevelUpResult {
  newLevel: number;
  hpBonus: number;
  mpBonus: number;
  attackBonus: number;
}

/**
 * 経験値・レベル管理
 */
export class ExperienceManager {
  private _level: number;
  private _xp: number;
  private _xpToNext: number;
  private readonly levelUpBonus: LevelUpBonus;

  constructor(levelUpBonus?: Partial<LevelUpBonus>) {
    this._level = 1;
    this._xp = 0;
    this._xpToNext = 100;
    this.levelUpBonus = {
      hp: levelUpBonus?.hp ?? DEFAULT_LEVEL_UP_BONUS.hp,
      mp: levelUpBonus?.mp ?? DEFAULT_LEVEL_UP_BONUS.mp,
      attack: levelUpBonus?.attack ?? DEFAULT_LEVEL_UP_BONUS.attack,
    };
  }

  get level(): number {
    return this._level;
  }

  get xp(): number {
    return this._xp;
  }

  get xpToNext(): number {
    return this._xpToNext;
  }

  /**
   * 経験値を獲得
   * @returns レベルアップした場合はその結果、しなかった場合はnull
   */
  gainXp(amount: number): LevelUpResult | null {
    this._xp += amount;

    if (this._xp >= this._xpToNext) {
      return this.levelUp();
    }

    return null;
  }

  /**
   * レベルアップ処理
   */
  private levelUp(): LevelUpResult {
    this._level++;
    this._xp -= this._xpToNext;
    this._xpToNext = Math.floor(this._xpToNext * DEFAULT_LEVEL_UP_BONUS.xpMultiplier);

    return {
      newLevel: this._level,
      hpBonus: this.levelUpBonus.hp,
      mpBonus: this.levelUpBonus.mp,
      attackBonus: this.levelUpBonus.attack,
    };
  }

  /**
   * セーブデータから状態を復元
   */
  restoreState(level: number, xp: number, xpToNext: number): void {
    this._level = level;
    this._xp = xp;
    this._xpToNext = xpToNext;
  }
}
