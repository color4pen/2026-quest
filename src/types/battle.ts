import type { StatusEffectInfo, StatusEffectType } from './statusEffect';

// バトルコマンド
export type BattleCommand = 'attack' | 'skill' | 'item' | 'defend';

// 敵AI種別
export type EnemyAIType = 'aggressive' | 'defensive' | 'random';

// 撃破時の状態変更（ボス用）
export interface DefeatStateChange {
  key: string;
  value: number;
}

// 敵のバトル設定（Enemyが所有）
export interface EnemyBattleConfig {
  name: string;
  image?: string;            // 画像パス
  aiType: EnemyAIType;
  // ステータス倍率（敵ごとの個性）
  hpMultiplier: number;      // HP倍率
  attackMultiplier: number;  // 攻撃力倍率
  xpMultiplier: number;      // 経験値倍率
  goldMultiplier: number;    // ゴールド倍率
  poisonChance?: number;     // 毒付与確率（0.0〜1.0）
  skills?: SkillDefinition[];
  dropItems?: ItemDefinition[];
  onDefeat?: DefeatStateChange[];  // 撃破時の状態変更
}

// バトルフェーズ
export type BattlePhase =
  | 'command_select'       // コマンド選択中（パーティーメンバー）
  | 'skill_select'         // スキル選択中
  | 'item_select'          // アイテム選択中
  | 'target_select'        // 敵ターゲット選択中
  | 'party_target_select'  // 味方ターゲット選択中（回復用）
  | 'party_action'         // パーティー行動実行中
  | 'enemy_action'         // 敵行動中
  | 'battle_end';          // 戦闘終了

// バトル結果
export type BattleResult = 'victory' | 'defeat' | 'escape';

// スキル定義
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  power: number;           // 攻撃力倍率
  type: 'attack' | 'heal';
  target: 'enemy' | 'self';
}

/**
 * アイテム定義
 * @deprecated ItemFactory.ItemDefinitionData を使用してください
 */
export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  type: 'heal' | 'buff' | 'damage' | 'cure' | 'valuable' | 'equipment';
  value?: number;           // 回復量やダメージ量
  target?: 'enemy' | 'self' | 'none';  // noneは使用不可（貴重品など）
  cureEffect?: StatusEffectType;  // cure時に治療する状態異常
}

// バトルログエントリ
export interface BattleLogEntry {
  id: number;
  text: string;
  type: 'player' | 'enemy' | 'system' | 'damage' | 'heal';
}

// 敵のバトル状態（複数敵対応）
export interface EnemyBattleState {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  image?: string;
  isDead: boolean;
}

// パーティーメンバーのバトル状態
export interface PartyMemberBattleState {
  id: string;
  name: string;
  class: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;             // 装備込み攻撃力
  defense: number;            // 装備込み防御力
  isAlive: boolean;
  isDefending: boolean;
  isPoisoned: boolean;        // 後方互換性用
  statusEffects: StatusEffectInfo[];  // 全状態異常（拡張用）
}

// パーティーメンバーの行動（キュー用）
export interface PartyMemberAction {
  memberId: string;
  command: BattleCommand;
  targetIndex?: number;           // 敵ターゲット（攻撃用）
  partyTargetId?: string;         // 味方ターゲット（回復用）
  skill?: SkillDefinition;
  itemId?: string;
}

// バトル状態
export interface BattleState {
  isActive: boolean;
  phase: BattlePhase;
  result: BattleResult | null;

  // パーティーメンバー
  partyMembers: PartyMemberBattleState[];
  currentMemberIndex: number;      // 現在コマンド選択中/行動中のメンバー

  // 複数敵
  enemies: EnemyBattleState[];

  // ターゲット選択
  selectedTargetIndex: number | null;

  // 敵ターン進行用
  currentEnemyTurnIndex: number;

  // バトルログ
  logs: BattleLogEntry[];

  // 選択中のコマンド
  selectedCommand: BattleCommand | null;

  // 後方互換性のため残す（Phase 4で削除予定）
  isDefending: boolean;
}


