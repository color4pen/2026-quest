import { DialogueState, DialogueChoice, MessageType } from '../../types/game';
import { NPC, Party } from '../../models';
import { DialogueEngine } from '../DialogueEngine';
import { StateKey } from '../../data/stateKeys';
import { GameCommand } from '../calculators/types';
import { calculateHealCommands } from '../calculators/DialogueCalculator';

export interface DialogueCallbacks {
  getGameState: (key: StateKey) => number;
  setGameState: (key: StateKey, value: number) => void;
  executeCommands: (commands: GameCommand[]) => void;
  addMessage: (text: string, type: MessageType) => void;
  onDialogueStart: (engine: DialogueEngine) => void;
  onDialogueEnd: () => void;
  onOpenShop: (npc: NPC) => void;
  notifyListeners: () => void;
  markDirty: () => void;
}

/**
 * 会話フェーズを制御
 */
export class DialogueController {
  private engine: DialogueEngine | null = null;

  constructor(
    private party: Party,
    private callbacks: DialogueCallbacks
  ) {}

  /**
   * 会話を開始
   */
  public start(npc: NPC): void {
    const getGameState = (key: string) => this.callbacks.getGameState(key as StateKey);
    this.engine = new DialogueEngine(npc, getGameState);

    this.engine.setCallbacks({
      onDialogueEnd: () => {
        this.engine = null;
        this.callbacks.onDialogueEnd();
        this.callbacks.notifyListeners();
      },
      onOpenShop: (shopNpc: NPC) => {
        this.engine = null;
        this.callbacks.onOpenShop(shopNpc);
      },
      onHeal: (cost: number) => {
        return this.handleHeal(cost);
      },
      onSetState: (key: string, value: number) => {
        this.callbacks.setGameState(key as StateKey, value);
        this.callbacks.markDirty();
      },
      onGiveItem: (item: { id: string; name: string }, quantity: number) => {
        this.party.addItemById(item.id, quantity);
        this.callbacks.addMessage(`${item.name}を${quantity}個手に入れた！`, 'loot');
        this.callbacks.markDirty();
      },
    });

    this.engine.subscribe(() => {
      this.callbacks.notifyListeners();
    });

    this.callbacks.onDialogueStart(this.engine);
    this.callbacks.notifyListeners();
  }

  /**
   * 回復処理
   */
  private handleHeal(cost: number): boolean {
    const result = calculateHealCommands(cost, this.party.getGold());

    if (!result.success) {
      return false;
    }

    this.callbacks.executeCommands(result.commands);
    return true;
  }

  /**
   * 選択肢を選ぶ
   */
  public selectChoice(choice: DialogueChoice): void {
    this.engine?.selectChoice(choice);
  }

  /**
   * 会話を進める
   */
  public advance(): void {
    this.engine?.advance();
  }

  /**
   * 会話を閉じる
   */
  public close(): void {
    this.engine?.close();
  }

  /**
   * 会話状態を取得
   */
  public getState(): DialogueState | null {
    return this.engine?.getState() ?? null;
  }

  /**
   * 会話中かどうか
   */
  public isActive(): boolean {
    return this.engine !== null;
  }

  /**
   * DialogueEngineを取得（フェーズ管理用）
   */
  public getEngine(): DialogueEngine | null {
    return this.engine;
  }
}
