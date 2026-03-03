import { SkillDefinition } from '../types/game';
import {
  PartyMemberClass,
  PartyMemberDefinition,
  PartyMemberState,
  DEFAULT_LEVEL_UP_BONUS,
  EquipmentSlot,
  EquipmentSlotState,
} from '../types/party';
import type { StatusEffect, StatusEffectType, StatusEffectInfo } from '../types/statusEffect';
import { StatusEffectFactory } from './statusEffects';
import { EquipmentItem } from './items/EquipmentItem';
import { CombatCalculator } from '../engine/CombatCalculator';
import { HitPoints } from './values/HitPoints';
import { ManaPoints } from './values/ManaPoints';
import { EquipmentStatBlock } from './values/EquipmentStatBlock';

/**
 * パーティーメンバークラス
 * 個別のキャラクターを表現（インベントリ・お金はPartyで共有管理）
 */
export class PartyMember {
  public readonly id: string;
  public readonly name: string;
  public readonly memberClass: PartyMemberClass;
  public readonly image?: string;

  // ステータス（値オブジェクトで管理）
  private _hp: HitPoints;
  private _mp: ManaPoints;
  private _level: number;
  private _xp: number;
  private _xpToNext: number;
  private _attack: number;
  private _skills: SkillDefinition[];

  // バトル用フラグ
  private _isDefending: boolean = false;

  // 基本防御力
  private _baseDefense: number = 0;

  // 装備スロット
  private equipment: {
    weapon: EquipmentItem | null;
    armor: EquipmentItem | null;
    accessory: EquipmentItem | null;
  } = {
    weapon: null,
    armor: null,
    accessory: null,
  };

  // 状態異常
  private statusEffects: StatusEffect[] = [];

  // レベルアップボーナス
  private levelUpBonus: { hp: number; mp: number; attack: number };

  constructor(definition: PartyMemberDefinition) {
    this.id = definition.id;
    this.name = definition.name;
    this.memberClass = definition.class;
    this.image = definition.image;

    // HP/MP を値オブジェクトで初期化
    this._hp = HitPoints.create(definition.baseStats.maxHp);
    this._mp = ManaPoints.create(definition.baseStats.maxMp);
    this._attack = definition.baseStats.attack;

    // レベル・経験値
    this._level = 1;
    this._xp = 0;
    this._xpToNext = 100;

    // スキル
    this._skills = [...definition.skills];

    // レベルアップボーナス
    this.levelUpBonus = definition.levelUpBonus ?? {
      hp: DEFAULT_LEVEL_UP_BONUS.hp,
      mp: DEFAULT_LEVEL_UP_BONUS.mp,
      attack: DEFAULT_LEVEL_UP_BONUS.attack,
    };
  }

  // ==================== getter ====================

  get hp(): number { return this._hp.current; }
  get maxHp(): number { return this._hp.max; }
  get mp(): number { return this._mp.current; }
  get maxMp(): number { return this._mp.max; }
  get level(): number { return this._level; }
  get xp(): number { return this._xp; }
  get xpToNext(): number { return this._xpToNext; }
  get attack(): number { return this._attack; }
  get isDefending(): boolean { return this._isDefending; }
  get baseDefense(): number { return this._baseDefense; }
  get skills(): SkillDefinition[] { return [...this._skills]; }

  // ==================== 戦闘関連 ====================

  /**
   * 通常攻撃ダメージを計算（装備込み）
   */
  calculateAttackDamage(): number {
    return CombatCalculator.calculateAttackDamage({
      attack: this.getEffectiveAttack(),
      isPlayer: true,
    });
  }

  /**
   * スキル攻撃ダメージを計算（装備込み）
   */
  calculateSkillDamage(skill: SkillDefinition): number {
    return CombatCalculator.calculateSkillDamage(
      { attack: this.getEffectiveAttack(), isPlayer: true },
      skill
    );
  }

  /**
   * ダメージを受ける（防御力と防御状態を考慮）
   */
  takeDamage(amount: number): number {
    const result = CombatCalculator.applyDefense(amount, {
      defense: this.getEffectiveDefense(),
      isDefending: this.isDefending,
    });

    this._hp = this._hp.damage(result.damage);
    return result.damage;
  }

  /**
   * 防御計算なしでダメージを受ける（状態異常用）
   */
  takeDamageRaw(amount: number): void {
    this._hp = this._hp.damage(amount);
  }

  /**
   * HPを回復（装備込みの最大HP上限）
   */
  heal(amount: number): number {
    const effectiveMaxHp = this.getEffectiveMaxHp();
    const hpWithEffectiveMax = HitPoints.of(this._hp.current, effectiveMaxHp);
    const healed = hpWithEffectiveMax.heal(amount);
    const healedAmount = healed.current - this._hp.current;
    this._hp = HitPoints.of(healed.current, this._hp.max);
    return healedAmount;
  }

  /**
   * MPを消費
   */
  useMp(amount: number): boolean {
    const result = this._mp.use(amount);
    if (!result) return false;
    this._mp = result;
    return true;
  }

  /**
   * MPを回復（装備込みの最大MP上限）
   */
  restoreMp(amount: number): number {
    const effectiveMaxMp = this.getEffectiveMaxMp();
    const mpWithEffectiveMax = ManaPoints.of(this._mp.current, effectiveMaxMp);
    const restored = mpWithEffectiveMax.restore(amount);
    const restoredAmount = restored.current - this._mp.current;
    this._mp = ManaPoints.of(restored.current, this._mp.max);
    return restoredAmount;
  }

  /**
   * スキルが使用可能か
   */
  canUseSkill(skill: SkillDefinition): boolean {
    return this._mp.canUse(skill.mpCost);
  }

  /**
   * 死亡判定
   */
  isDead(): boolean {
    return this._hp.isDead;
  }

  /**
   * 生存判定
   */
  isAlive(): boolean {
    return this._hp.isAlive;
  }

  /**
   * 経験値を獲得
   * @returns レベルアップしたかどうか
   */
  gainXp(amount: number): boolean {
    this._xp += amount;

    if (this._xp >= this._xpToNext) {
      this.levelUp();
      return true;
    }

    return false;
  }

  /**
   * レベルアップ処理
   */
  private levelUp(): void {
    this._level++;
    this._xp -= this._xpToNext;
    this._xpToNext = Math.floor(this._xpToNext * DEFAULT_LEVEL_UP_BONUS.xpMultiplier);

    // ステータス上昇 + 全回復
    this._hp = HitPoints.create(this._hp.max + this.levelUpBonus.hp);
    this._mp = ManaPoints.create(this._mp.max + this.levelUpBonus.mp);
    this._attack += this.levelUpBonus.attack;
  }

  /**
   * 戦闘後にMPを少し回復
   */
  recoverAfterBattle(): void {
    this.restoreMp(5);
    this._isDefending = false;
  }

  /**
   * 全回復
   */
  fullRecover(): void {
    this._hp = HitPoints.of(this.getEffectiveMaxHp(), this._hp.max);
    this._mp = ManaPoints.of(this.getEffectiveMaxMp(), this._mp.max);
    this._isDefending = false;
    this.clearAllStatusEffects();
  }

  /**
   * 防御状態をリセット
   */
  resetDefend(): void {
    this._isDefending = false;
  }

  /**
   * 防御状態にする
   */
  defend(): void {
    this._isDefending = true;
  }

  // ==================== 状態異常システム ====================

  /**
   * 状態異常を追加
   * 同じ種類の状態異常は重複しない
   */
  addStatusEffect(type: StatusEffectType, duration?: number): boolean {
    if (!this.isAlive()) {
      return false;
    }

    if (this.hasStatusEffect(type)) {
      return false;
    }

    const effect = StatusEffectFactory.create(type, duration);
    this.statusEffects.push(effect);
    return true;
  }

  /**
   * 特定の種類の状態異常を解除
   */
  removeStatusEffect(type: StatusEffectType): boolean {
    const initialLength = this.statusEffects.length;
    this.statusEffects = this.statusEffects.filter(e => e.type !== type);
    return this.statusEffects.length < initialLength;
  }

  /**
   * 全ての状態異常を解除
   */
  clearAllStatusEffects(): void {
    this.statusEffects = [];
  }

  /**
   * 特定の状態異常を持っているか
   */
  hasStatusEffect(type: StatusEffectType): boolean {
    return this.statusEffects.some(e => e.type === type);
  }

  /**
   * 全ての状態異常を取得
   */
  getStatusEffects(): readonly StatusEffect[] {
    return this.statusEffects;
  }

  /**
   * 状態異常情報を取得（UI表示用）
   */
  getStatusEffectInfos(): StatusEffectInfo[] {
    return this.statusEffects.map(e => ({
      type: e.type,
      name: e.name,
      shortName: e.shortName,
      color: e.color,
      remainingTurns: e.remainingTurns,
    }));
  }

  /**
   * ターン終了時の状態異常処理
   * @returns 処理結果の配列（ログ表示用）
   */
  processStatusEffectsTurnEnd(): { message: string; damage?: number; targetDied?: boolean }[] {
    const results: { message: string; damage?: number; targetDied?: boolean }[] = [];

    for (const effect of this.statusEffects) {
      const result = effect.onTurnEnd(this);
      if (result) {
        results.push({
          message: result.message,
          damage: result.damage,
          targetDied: this.isDead(),
        });
      }
      effect.tick();
    }

    // 解除すべき状態異常を削除
    this.statusEffects = this.statusEffects.filter(e => !e.shouldRemove());

    return results;
  }

  // ==================== 装備システム ====================

  /**
   * 装備品を装備する
   * @returns 以前装備していたアイテム（なければnull）
   */
  equip(item: EquipmentItem): EquipmentItem | null {
    const slot = item.slot;
    const previous = this.equipment[slot];
    this.equipment[slot] = item;
    return previous;
  }

  /**
   * 装備を外す
   * @returns 外した装備品（なければnull）
   */
  unequip(slot: EquipmentSlot): EquipmentItem | null {
    const item = this.equipment[slot];
    this.equipment[slot] = null;
    return item;
  }

  /**
   * 指定スロットの装備を取得
   */
  getEquipmentAt(slot: EquipmentSlot): EquipmentItem | null {
    return this.equipment[slot];
  }

  /**
   * 全装備を取得
   */
  getEquipment(): { weapon: EquipmentItem | null; armor: EquipmentItem | null; accessory: EquipmentItem | null } {
    return { ...this.equipment };
  }

  /**
   * 全装備のステータスボーナスを合算
   */
  private getEquipmentBonuses(): EquipmentStatBlock {
    return EquipmentStatBlock.sum(
      this.equipment.weapon ? EquipmentStatBlock.fromEquipmentStats(this.equipment.weapon.stats) : null,
      this.equipment.armor ? EquipmentStatBlock.fromEquipmentStats(this.equipment.armor.stats) : null,
      this.equipment.accessory ? EquipmentStatBlock.fromEquipmentStats(this.equipment.accessory.stats) : null,
    );
  }

  /**
   * 装備込みの攻撃力を取得
   */
  getEffectiveAttack(): number {
    return this._attack + this.getEquipmentBonuses().attack;
  }

  /**
   * 装備込みの防御力を取得
   */
  getEffectiveDefense(): number {
    return this._baseDefense + this.getEquipmentBonuses().defense;
  }

  /**
   * 装備込みの最大HPを取得
   */
  getEffectiveMaxHp(): number {
    return this._hp.max + this.getEquipmentBonuses().maxHp;
  }

  /**
   * 装備込みの最大MPを取得
   */
  getEffectiveMaxMp(): number {
    return this._mp.max + this.getEquipmentBonuses().maxMp;
  }

  /**
   * 装備状態を取得（React用）
   */
  getEquipmentState(): EquipmentSlotState {
    return {
      weapon: this.equipment.weapon?.getEquipmentInfo() ?? null,
      armor: this.equipment.armor?.getEquipmentInfo() ?? null,
      accessory: this.equipment.accessory?.getEquipmentInfo() ?? null,
    };
  }

  // ==================== 後方互換性のためのヘルパー ====================

  /**
   * 毒状態かどうか（後方互換性用）
   */
  get isPoisoned(): boolean {
    return this.hasStatusEffect('poison');
  }

  /**
   * 毒状態にする（後方互換性用）
   */
  poison(): void {
    this.addStatusEffect('poison');
  }

  /**
   * 毒を治す（後方互換性用）
   */
  curePoison(): void {
    this.removeStatusEffect('poison');
  }

  /**
   * セーブデータから状態を復元
   */
  restoreState(
    hp: number,
    mp: number,
    level: number,
    xp: number,
    xpToNext: number,
    baseMaxHp: number,
    baseMaxMp: number,
    baseAttack: number,
    baseDefense: number
  ): void {
    this._hp = HitPoints.of(hp, baseMaxHp);
    this._mp = ManaPoints.of(mp, baseMaxMp);
    this._level = level;
    this._xp = xp;
    this._xpToNext = xpToNext;
    this._attack = baseAttack;
    this._baseDefense = baseDefense;
  }

  /**
   * 状態を取得（React用、装備込みのステータス）
   */
  getState(): PartyMemberState {
    return {
      id: this.id,
      name: this.name,
      class: this.memberClass,
      image: this.image,
      hp: this._hp.current,
      maxHp: this.getEffectiveMaxHp(),
      mp: this._mp.current,
      maxMp: this.getEffectiveMaxMp(),
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
      attack: this.getEffectiveAttack(),
      defense: this.getEffectiveDefense(),
      skills: [...this._skills],
      isAlive: this._hp.isAlive,
      isDefending: this._isDefending,
      isPoisoned: this.isPoisoned,
      statusEffects: this.getStatusEffectInfos(),
      equipment: this.getEquipmentState(),
    };
  }
}
