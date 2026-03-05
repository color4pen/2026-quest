import {
  Direction,
  MessageType,
  BattleState,
  BattleCommand,
  SkillDefinition,
  DialogueState,
  DialogueChoice,
  ShopState,
  ShopItem,
  CameraState,
  PartyState,
  PartyMemberTemplate,
} from '../types/game';
import { SaveSlotInfo } from '../types/save';
import { SaveLoadHandler, MemberRestoreData } from './SaveLoadHandler';
import { GameCommand } from './calculators/types';
import {
  Player,
  PlayerState,
  Enemy,
  TreasureState,
  GameMapState,
  NPCState,
  NPC,
  Party,
  GameProgressManager,
} from '../models';
import { StateKey } from '../data/stateKeys';
import { BattleEngine } from './BattleEngine';
import { DialogueEngine } from './DialogueEngine';
import { RenderableEntity } from '../types/rendering';
import { INITIAL_MAP_ID } from '../data/maps';
import { INITIAL_PARTY_MEMBER, getPartyMemberTemplate } from '../data/partyMembers';
import { CameraManager } from './CameraManager';
import { EncounterManager } from './EncounterManager';
import { InteractionHandler } from './InteractionHandler';
import { MapManager } from './MapManager';
import { MessageManager } from './MessageManager';
import {
  ExplorationController,
  BattleController,
  DialogueController,
  ShopController,
  PartyController,
} from './controllers';

// ゲームフェーズ（排他的状態管理）
type GamePhase =
  | { type: 'exploring' }
  | { type: 'battle'; engine: BattleEngine }
  | { type: 'dialogue'; engine: DialogueEngine }
  | { type: 'shop'; state: ShopState }
  | { type: 'game_over' };

export interface GameEngineState {
  player: PlayerState;
  party: PartyState;
  treasures: TreasureState[];
  npcs: NPCState[];
  map: GameMapState;
  camera: CameraState;
  messages: import('../types/game').Message[];
  isGameOver: boolean;
  battle: BattleState | null;
  dialogue: DialogueState | null;
  shop: ShopState | null;
  mapName: string;
}

export type GameEventListener = (state: GameEngineState) => void;

/**
 * ゲームエンジン（Facadeパターン）
 * 各コントローラーを統括し、公開APIを提供
 */
export class GameEngine {
  private player: Player;
  private party: Party;
  private phase: GamePhase = { type: 'exploring' };
  private listeners: Set<GameEventListener>;

  // サブマネージャー
  private mapManager: MapManager;
  private cameraManager: CameraManager;
  private encounterManager: EncounterManager;
  private interactionHandler: InteractionHandler;
  private saveLoadHandler: SaveLoadHandler;
  private messageManager: MessageManager;
  private gameProgressManager: GameProgressManager;

  // コントローラー
  private explorationController!: ExplorationController;
  private battleController!: BattleController;
  private dialogueController!: DialogueController;
  private shopController!: ShopController;
  private partyController!: PartyController;

  // 状態キャッシュ
  private stateCache: GameEngineState | null = null;
  private stateDirty: boolean = true;

  constructor() {
    this.player = new Player();
    this.party = new Party();
    this.phase = { type: 'exploring' };
    this.listeners = new Set();
    this.gameProgressManager = new GameProgressManager();
    this.mapManager = new MapManager(INITIAL_MAP_ID);
    this.cameraManager = new CameraManager();
    this.encounterManager = new EncounterManager();
    this.interactionHandler = new InteractionHandler();
    this.saveLoadHandler = new SaveLoadHandler();
    this.messageManager = new MessageManager();

    this.initializeControllers();
    this.initialize();
  }

  /**
   * コントローラーを初期化
   */
  private initializeControllers(): void {
    this.explorationController = new ExplorationController(
      this.player,
      this.party,
      this.mapManager,
      this.cameraManager,
      this.encounterManager,
      this.interactionHandler,
      {
        addMessage: (text, type) => this.addMessage(text, type),
        startBattle: (enemies) => this.startBattle(enemies),
        startDialogue: (npc) => this.startDialogue(npc),
        notifyListeners: () => this.notifyListeners(),
      }
    );

    this.battleController = new BattleController(this.party, {
      executeCommands: (commands) => this.executeCommands(commands),
      onBattleStart: (engine) => this.transitionTo({ type: 'battle', engine }),
      onBattleEnd: (isDefeat) =>
        this.transitionTo(isDefeat ? { type: 'game_over' } : { type: 'exploring' }),
      notifyListeners: () => this.notifyListeners(),
    });

    this.dialogueController = new DialogueController(this.party, {
      getGameProgress: (key) => this.gameProgressManager.get(key),
      setGameProgress: (key, value) => this.gameProgressManager.set(key, value),
      executeCommands: (commands) => this.executeCommands(commands),
      addMessage: (text, type) => this.addMessage(text, type),
      onDialogueStart: (engine) => this.transitionTo({ type: 'dialogue', engine }),
      onDialogueEnd: () => this.transitionTo({ type: 'exploring' }),
      onOpenShop: (npc) => this.openShop(npc),
      notifyListeners: () => this.notifyListeners(),
      markDirty: () => this.markDirty(),
    });

    this.shopController = new ShopController(this.party, {
      executeCommands: (commands) => this.executeCommands(commands),
      addMessage: (text, type) => this.addMessage(text, type),
      onShopOpen: (state) => this.transitionTo({ type: 'shop', state }),
      onShopClose: () => this.transitionTo({ type: 'exploring' }),
      notifyListeners: () => this.notifyListeners(),
    });

    this.partyController = new PartyController(this.party, {
      addMessage: (text, type) => this.addMessage(text, type),
      notifyListeners: () => this.notifyListeners(),
    });
  }

  // ==================== 初期化 ====================

  private initialize(): void {
    this.player.reset();
    this.messageManager.clear();
    this.transitionTo({ type: 'exploring' });
    this.mapManager.setTreasureStatesCache({});
    this.gameProgressManager.reset();

    this.party.reset();
    this.party.addMember(INITIAL_PARTY_MEMBER);

    // 初期装備を設定
    this.party.equipItem('engineer', 'wooden_sword');
    this.party.equipItem('engineer', 'leather_armor');

    const initialMember = this.party.getMembers()[0];
    if (initialMember) {
      initialMember.addStatusEffect('influenza');
    }

    this.loadMap(INITIAL_MAP_ID);
    this.addMessage('冒険の始まりだ！（インフルエンザにかかっている...）', 'normal');
    this.notifyListeners();
  }

  public reset(): void {
    this.initialize();
  }

  // ==================== マップ ====================

  private loadMap(mapId: string, playerX?: number, playerY?: number, skipCache: boolean = false): void {
    const leaderLevel = this.party.getLeader()?.getState().level ?? 1;
    const result = this.mapManager.loadMap(mapId, playerX, playerY, {
      skipCache,
      leaderLevel,
      getGameProgress: (key) => this.gameProgressManager.get(key as StateKey),
    });
    if (!result) return;

    this.player.setPosition(result.startX, result.startY);
    this.addMessage(`${result.mapName}に到着した。`, 'normal');
    this.explorationController.updateCamera();
  }

  // ==================== 移動 ====================

  public move(direction: Direction): void {
    if (this.phase.type !== 'exploring') return;

    const moved = this.explorationController.move(direction);
    if (!moved) return;

    // ワープ処理
    const warp = this.explorationController.getWarpAt(this.player.x, this.player.y);
    if (warp) {
      this.loadMap(warp.toMapId, warp.toX, warp.toY);
    }

    this.notifyListeners();
  }

  public getRenderableEntities(): RenderableEntity[] {
    return this.explorationController.getRenderableEntities();
  }

  // ==================== バトル ====================

  private startBattle(enemies: Enemy[]): void {
    this.battleController.start(enemies);
  }

  public selectBattleCommand(command: BattleCommand): void {
    if (this.phase.type === 'battle') this.battleController.selectCommand(command);
  }

  public useBattleSkill(skill: SkillDefinition): void {
    if (this.phase.type === 'battle') this.battleController.useSkill(skill);
  }

  public useBattleItem(itemId: string): void {
    if (this.phase.type === 'battle') this.battleController.useItem(itemId);
  }

  public cancelBattleSelection(): void {
    if (this.phase.type === 'battle') this.battleController.cancelSelection();
  }

  public selectBattleTarget(targetIndex: number): void {
    if (this.phase.type === 'battle') this.battleController.selectTarget(targetIndex);
  }

  public closeBattle(): void {
    if (this.phase.type !== 'battle') return;
    if (this.battleController.close()) {
      this.notifyListeners();
    }
  }

  // ==================== 会話 ====================

  private startDialogue(npc: NPC): void {
    this.dialogueController.start(npc);
  }

  public selectDialogueChoice(choice: DialogueChoice): void {
    if (this.phase.type === 'dialogue') this.dialogueController.selectChoice(choice);
  }

  public advanceDialogue(): void {
    if (this.phase.type === 'dialogue') this.dialogueController.advance();
  }

  public closeDialogue(): void {
    if (this.phase.type === 'dialogue') this.dialogueController.close();
  }

  // ==================== ショップ ====================

  private openShop(npc: NPC): void {
    this.shopController.open(npc);
  }

  public buyItem(shopItem: ShopItem): boolean {
    return this.shopController.buyItem(shopItem);
  }

  public closeShop(): void {
    this.shopController.close();
  }

  // ==================== パーティー・装備・アイテム ====================

  public useFieldItem(itemId: string, targetMemberId?: string): { success: boolean; message: string } {
    return this.partyController.useFieldItem(itemId, targetMemberId);
  }

  public equipItem(memberId: string, itemId: string): { success: boolean; message: string } {
    return this.partyController.equipItem(memberId, itemId);
  }

  public unequipItem(memberId: string, slot: 'weapon' | 'armor' | 'accessory'): { success: boolean; message: string } {
    return this.partyController.unequipItem(memberId, slot);
  }

  public recruitMember(definition: PartyMemberTemplate): boolean {
    return this.partyController.recruitMember(definition);
  }

  // ==================== ゲーム状態 ====================

  public getCurrentMapId(): string {
    return this.mapManager.getCurrentMapId();
  }

  // ==================== セーブ・ロード ====================

  public getSaveSlots(): SaveSlotInfo[] {
    return this.saveLoadHandler.getSaveSlots();
  }

  public save(slotId: number): boolean {
    this.mapManager.cacheTreasureStates();

    const success = this.saveLoadHandler.save(slotId, {
      state: this.getState(),
      currentMapId: this.mapManager.getCurrentMapId(),
      treasureStatesCache: this.mapManager.getTreasureStatesCache(),
      gameState: this.gameProgressManager.getProgress(),
    });

    this.addMessage(success ? 'ゲームをセーブしました！' : 'セーブに失敗しました...', 'normal');
    this.notifyListeners();
    return success;
  }

  public load(slotId: number): boolean {
    const result = this.saveLoadHandler.load(slotId);

    if (!result.success || !result.data) {
      console.error('Load failed:', result.error);
      this.addMessage('ロードに失敗しました...', 'normal');
      this.notifyListeners();
      return false;
    }

    try {
      this.applyRestoreData(result.data);
      this.addMessage('ゲームをロードしました！', 'normal');
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Load restoration failed:', error);
      this.addMessage('ロードに失敗しました...', 'normal');
      this.notifyListeners();
      return false;
    }
  }

  private applyRestoreData(data: NonNullable<import('./SaveLoadHandler').RestoreResult['data']>): void {
    this.messageManager.clear();
    this.transitionTo({ type: 'exploring' });

    this.mapManager.setTreasureStatesCache(data.treasureStatesCache);
    this.gameProgressManager.restoreProgress(data.gameState);
    this.applyPartyRestoreData(data.members, data.gold, data.inventory);
    this.loadMap(data.mapId, data.playerPosition.x, data.playerPosition.y, true);

    this.markDirty();
  }

  private applyPartyRestoreData(
    members: MemberRestoreData[],
    gold: number,
    inventory: Array<{ itemId: string; quantity: number }>
  ): void {
    this.party.reset();
    this.party.clearInventory();
    this.party.addGold(gold);

    for (const itemData of inventory) {
      this.party.addItemById(itemData.itemId, itemData.quantity);
    }

    for (const memberData of members) {
      const definition = getPartyMemberTemplate(memberData.definitionId);
      if (!definition) continue;

      this.party.addMember(definition);
      const member = this.party.getMemberById(definition.id);
      if (!member) continue;

      member.restoreState({
        hp: memberData.hp,
        mp: memberData.mp,
        level: memberData.level,
        xp: memberData.xp,
        xpToNext: memberData.xpToNext,
        baseMaxHp: memberData.baseMaxHp,
        baseMaxMp: memberData.baseMaxMp,
        baseAttack: memberData.baseAttack,
        baseDefense: memberData.baseDefense,
      });

      if (memberData.equipment.weapon) this.party.equipItem(member.id, memberData.equipment.weapon);
      if (memberData.equipment.armor) this.party.equipItem(member.id, memberData.equipment.armor);
      if (memberData.equipment.accessory) this.party.equipItem(member.id, memberData.equipment.accessory);

      for (const effectData of memberData.statusEffects) {
        member.addStatusEffect(effectData.type, effectData.remainingTurns);
      }
    }
  }

  // ==================== 内部ユーティリティ ====================

  private transitionTo(newPhase: GamePhase): void {
    if (this.phase.type === 'battle') {
      this.battleController.clearTimers();
    }
    this.phase = newPhase;
    this.markDirty();
  }

  private addMessage(text: string, type: MessageType): void {
    this.messageManager.add(text, type);
  }

  private executeCommands(commands: GameCommand[]): void {
    for (const cmd of commands) {
      switch (cmd.type) {
        case 'addMessage':
          this.addMessage(cmd.text, cmd.messageType);
          break;
        case 'addGold':
          this.party.addGold(cmd.amount);
          break;
        case 'spendGold':
          this.party.spendGold(cmd.amount);
          break;
        case 'distributeXp':
          this.distributeXpToAliveMembers(cmd.xp);
          break;
        case 'setGameProgress':
          this.gameProgressManager.set(cmd.key, cmd.value);
          break;
        case 'addItem':
          this.party.addItemById(cmd.itemId, cmd.quantity);
          break;
        case 'fullHealAll':
          this.party.fullHealAll();
          break;
        case 'recoverAllAfterBattle':
          this.party.recoverAllAfterBattle();
          break;
      }
    }
    this.markDirty();
  }

  private distributeXpToAliveMembers(totalXp: number): void {
    const aliveMembers = this.party.getAliveMembers();
    if (aliveMembers.length === 0) return;

    const xpPerMember = Math.floor(totalXp / aliveMembers.length);
    for (const member of aliveMembers) {
      const leveledUp = member.gainXp(xpPerMember);
      if (leveledUp) {
        this.addMessage(
          `★ ${member.name}がレベルアップ！レベル ${member.getState().level} になった！★`,
          'level-up'
        );
      }
    }
  }

  private markDirty(): void {
    this.stateDirty = true;
  }

  // ==================== 状態取得・通知 ====================

  public getState(): GameEngineState {
    if (!this.stateDirty && this.stateCache) {
      return this.stateCache;
    }

    this.stateCache = {
      player: this.player.getState(),
      party: this.party.getState(),
      treasures: this.mapManager.getTreasureStates(),
      npcs: this.mapManager.getNpcStates(),
      map: this.mapManager.getGameMapState(),
      camera: this.cameraManager.getState(),
      messages: this.messageManager.getMessages(),
      isGameOver: this.phase.type === 'game_over',
      battle: this.phase.type === 'battle' ? this.phase.engine.getState() : null,
      dialogue: this.phase.type === 'dialogue' ? this.phase.engine.getState() : null,
      shop: this.phase.type === 'shop' ? this.phase.state : null,
      mapName: this.mapManager.getMapName(),
    };
    this.stateDirty = false;

    return this.stateCache;
  }

  public subscribe(listener: GameEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.markDirty();
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error('Listener error:', e);
      }
    });
  }
}
