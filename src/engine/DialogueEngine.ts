import {
  DialogueState,
  DialogueNode,
  DialogueChoice,
  DialogueAction,
  ShopState,
  StateCondition,
} from '../types/game';
import type { ItemDefinitionData } from '../models/items/ItemFactory';
import { NPC } from '../models/NPC';

export type DialogueEventListener = (state: DialogueState) => void;
export type ShopEventListener = (state: ShopState) => void;
export type GameStateGetter = (key: string) => number;
export type GameStateSetter = (key: string, value: number) => void;

export interface DialogueResult {
  action: DialogueAction;
  shouldClose: boolean;
}

export class DialogueEngine {
  private npc: NPC;
  private currentNode: DialogueNode | null;
  private isComplete: boolean;
  private listeners: Set<DialogueEventListener>;

  // コールバック
  private onDialogueEnd: (() => void) | null;
  private onOpenShop: ((npc: NPC) => void) | null;
  private onHeal: ((cost: number) => boolean) | null;
  private onSetState: GameStateSetter | null;
  private onGiveItem: ((item: ItemDefinitionData, quantity: number) => void) | null;

  // ゲーム状態取得
  private getGameState: GameStateGetter;

  constructor(npc: NPC, getGameState?: GameStateGetter) {
    this.npc = npc;
    this.getGameState = getGameState ?? (() => 0);
    this.isComplete = false;
    this.listeners = new Set();
    this.onDialogueEnd = null;
    this.onOpenShop = null;
    this.onHeal = null;
    this.onSetState = null;
    this.onGiveItem = null;

    // 条件に基づいて開始ノードを決定
    const startId = this.determineStartId();
    this.currentNode = this.findNode(startId);
  }

  /**
   * 条件に基づいて開始ノードIDを決定
   */
  private determineStartId(): string {
    const conditionalStartIds = this.npc.conditionalStartIds;

    if (conditionalStartIds) {
      for (const conditional of conditionalStartIds) {
        if (this.checkConditions(conditional.conditions)) {
          return conditional.startId;
        }
      }
    }

    return this.npc.dialogue.startId;
  }

  /**
   * 条件をチェック（すべてAND）
   */
  private checkConditions(conditions: StateCondition[]): boolean {
    return conditions.every(cond => this.checkCondition(cond));
  }

  /**
   * 単一の条件をチェック
   */
  private checkCondition(cond: StateCondition): boolean {
    const value = this.getGameState(cond.key);

    switch (cond.op) {
      case '==': return value === cond.value;
      case '!=': return value !== cond.value;
      case '>=': return value >= cond.value;
      case '>':  return value > cond.value;
      case '<=': return value <= cond.value;
      case '<':  return value < cond.value;
      default:   return false;
    }
  }

  /**
   * コールバックを設定
   */
  public setCallbacks(callbacks: {
    onDialogueEnd?: () => void;
    onOpenShop?: (npc: NPC) => void;
    onHeal?: (cost: number) => boolean;
    onSetState?: GameStateSetter;
    onGiveItem?: (item: ItemDefinitionData, quantity: number) => void;
  }): void {
    this.onDialogueEnd = callbacks.onDialogueEnd ?? null;
    this.onOpenShop = callbacks.onOpenShop ?? null;
    this.onHeal = callbacks.onHeal ?? null;
    this.onSetState = callbacks.onSetState ?? null;
    this.onGiveItem = callbacks.onGiveItem ?? null;
  }

  /**
   * 選択肢を選択
   */
  public selectChoice(choice: DialogueChoice): DialogueResult {
    const action = choice.action ?? { type: 'none' as const };

    switch (action.type) {
      case 'close':
        this.isComplete = true;
        this.onDialogueEnd?.();
        this.notifyListeners();
        return { action, shouldClose: true };

      case 'open_shop':
        this.isComplete = true;
        this.onOpenShop?.(this.npc);
        return { action, shouldClose: true };

      case 'heal':
        const success = this.onHeal?.(action.cost) ?? false;
        if (success) {
          this.goToNode('healed');
        } else {
          this.goToNode('no_money');
        }
        this.notifyListeners();
        return { action, shouldClose: false };

      case 'set_state':
        // ゲーム状態を設定
        this.onSetState?.(action.key, action.value);
        // 次のノードへ進む、なければ会話終了
        if (choice.nextDialogueId) {
          this.goToNode(choice.nextDialogueId);
          this.notifyListeners();
          return { action, shouldClose: false };
        } else {
          this.isComplete = true;
          this.onDialogueEnd?.();
          this.notifyListeners();
          return { action, shouldClose: true };
        }

      case 'give_item':
        // アイテムを付与
        this.onGiveItem?.(action.item, action.quantity);
        // 次のノードへ進む、なければ会話終了
        if (choice.nextDialogueId) {
          this.goToNode(choice.nextDialogueId);
          this.notifyListeners();
          return { action, shouldClose: false };
        } else {
          this.isComplete = true;
          this.onDialogueEnd?.();
          this.notifyListeners();
          return { action, shouldClose: true };
        }

      case 'none':
      default:
        if (choice.nextDialogueId) {
          this.goToNode(choice.nextDialogueId);
        }
        this.notifyListeners();
        return { action, shouldClose: false };
    }
  }

  /**
   * 次のノードへ進む（選択肢がない場合）
   */
  public advance(): void {
    if (this.currentNode?.nextId) {
      this.goToNode(this.currentNode.nextId);
      this.notifyListeners();
    }
  }

  /**
   * 指定IDのノードへ移動
   */
  private goToNode(nodeId: string): void {
    this.currentNode = this.findNode(nodeId);
  }

  /**
   * ノードを検索
   */
  private findNode(nodeId: string): DialogueNode | null {
    return this.npc.dialogue.nodes.find(n => n.id === nodeId) ?? null;
  }

  /**
   * 会話を閉じる
   */
  public close(): void {
    this.isComplete = true;
    this.onDialogueEnd?.();
    this.notifyListeners();
  }

  /**
   * 状態を取得
   */
  public getState(): DialogueState {
    return {
      isActive: !this.isComplete,
      npcName: this.npc.name,
      npcType: this.npc.type,
      npcImage: this.npc.image,
      currentNode: this.currentNode,
      isComplete: this.isComplete,
    };
  }

  /**
   * NPCを取得
   */
  public getNPC(): NPC {
    return this.npc;
  }

  /**
   * リスナーを登録
   */
  public subscribe(listener: DialogueEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * リスナーに通知
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (e) {
        console.error('Listener error:', e);
      }
    });
  }
}
