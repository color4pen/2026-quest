import {
  Direction,
  Message,
  MessageType,
  MAX_MESSAGES,
  BattleState,
  BattleResult,
  BattleCommand,
  SkillDefinition,
  DialogueState,
  DialogueChoice,
  ShopState,
  ShopItem,
  CameraState,
  VIEWPORT_WIDTH,
  PartyState,
  PartyMemberDefinition,
} from '../types/game';
import { SaveData, SaveSlotInfo } from '../types/save';
import { SaveManager } from '../services/SaveManager';
import { GameCommand } from './calculators/types';
import { calculatePurchaseCommands } from './calculators/ShopCalculator';
import { calculateBattleEndCommands } from './calculators/BattleCalculator';
import { calculateHealCommands } from './calculators/DialogueCalculator';
import {
  Player,
  PlayerState,
  Enemy,
  TreasureState,
  GameMapState,
  NPC,
  NPCState,
  Party,
  GameStateManager,
} from '../models';
import { StateKey } from '../data/stateKeys';
import { BattleEngine } from './BattleEngine';
import { DialogueEngine } from './DialogueEngine';
import { GameObject } from '../components/game';
import { INITIAL_MAP_ID } from '../data/maps';
import { INITIAL_PARTY_MEMBER, getPartyMemberDefinition } from '../data/partyMembers';
import { CameraManager } from './CameraManager';
import { EncounterManager } from './EncounterManager';
import { InteractionHandler } from './InteractionHandler';
import { MapManager } from './MapManager';

// ゲームフェーズ（排他的状態管理）
// BattleEngine/DialogueEngine を参照するため、循環依存を避けてここで定義
type GamePhase =
  | { type: 'exploring' }
  | { type: 'battle'; engine: BattleEngine }
  | { type: 'dialogue'; engine: DialogueEngine }
  | { type: 'shop'; state: ShopState }
  | { type: 'game_over' };

export interface GameEngineState {
  player: PlayerState;       // 後方互換性のため残す（移動用）
  party: PartyState;         // パーティー情報
  treasures: TreasureState[];
  npcs: NPCState[];
  map: GameMapState;
  camera: CameraState;
  messages: Message[];
  isGameOver: boolean;
  battle: BattleState | null;
  dialogue: DialogueState | null;
  shop: ShopState | null;
  mapName: string;           // 現在のマップ名
}

export type GameEventListener = (state: GameEngineState) => void;

export class GameEngine {
  private player: Player;    // 移動・描画用
  private party: Party;      // パーティー管理
  private messages: Message[];
  private messageId: number;
  private phase: GamePhase = { type: 'exploring' };
  private listeners: Set<GameEventListener>;

  // サブマネージャー
  private mapManager: MapManager;
  private cameraManager: CameraManager;
  private encounterManager: EncounterManager;
  private interactionHandler: InteractionHandler;

  // 状態キャッシュ（パフォーマンス最適化）
  private stateCache: GameEngineState | null = null;
  private stateDirty: boolean = true;

  // ゲーム状態（フラグ・進行度）
  private gameStateManager: GameStateManager;

  constructor() {
    this.player = new Player();
    this.party = new Party();
    this.messages = [];
    this.messageId = 0;
    this.phase = { type: 'exploring' };
    this.listeners = new Set();
    this.gameStateManager = new GameStateManager();
    this.mapManager = new MapManager(INITIAL_MAP_ID);
    this.cameraManager = new CameraManager();
    this.encounterManager = new EncounterManager();
    this.interactionHandler = new InteractionHandler();

    this.initialize();
  }

  /**
   * ゲームを初期化
   */
  public initialize(): void {
    this.player.reset();
    this.messages = [];
    this.messageId = 0;
    this.transitionTo({ type: 'exploring' });
    this.mapManager.setTreasureStatesCache({});
    this.gameStateManager.reset();

    // パーティー初期化（エンジニアを追加）
    this.party.reset();
    this.party.addMember(INITIAL_PARTY_MEMBER);

    // 初期状態異常を付与（インフルエンザ）
    const initialMember = this.party.getMembers()[0];
    if (initialMember) {
      initialMember.addStatusEffect('influenza');
    }

    // 初期マップを読み込み
    this.loadMap(INITIAL_MAP_ID);

    this.addMessage('冒険の始まりだ！（インフルエンザにかかっている...）', 'normal');
    this.notifyListeners();
  }

  /**
   * マップを読み込み
   */
  public loadMap(mapId: string, playerX?: number, playerY?: number, skipCache: boolean = false): void {
    const leaderLevel = this.party.getLeader()?.getState().level ?? 1;
    const result = this.mapManager.loadMap(mapId, playerX, playerY, {
      skipCache,
      leaderLevel,
      getGameState: (key) => this.gameStateManager.get(key as StateKey),
    });
    if (!result) return;

    this.player.setPosition(result.startX, result.startY);
    this.addMessage(`${result.mapName}に到着した。`, 'normal');
    this.updateCamera();
  }

  /**
   * カメラをプレイヤーに追従させる
   */
  private updateCamera(): void {
    const mapState = this.mapManager.getGameMapState();
    const mapHeight = mapState.tiles.length;
    const mapWidth = mapState.tiles[0]?.length ?? VIEWPORT_WIDTH;
    this.cameraManager.update(this.player.x, this.player.y, mapWidth, mapHeight);
  }

  /**
   * フェーズ遷移（前フェーズのクリーンアップ付き）
   */
  private transitionTo(newPhase: GamePhase): void {
    if (this.phase.type === 'battle') {
      this.phase.engine.clearPendingTimers();
    }
    this.phase = newPhase;
    this.markDirty();
  }

  /**
   * プレイヤーを移動
   */
  public move(direction: Direction): void {
    if (this.phase.type !== 'exploring') return;
    if (this.party.isAllDead()) return;

    const nextPosition = this.player.getNextPosition(direction);

    // 通行チェック（壁・扉）
    const blocked = this.mapManager.getMovementBlock(nextPosition, this.party);
    if (blocked) {
      this.addMessage(blocked, 'normal');
      this.notifyListeners();
      return;
    }

    // インタラクション（NPC・宝箱・固定敵）
    const interaction = this.interactionHandler.check(
      this.getAllInteractableObjects(), nextPosition, this.player
    );
    if (this.handleInteraction(interaction)) return;

    // 移動 → カメラ → ワープ → エンカウント
    this.player.moveTo(nextPosition);
    this.updateCamera();

    const warp = this.mapManager.getWarpAt(nextPosition);
    if (warp) {
      this.loadMap(warp.toMapId, warp.toX, warp.toY);
      this.notifyListeners();
      return;
    }

    this.checkEncounter();
    this.notifyListeners();
  }

  /**
   * インタラクション結果を処理
   * @returns true なら移動をスキップ
   */
  private handleInteraction(interaction: ReturnType<typeof this.interactionHandler.check>): boolean {
    switch (interaction.type) {
      case 'dialogue':
        this.startDialogue(interaction.npc);
        return true;
      case 'treasure':
        this.party.addGold(interaction.gold);
        this.addMessage(`宝箱を開けた！${interaction.gold} ゴールドを獲得！`, 'loot');
        return false;
      case 'battle':
        this.addMessage(`${interaction.enemy.name}が現れた！`, 'combat');
        this.startBattle([interaction.enemy]);
        return true;
      case 'blocked':
        this.notifyListeners();
        return true;
      default:
        return false;
    }
  }

  /**
   * エンカウント判定
   */
  private checkEncounter(): void {
    const encounter = this.mapManager.getGameMap().getEncounter();
    const leaderLevel = this.party.getLeader()?.getState().level ?? 1;
    const enemies = this.encounterManager.checkEncounter(encounter, leaderLevel);
    if (!enemies) return;

    const enemyNames = enemies.map(e => e.name).join('、');
    this.addMessage(`${enemyNames}が現れた！`, 'combat');
    this.startBattle(enemies);
  }

  /**
   * 全てのInteractableオブジェクトを取得
   */
  private getAllInteractableObjects(): GameObject[] {
    return [
      ...this.mapManager.getNpcs(),
      ...this.mapManager.getTreasures().filter(t => !t.isOpened()),
      ...this.mapManager.getFixedEnemies().filter(e => !e.isDead()),
    ];
  }

  /**
   * 描画用に全GameObjectを取得
   */
  public getGameObjects(): GameObject[] {
    return [
      ...this.mapManager.getTreasures(),
      ...this.mapManager.getNpcs(),
      ...this.mapManager.getFixedEnemies().filter(e => !e.isDead()),
      this.player,
    ];
  }

  // ==================== バトル関連 ====================

  private startBattle(enemies: Enemy[]): void {
    const engine = new BattleEngine(this.party, enemies);

    engine.setOnBattleEnd((result, defeatedEnemies) => {
      this.handleBattleEnd(result, defeatedEnemies);
    });

    engine.subscribe(() => {
      this.notifyListeners();
    });

    this.transitionTo({ type: 'battle', engine });
    this.notifyListeners();
  }

  public selectBattleCommand(command: BattleCommand): void {
    if (this.phase.type === 'battle') this.phase.engine.selectCommand(command);
  }

  public useBattleSkill(skill: SkillDefinition): void {
    if (this.phase.type === 'battle') this.phase.engine.useSkill(skill);
  }

  public useBattleItem(itemId: string): void {
    if (this.phase.type === 'battle') this.phase.engine.useItem(itemId);
  }

  public cancelBattleSelection(): void {
    if (this.phase.type === 'battle') this.phase.engine.cancelSelection();
  }

  private handleBattleEnd(result: BattleResult, enemies: Enemy[]): void {
    const commands = calculateBattleEndCommands(result, enemies);
    this.executeCommands(commands);
  }

  public closeBattle(): void {
    if (this.phase.type !== 'battle') return;
    if (this.phase.engine.getState().phase !== 'battle_end') return;

    const isDefeat = this.phase.engine.getState().result === 'defeat';
    this.transitionTo(isDefeat ? { type: 'game_over' } : { type: 'exploring' });
    this.notifyListeners();
  }

  public selectBattleTarget(targetIndex: number): void {
    if (this.phase.type === 'battle') this.phase.engine.selectTarget(targetIndex);
  }

  // ==================== 会話関連 ====================

  private startDialogue(npc: NPC): void {
    const getGameState = (key: string) => this.gameStateManager.get(key as StateKey);
    const engine = new DialogueEngine(npc, getGameState);

    engine.setCallbacks({
      onDialogueEnd: () => {
        this.transitionTo({ type: 'exploring' });
        this.notifyListeners();
      },
      onOpenShop: (shopNpc) => {
        this.openShop(shopNpc);
      },
      onHeal: (cost) => {
        return this.handleHeal(cost);
      },
      onSetState: (key, value) => {
        this.gameStateManager.set(key as StateKey, value);
        this.markDirty();
      },
      onGiveItem: (item, quantity) => {
        this.party.addItemById(item.id, quantity);
        this.addMessage(`${item.name}を${quantity}個手に入れた！`, 'loot');
        this.markDirty();
      },
    });

    engine.subscribe(() => {
      this.notifyListeners();
    });

    this.transitionTo({ type: 'dialogue', engine });
    this.notifyListeners();
  }

  public selectDialogueChoice(choice: DialogueChoice): void {
    if (this.phase.type === 'dialogue') this.phase.engine.selectChoice(choice);
  }

  public closeDialogue(): void {
    if (this.phase.type === 'dialogue') {
      this.phase.engine.close();
    }
  }

  public advanceDialogue(): void {
    if (this.phase.type === 'dialogue') this.phase.engine.advance();
  }

  // ==================== ショップ関連 ====================

  private openShop(npc: NPC): void {
    if (!npc.shopItems) return;

    this.transitionTo({
      type: 'shop',
      state: {
        isActive: true,
        shopName: npc.name,
        items: npc.shopItems.map(item => ({
          ...item,
          item: { ...item.item },
        })),
      },
    });
    this.notifyListeners();
  }

  public buyItem(shopItem: ShopItem): boolean {
    const result = calculatePurchaseCommands(shopItem, this.party.getGold());

    if (!result.success) {
      this.addMessage(result.message, 'normal');
      this.notifyListeners();
      return false;
    }

    this.executeCommands(result.commands);

    // 在庫を減らす（ShopItem自体の変更はここで行う）
    if (shopItem.stock > 0) {
      shopItem.stock--;
    }

    this.notifyListeners();
    return true;
  }

  public closeShop(): void {
    this.transitionTo({ type: 'exploring' });
    this.notifyListeners();
  }

  // ==================== フィールドアイテム使用 ====================

  /**
   * フィールドでアイテムを使用（ポーズメニューから）
   * アイテムの使用ロジックはItem/Partyクラスで処理
   */
  public useFieldItem(itemId: string, targetMemberId?: string): { success: boolean; message: string } {
    const target = targetMemberId
      ? this.party.getMemberById(targetMemberId)
      : this.party.getLeader();

    if (!target) {
      return { success: false, message: '対象が見つかりません' };
    }

    if (!target.isAlive()) {
      return { success: false, message: `${target.name}は戦闘不能です` };
    }

    // アイテム使用（ロジックはParty/Itemクラスで処理）
    const result = this.party.useItemOnMember(itemId, target, false);

    if (result.success) {
      this.notifyListeners();
    }

    return result;
  }

  // ==================== 装備変更 ====================

  /**
   * 装備品を装備する
   */
  public equipItem(memberId: string, itemId: string): { success: boolean; message: string } {
    const result = this.party.equipItem(memberId, itemId);
    if (result.success) {
      this.notifyListeners();
    }
    return result;
  }

  /**
   * 装備を外す
   */
  public unequipItem(memberId: string, slot: 'weapon' | 'armor' | 'accessory'): { success: boolean; message: string } {
    const result = this.party.unequipItem(memberId, slot);
    if (result.success) {
      this.notifyListeners();
    }
    return result;
  }

  // ==================== 宿屋（回復）関連 ====================

  private handleHeal(cost: number): boolean {
    const result = calculateHealCommands(cost, this.party.getGold());

    if (!result.success) {
      return false;
    }

    this.executeCommands(result.commands);
    return true;
  }

  // ==================== その他 ====================

  public reset(): void {
    this.initialize();
  }

  private addMessage(text: string, type: MessageType): void {
    this.messages.push({
      id: this.messageId++,
      text,
      type,
    });

    if (this.messages.length > MAX_MESSAGES) {
      this.messages = this.messages.slice(-MAX_MESSAGES);
    }
  }

  public getState(): GameEngineState {
    // キャッシュが有効ならそのまま返す
    if (!this.stateDirty && this.stateCache) {
      return this.stateCache;
    }

    // 新しい状態を構築してキャッシュ
    this.stateCache = {
      player: this.player.getState(),
      party: this.party.getState(),
      treasures: this.mapManager.getTreasureStates(),
      npcs: this.mapManager.getNpcStates(),
      map: this.mapManager.getGameMapState(),
      camera: this.cameraManager.getState(),
      messages: [...this.messages],
      isGameOver: this.phase.type === 'game_over',
      battle: this.phase.type === 'battle' ? this.phase.engine.getState() : null,
      dialogue: this.phase.type === 'dialogue' ? this.phase.engine.getState() : null,
      shop: this.phase.type === 'shop' ? this.phase.state : null,
      mapName: this.mapManager.getMapName(),
    };
    this.stateDirty = false;

    return this.stateCache;
  }

  /**
   * 状態を変更したことをマーク（次回getState時に再構築）
   */
  private markDirty(): void {
    this.stateDirty = true;
  }

  public subscribe(listener: GameEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.markDirty();
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (e) {
        console.error('Listener error:', e);
      }
    });
  }

  // ==================== コマンド実行 ====================

  /**
   * ハンドラから返されたコマンドを実行
   */
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
        case 'setGameState':
          this.gameStateManager.set(cmd.key, cmd.value);
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

  /**
   * 経験値を生存メンバーに均等分配
   */
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

  // ==================== パーティー管理 ====================

  /**
   * 仲間を追加
   */
  public recruitMember(definition: PartyMemberDefinition): boolean {
    if (this.party.isFull()) {
      this.addMessage('パーティーは満員だ！', 'normal');
      this.notifyListeners();
      return false;
    }

    const success = this.party.addMember(definition);
    if (success) {
      this.addMessage(`${definition.name}が仲間になった！`, 'loot');
      this.notifyListeners();
    }
    return success;
  }

  /**
   * パーティー情報を取得
   */
  public getParty(): Party {
    return this.party;
  }

  // ==================== セーブ・ロード ====================

  /**
   * 現在のマップIDを取得
   */
  public getCurrentMapId(): string {
    return this.mapManager.getCurrentMapId();
  }

  // ==================== ゲーム状態（フラグ・進行度） ====================

  /**
   * ゲーム状態を取得
   */
  public getGameState(key: StateKey): number {
    return this.gameStateManager.get(key);
  }

  /**
   * ゲーム状態を設定
   */
  public setGameState(key: StateKey, value: number): void {
    this.gameStateManager.set(key, value);
    this.markDirty();
  }

  /**
   * ゲーム状態が1以上か（フラグ的な判定）
   */
  public isGameStateSet(key: StateKey): boolean {
    return this.gameStateManager.isSet(key);
  }

  // ==================== セーブ/ロード ====================

  /**
   * 全セーブスロット情報を取得（UI表示用）
   */
  public getSaveSlots(): SaveSlotInfo[] {
    return SaveManager.getSaveSlots();
  }

  /**
   * ゲームをセーブ
   */
  public save(slotId: number): boolean {
    // 現在のマップの宝箱状態をキャッシュ
    this.mapManager.cacheTreasureStates();

    const success = SaveManager.save(
      slotId,
      this.getState(),
      this.mapManager.getCurrentMapId(),
      this.mapManager.getTreasureStatesCache(),
      this.gameStateManager.getState()
    );

    if (success) {
      this.addMessage('ゲームをセーブしました！', 'normal');
    } else {
      this.addMessage('セーブに失敗しました...', 'normal');
    }
    this.notifyListeners();
    return success;
  }

  /**
   * ゲームをロード
   */
  public load(slotId: number): boolean {
    const saveData = SaveManager.load(slotId);
    if (!saveData) {
      this.addMessage('ロードに失敗しました...', 'normal');
      this.notifyListeners();
      return false;
    }

    try {
      this.restoreFromSaveData(saveData);
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

  /**
   * セーブデータからゲーム状態を復元
   */
  private restoreFromSaveData(saveData: SaveData): void {
    // 状態をリセット
    this.messages = [];
    this.messageId = 0;
    this.transitionTo({ type: 'exploring' });

    // 宝箱状態キャッシュを復元
    this.mapManager.setTreasureStatesCache(saveData.treasureStates);

    // ゲーム状態（フラグ・進行度）を復元
    this.gameStateManager.restoreState(saveData.gameState ?? {});

    // パーティーを復元
    this.restorePartyFromSaveData(saveData);

    // マップを読み込み（プレイヤー位置も設定）
    // skipCache=true: キャッシュは既に復元済みなので上書きしない
    this.loadMap(
      saveData.currentMapId,
      saveData.playerPosition.x,
      saveData.playerPosition.y,
      true
    );

    this.markDirty();
  }

  /**
   * パーティーをセーブデータから復元
   */
  private restorePartyFromSaveData(saveData: SaveData): void {
    // パーティーをリセット
    this.party.reset();

    // インベントリをクリア（reset()で初期アイテムが入るため）
    this.party.clearInventory();

    // ゴールドを設定
    this.party.addGold(saveData.party.gold);

    // インベントリを復元
    for (const itemData of saveData.party.inventory) {
      this.party.addItemById(itemData.itemId, itemData.quantity);
    }

    // メンバーを復元
    for (const memberData of saveData.party.members) {
      const definition = getPartyMemberDefinition(memberData.definitionId);
      if (!definition) {
        console.warn(`Member definition not found: ${memberData.definitionId}`);
        continue;
      }

      // メンバーを追加
      this.party.addMember(definition);

      // メンバーを取得して状態を復元
      const member = this.party.getMemberById(definition.id);
      if (!member) continue;

      // ステータスを復元
      member.restoreState(
        memberData.hp,
        memberData.mp,
        memberData.level,
        memberData.xp,
        memberData.xpToNext,
        memberData.baseMaxHp,
        memberData.baseMaxMp,
        memberData.baseAttack,
        memberData.baseDefense
      );

      // 装備を復元
      if (memberData.equipment.weapon) {
        this.party.equipItem(member.id, memberData.equipment.weapon);
      }
      if (memberData.equipment.armor) {
        this.party.equipItem(member.id, memberData.equipment.armor);
      }
      if (memberData.equipment.accessory) {
        this.party.equipItem(member.id, memberData.equipment.accessory);
      }

      // 状態異常を復元
      for (const effectData of memberData.statusEffects) {
        member.addStatusEffect(effectData.type, effectData.remainingTurns);
      }
    }
  }
}
