/**
 * 状態異常システム - 型定義
 *
 * 拡張性を考慮したオブジェクト指向設計:
 * - 新しい状態異常を追加する際は StatusEffectType に追加し、
 *   StatusEffect インターフェースを実装したクラスを作成するだけで済む
 */

import type { PartyMember } from '../models/PartyMember';

/**
 * 状態異常の種類
 * 新しい状態異常を追加する場合はここに追加
 */
export type StatusEffectType =
  | 'poison'      // 毒: 毎ターン最大HPの10%ダメージ
  | 'influenza'   // インフルエンザ: 毎ターン最大HPの5%ダメージ
  // 将来の拡張用:
  // | 'paralysis'   // 麻痺: 一定確率で行動不能
  // | 'sleep'       // 睡眠: 行動不能（ダメージで解除）
  // | 'blind'       // 暗闘: 命中率低下
  // | 'silence'     // 沈黙: スキル使用不可
  // | 'burn'        // 火傷: 毎ターンダメージ + 攻撃力低下
  // | 'freeze'      // 凍結: 行動不能（一定ターンで解除）
  ;

/**
 * 状態異常の効果発動タイミング
 */
export type StatusEffectTiming =
  | 'turn_start'   // ターン開始時
  | 'turn_end'     // ターン終了時
  | 'on_damage'    // ダメージを受けた時
  | 'on_action'    // 行動時
  ;

/**
 * 状態異常の処理結果
 */
export interface StatusEffectResult {
  damage?: number;           // 受けたダメージ
  healed?: number;           // 回復量
  message: string;           // ログに表示するメッセージ
  prevented?: boolean;       // 行動が阻止されたか
  removed?: boolean;         // 状態異常が解除されたか
}

/**
 * 状態異常インターフェース
 * 全ての状態異常クラスはこのインターフェースを実装する
 */
export interface StatusEffect {
  /** 状態異常の種類 */
  readonly type: StatusEffectType;

  /** 表示名 */
  readonly name: string;

  /** 短縮表示名（UI用） */
  readonly shortName: string;

  /** 残りターン数（-1 = 永続、治療が必要） */
  remainingTurns: number;

  /** UI表示用の色 */
  readonly color: string;

  /**
   * ターン開始時の処理
   * @param target 対象のパーティーメンバー
   * @returns 処理結果（ダメージ、メッセージなど）
   */
  onTurnStart(target: PartyMember): StatusEffectResult | null;

  /**
   * ターン終了時の処理
   * @param target 対象のパーティーメンバー
   * @returns 処理結果（ダメージ、メッセージなど）
   */
  onTurnEnd(target: PartyMember): StatusEffectResult | null;

  /**
   * ダメージを受けた時の処理
   * @param target 対象のパーティーメンバー
   * @param damage 受けたダメージ量
   * @returns 処理結果
   */
  onDamageReceived(target: PartyMember, damage: number): StatusEffectResult | null;

  /**
   * 行動時の処理（行動阻止判定など）
   * @param target 対象のパーティーメンバー
   * @returns 処理結果（preventedがtrueなら行動阻止）
   */
  onAction(target: PartyMember): StatusEffectResult | null;

  /**
   * 状態異常が解除されるべきか判定
   * @returns 解除すべきならtrue
   */
  shouldRemove(): boolean;

  /**
   * ターン経過処理（残りターンを減らす）
   */
  tick(): void;
}

/**
 * 状態異常のシリアライズ用データ（セーブ/ロード用）
 */
export interface StatusEffectData {
  type: StatusEffectType;
  remainingTurns: number;
}

/**
 * パーティーメンバーの状態異常情報（UI表示用）
 */
export interface StatusEffectInfo {
  type: StatusEffectType;
  name: string;
  shortName: string;
  color: string;
  remainingTurns: number;
}
