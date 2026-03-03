/**
 * ゲーム状態のキーと値の定義
 *
 * すべての状態は数値で管理される:
 * - 0 = 未達成/OFF/未開始
 * - 1以上 = 達成/ON/進行度
 */

// === キー定義 ===

export const STATE_KEYS = {
  // --- クエスト進行度 ---
  /** 森クエスト（長老依頼） */
  QUEST_FOREST: "quest_forest",

  // --- 重要アイテム取得 ---
  /** 古代の鍵を入手 */
  ITEM_ANCIENT_KEY: "item_ancient_key",

  // --- マップ訪問 ---
  /** ダンジョンに入ったことがある */
  MAP_DUNGEON_VISITED: "map_dungeon_visited",

  // --- NPC関連 ---
  /** 長老と初めて話した */
  NPC_ELDER_FIRST_TALK: "npc_elder_first_talk",
} as const;

export type StateKey = typeof STATE_KEYS[keyof typeof STATE_KEYS];

// === 値定義 ===

/** 汎用フラグ値（ON/OFF） */
export const FLAG = {
  OFF: 0,
  ON: 1,
} as const;

/** 森クエストの進行状態 */
export const QUEST_FOREST = {
  /** 未開始 */
  NOT_STARTED: 0,
  /** 受注済み（長老から依頼を受けた） */
  ACCEPTED: 1,
  /** ボス撃破済み */
  BOSS_DEFEATED: 2,
  /** 完了（報酬受取済み） */
  COMPLETED: 3,
} as const;
