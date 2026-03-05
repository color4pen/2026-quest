import { SkillDefinition } from '../types/game';
import {
  PartyMemberClass,
  PartyMemberDefinition,
  PartyMemberState,
  PartyMemberSnapshot,
  EquipmentSlot,
} from '../types/party';
import type { StatusEffectType, StatusEffectInfo } from '../types/statusEffect';
import { EquipmentItem } from './items/EquipmentItem';
import { CombatCalculator } from '../engine/CombatCalculator';
import { HitPoints } from './values/HitPoints';
import { ManaPoints } from './values/ManaPoints';
import { ExperienceManager } from './components/ExperienceManager';
import { StatusEffectManager } from './components/StatusEffectManager';
import { EquipmentManager } from './components/EquipmentManager';
import type { Combatant } from './Combatant';
import type { Action } from './actions/Action';
import { AttackAction } from './actions/AttackAction';
import { DefendAction } from './actions/DefendAction';
import { SkillAction } from './actions/SkillAction';

/**
 * パーティーメンバークラス
 * 個別のキャラクターを表現（インベントリ・お金はPartyで共有管理）
 * Combatant インターフェースを実装し、戦闘時の行動を自己管理
 */
export class PartyMember implements Combatant {
  public readonly id: string;
  public readonly name: string;
  public readonly memberClass: PartyMemberClass;
  public readonly image?: string;

  // ステータス（値オブジェクトで管理）
  private _hp: HitPoints;
  private _mp: ManaPoints;
  private _attack: number;
  private _skills: SkillDefinition[];

  // 経験値・レベル管理
  private readonly experience: ExperienceManager;

  // バトル用フラグ
  private _isDefending: boolean = false;

  // 基本防御力
  private _baseDefense: number = 0;

  // 装備管理
  private readonly equipment: EquipmentManager = new EquipmentManager();

  // 状態異常管理
  private readonly statusEffects: StatusEffectManager = new StatusEffectManager();

  constructor(definition: PartyMemberDefinition) {
    this.id = definition.id;
    this.name = definition.name;
    this.memberClass = definition.class;
    this.image = definition.image;

    // HP/MP を値オブジェクトで初期化
    this._hp = HitPoints.create(definition.baseStats.maxHp);
    this._mp = ManaPoints.create(definition.baseStats.maxMp);
    this._attack = definition.baseStats.attack;

    // スキル
    this._skills = [...definition.skills];

    // 経験値・レベル管理
    this.experience = new ExperienceManager(definition.levelUpBonus);
  }

  // ==================== getter ====================

  get hp(): number { return this._hp.current; }
  get maxHp(): number { return this._hp.max; }
  get mp(): number { return this._mp.current; }
  get maxMp(): number { return this._mp.max; }
  get level(): number { return this.experience.level; }
  get xp(): number { return this.experience.xp; }
  get xpToNext(): number { return this.experience.xpToNext; }
  get attack(): number { return this._attack; }
  get defense(): number { return this.getEffectiveDefense(); }
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
    const result = this.experience.gainXp(amount);
    if (result) {
      this.applyLevelUp(result.hpBonus, result.mpBonus, result.attackBonus);
      return true;
    }
    return false;
  }

  /**
   * レベルアップ時のステータス適用
   */
  private applyLevelUp(hpBonus: number, mpBonus: number, attackBonus: number): void {
    // ステータス上昇 + 全回復
    this._hp = HitPoints.create(this._hp.max + hpBonus);
    this._mp = ManaPoints.create(this._mp.max + mpBonus);
    this._attack += attackBonus;
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
    return this.statusEffects.add(type, duration);
  }

  /**
   * 特定の種類の状態異常を解除
   */
  removeStatusEffect(type: StatusEffectType): boolean {
    return this.statusEffects.remove(type);
  }

  /**
   * 全ての状態異常を解除
   */
  clearAllStatusEffects(): void {
    this.statusEffects.clear();
  }

  /**
   * 特定の状態異常を持っているか
   */
  hasStatusEffect(type: StatusEffectType): boolean {
    return this.statusEffects.has(type);
  }

  /**
   * 全ての状態異常を取得
   */
  getStatusEffects() {
    return this.statusEffects.getAll();
  }

  /**
   * 状態異常情報を取得（UI表示用）
   */
  getStatusEffectInfos(): StatusEffectInfo[] {
    return this.statusEffects.getInfos();
  }

  /**
   * ターン終了時の状態異常処理
   * @returns 処理結果の配列（ログ表示用）
   */
  processStatusEffectsTurnEnd(): { message: string; damage?: number; targetDied?: boolean }[] {
    return this.statusEffects.processTurnEnd(this);
  }

  // ==================== 装備システム ====================

  /**
   * 装備品を装備する
   * @returns 以前装備していたアイテム（なければnull）
   */
  equip(item: EquipmentItem): EquipmentItem | null {
    return this.equipment.equip(item);
  }

  /**
   * 装備を外す
   * @returns 外した装備品（なければnull）
   */
  unequip(slot: EquipmentSlot): EquipmentItem | null {
    return this.equipment.unequip(slot);
  }

  /**
   * 指定スロットの装備を取得
   */
  getEquipmentAt(slot: EquipmentSlot): EquipmentItem | null {
    return this.equipment.getAt(slot);
  }

  /**
   * 全装備を取得
   */
  getEquipment() {
    return this.equipment.getAll();
  }

  /**
   * 装備込みの攻撃力を取得
   */
  getEffectiveAttack(): number {
    return this._attack + this.equipment.getBonuses().attack;
  }

  /**
   * 装備込みの防御力を取得
   */
  getEffectiveDefense(): number {
    return this._baseDefense + this.equipment.getBonuses().defense;
  }

  /**
   * 装備込みの最大HPを取得
   */
  getEffectiveMaxHp(): number {
    return this._hp.max + this.equipment.getBonuses().maxHp;
  }

  /**
   * 装備込みの最大MPを取得
   */
  getEffectiveMaxMp(): number {
    return this._mp.max + this.equipment.getBonuses().maxMp;
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
  restoreState(snapshot: PartyMemberSnapshot): void {
    this._hp = HitPoints.of(snapshot.hp, snapshot.baseMaxHp);
    this._mp = ManaPoints.of(snapshot.mp, snapshot.baseMaxMp);
    this.experience.restoreState(snapshot.level, snapshot.xp, snapshot.xpToNext);
    this._attack = snapshot.baseAttack;
    this._baseDefense = snapshot.baseDefense;
  }

  // ==================== Rich Domain Model ====================

  /**
   * このキャラクターが実行可能な行動一覧を取得
   * 基本行動（攻撃、防御）+ スキル + 装備から付与された行動
   */
  getAvailableActions(): Action[] {
    const actions: Action[] = [
      new AttackAction(),
      new DefendAction(),
    ];

    // スキルから行動追加
    for (const skill of this._skills) {
      actions.push(new SkillAction(skill));
    }

    // 装備から付与された行動を追加
    const equipment = this.equipment.getAll();
    for (const equip of Object.values(equipment)) {
      if (equip?.grantedActions) {
        actions.push(...equip.grantedActions);
      }
    }

    return actions;
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
      level: this.experience.level,
      xp: this.experience.xp,
      xpToNext: this.experience.xpToNext,
      attack: this.getEffectiveAttack(),
      defense: this.getEffectiveDefense(),
      skills: [...this._skills],
      isAlive: this._hp.isAlive,
      isDefending: this._isDefending,
      isPoisoned: this.isPoisoned,
      statusEffects: this.getStatusEffectInfos(),
      equipment: this.equipment.getState(),
    };
  }
}
