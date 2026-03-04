import {
  BattleState,
  BattleResult,
  BattleCommand,
  SkillDefinition,
} from '../../types/game';
import { Party, Enemy } from '../../models';
import { BattleEngine } from '../BattleEngine';
import { GameCommand } from '../calculators/types';
import { calculateBattleEndCommands } from '../calculators/BattleCalculator';

export interface BattleCallbacks {
  executeCommands: (commands: GameCommand[]) => void;
  onBattleStart: (engine: BattleEngine) => void;
  onBattleEnd: (isDefeat: boolean) => void;
  notifyListeners: () => void;
}

/**
 * バトルフェーズを制御
 */
export class BattleController {
  private engine: BattleEngine | null = null;

  constructor(
    private party: Party,
    private callbacks: BattleCallbacks
  ) {}

  /**
   * バトルを開始
   */
  public start(enemies: Enemy[]): void {
    this.engine = new BattleEngine(this.party, enemies);

    this.engine.setOnBattleEnd((result: BattleResult, defeatedEnemies: Enemy[]) => {
      this.handleBattleEnd(result, defeatedEnemies);
    });

    this.engine.subscribe(() => {
      this.callbacks.notifyListeners();
    });

    this.callbacks.onBattleStart(this.engine);
    this.callbacks.notifyListeners();
  }

  /**
   * バトル終了を処理
   */
  private handleBattleEnd(result: BattleResult, enemies: Enemy[]): void {
    const commands = calculateBattleEndCommands(result, enemies);
    this.callbacks.executeCommands(commands);
  }

  /**
   * コマンドを選択
   */
  public selectCommand(command: BattleCommand): void {
    this.engine?.selectCommand(command);
  }

  /**
   * スキルを使用
   */
  public useSkill(skill: SkillDefinition): void {
    this.engine?.useSkill(skill);
  }

  /**
   * アイテムを使用
   */
  public useItem(itemId: string): void {
    this.engine?.useItem(itemId);
  }

  /**
   * 選択をキャンセル
   */
  public cancelSelection(): void {
    this.engine?.cancelSelection();
  }

  /**
   * ターゲットを選択
   */
  public selectTarget(targetIndex: number): void {
    this.engine?.selectTarget(targetIndex);
  }

  /**
   * バトルを終了
   * @returns true: 正常終了, false: まだ終了できない
   */
  public close(): boolean {
    if (!this.engine) return false;
    if (this.engine.getState().phase !== 'battle_end') return false;

    const isDefeat = this.engine.getState().result === 'defeat';
    this.engine.clearPendingTimers();
    this.engine = null;

    this.callbacks.onBattleEnd(isDefeat);
    return true;
  }

  /**
   * バトル状態を取得
   */
  public getState(): BattleState | null {
    return this.engine?.getState() ?? null;
  }

  /**
   * バトル中かどうか
   */
  public isActive(): boolean {
    return this.engine !== null;
  }

  /**
   * BattleEngineを取得（フェーズ管理用）
   */
  public getEngine(): BattleEngine | null {
    return this.engine;
  }

  /**
   * タイマーをクリア（フェーズ遷移時）
   */
  public clearTimers(): void {
    this.engine?.clearPendingTimers();
  }
}
