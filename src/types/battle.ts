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

// 敵定義テンプレート
export const ENEMY_TEMPLATES: EnemyBattleConfig[] = [
  {
    name: 'スライム',
    image: '/assets/images/enemies/slime.png',
    aiType: 'random',
    hpMultiplier: 0.8,
    attackMultiplier: 0.7,
    xpMultiplier: 0.5,
    goldMultiplier: 0.5,
    poisonChance: 0.15,  // 15%の確率で毒
  },
  {
    name: 'バット',
    image: '/assets/images/enemies/bat.png',
    aiType: 'random',
    hpMultiplier: 0.6,
    attackMultiplier: 0.8,
    xpMultiplier: 0.6,
    goldMultiplier: 0.4,
  },
  {
    name: 'ゴブリン',
    image: '/assets/images/enemies/goblin.png',
    aiType: 'aggressive',
    hpMultiplier: 1.0,
    attackMultiplier: 1.0,
    xpMultiplier: 1.0,
    goldMultiplier: 1.0,
  },
  {
    name: 'コボルト',
    image: '/assets/images/enemies/kobold.png',
    aiType: 'defensive',
    hpMultiplier: 0.9,
    attackMultiplier: 0.9,
    xpMultiplier: 0.8,
    goldMultiplier: 1.2,
  },
  {
    name: 'ウルフ',
    image: '/assets/images/enemies/wolf.png',
    aiType: 'aggressive',
    hpMultiplier: 0.9,
    attackMultiplier: 1.3,
    xpMultiplier: 1.1,
    goldMultiplier: 0.8,
  },
  {
    name: 'スケルトン',
    image: '/assets/images/enemies/skeleton.png',
    aiType: 'random',
    hpMultiplier: 1.1,
    attackMultiplier: 1.0,
    xpMultiplier: 1.2,
    goldMultiplier: 1.0,
  },
  {
    name: 'ゾンビ',
    image: '/assets/images/enemies/zombie.png',
    aiType: 'defensive',
    hpMultiplier: 1.4,
    attackMultiplier: 0.8,
    xpMultiplier: 1.0,
    goldMultiplier: 0.6,
    poisonChance: 0.25,  // 25%の確率で毒
  },
  {
    name: 'オーク',
    image: '/assets/images/enemies/orc.png',
    aiType: 'aggressive',
    hpMultiplier: 1.5,
    attackMultiplier: 1.4,
    xpMultiplier: 1.5,
    goldMultiplier: 1.5,
  },
  // ボス
  {
    name: '洞窟の主',
    image: '/assets/images/enemies/cave_boss.jpg',
    aiType: 'aggressive',
    hpMultiplier: 3.0,
    attackMultiplier: 2.0,
    xpMultiplier: 5.0,
    goldMultiplier: 10.0,
    onDefeat: [
      { key: 'quest_forest', value: 2 },
    ],
  },
];

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

// プレイヤーのアイテム所持
export interface InventoryItem {
  item: ItemDefinition;
  quantity: number;
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


