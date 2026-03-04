import type { BattleLogEntry } from '../../types/battle';
import type { Combatant } from '../Combatant';

/**
 * 行動のターゲットタイプ
 */
export type ActionTargetType =
  | 'single_enemy'   // 単体敵
  | 'all_enemies'    // 全体敵
  | 'single_ally'    // 単体味方
  | 'all_allies'     // 全体味方
  | 'self'           // 自分
  | 'none';          // ターゲット不要

/**
 * 行動ログ（BattleLogEntry の id なし版）
 */
export interface ActionLog {
  text: string;
  type: BattleLogEntry['type'];
}

/**
 * 行動実行時のコンテキスト
 * Action.execute() に渡される情報
 */
export interface ActionContext {
  /** 行動を実行するキャラクター（Combatant実装） */
  performer: Combatant;
  /** 味方一覧 */
  allies: Combatant[];
  /** 敵一覧 */
  enemies: Combatant[];
}

/**
 * 行動の実行結果
 */
export interface ActionResult {
  /** 成功したかどうか */
  success: boolean;
  /** 表示するログ */
  logs: ActionLog[];
  /** 追加で実行する行動（二回攻撃、カウンター等） */
  followUpActions?: Action[];
}

/**
 * 行動インターフェース（Rich Domain Model の核心）
 *
 * 全ての行動（攻撃、スキル、アイテム、防御など）はこのインターフェースを実装する。
 * これにより、エンジンは行動の詳細を知らずに実行でき、
 * 新しい行動タイプを追加しても既存コードの変更が不要になる。
 */
export interface Action {
  /** 行動ID */
  readonly id: string;
  /** 表示名 */
  readonly name: string;
  /** 行動タイプ（UI表示用） */
  readonly type: 'attack' | 'skill' | 'defend' | 'item';

  /**
   * ターゲットタイプを取得
   * UI がターゲット選択を表示するかどうかの判断に使用
   */
  getTargetType(): ActionTargetType;

  /**
   * 実行可能かどうかを判定
   * MP不足、アイテム切れなどのチェック
   */
  canExecute(context: ActionContext): boolean;

  /**
   * 行動を実行
   * @param target ターゲット（敵 or 味方）、ターゲット不要の場合は null
   * @param context 実行コンテキスト
   * @returns 実行結果
   */
  execute(
    target: Combatant | null,
    context: ActionContext
  ): ActionResult;
}
