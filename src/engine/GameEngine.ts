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
  ENEMY_TEMPLATES,
  MapDefinition,
  FixedEnemyPlacement,
  NPC_DEFINITIONS,
  CameraState,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  PartyState,
  PartyMemberDefinition,
} from '../types/game';
import { SaveData, SaveSlotInfo, SavedTreasureData } from '../types/save';
import { SaveManager } from '../services/SaveManager';
import {
  Player,
  PlayerState,
  Enemy,
  Treasure,
  TreasureState,
  GameMap,
  GameMapState,
  NPC,
  NPCState,
  Party,
  GameStateManager,
} from '../models';
import { StateKey } from '../data/stateKeys';
import { BattleEngine } from './BattleEngine';
import { DialogueEngine } from './DialogueEngine';
import { GameObject, isInteractable } from '../components/game';
import { MAPS, INITIAL_MAP_ID } from '../data/maps';
import { INITIAL_PARTY_MEMBER, getPartyMemberDefinition } from '../data/partyMembers';

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
  private treasures: Treasure[];
  private npcs: NPC[];
  private fixedEnemies: Enemy[];
  private gameMap: GameMap;
  private messages: Message[];
  private messageId: number;
  private isGameOver: boolean;
  private listeners: Set<GameEventListener>;

  // バトル関連
  private battleEngine: BattleEngine | null;

  // 会話関連
  private dialogueEngine: DialogueEngine | null;

  // ショップ関連
  private shopState: ShopState | null;

  // 現在のマップ定義
  private currentMapDefinition: MapDefinition | null;

  // カメラ
  private camera: CameraState;

  // 状態キャッシュ（パフォーマンス最適化）
  private stateCache: GameEngineState | null = null;
  private stateDirty: boolean = true;

  // セーブ関連
  private currentMapId: string = INITIAL_MAP_ID;
  private treasureStatesCache: Record<string, SavedTreasureData[]> = {};

  // ゲーム状態（フラグ・進行度）
  private gameStateManager: GameStateManager;

  constructor() {
    this.player = new Player();
    this.party = new Party();
    this.treasures = [];
    this.npcs = [];
    this.fixedEnemies = [];
    this.gameMap = new GameMap();
    this.messages = [];
    this.messageId = 0;
    this.isGameOver = false;
    this.listeners = new Set();
    this.battleEngine = null;
    this.dialogueEngine = null;
    this.shopState = null;
    this.currentMapDefinition = null;
    this.gameStateManager = new GameStateManager();
    this.camera = {
      x: 0,
      y: 0,
      viewportWidth: VIEWPORT_WIDTH,
      viewportHeight: VIEWPORT_HEIGHT,
    };

    this.initialize();
  }

  /**
   * ゲームを初期化
   */
  public initialize(): void {
    this.player.reset();
    this.messages = [];
    this.messageId = 0;
    this.isGameOver = false;
    this.battleEngine = null;
    this.dialogueEngine = null;
    this.shopState = null;
    this.treasureStatesCache = {};
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
    const mapDef = MAPS[mapId];
    if (!mapDef) {
      console.error(`Map not found: ${mapId}`);
      return;
    }

    // マップ切り替え前に現在のマップの宝箱状態をキャッシュ
    // skipCache=true の場合はスキップ（ロード時など、キャッシュが既に設定済みの場合）
    if (!skipCache && this.currentMapId && this.treasures.length > 0) {
      this.cacheTreasureStates();
    }

    // 現在のマップIDを記録
    this.currentMapId = mapId;
    this.currentMapDefinition = mapDef;
    this.gameMap.loadFromDefinition(mapDef);

    // プレイヤー位置を設定
    const startX = playerX ?? mapDef.playerStart.x;
    const startY = playerY ?? mapDef.playerStart.y;
    this.player.setPosition(startX, startY);

    // NPCを配置
    this.npcs = [];
    if (mapDef.npcs) {
      for (const npcPlacement of mapDef.npcs) {
        const npcDef = NPC_DEFINITIONS.find(n => n.id === npcPlacement.npcId);
        if (npcDef) {
          this.npcs.push(new NPC(npcDef, npcPlacement.x, npcPlacement.y));
        }
      }
    }

    // 宝箱を配置
    this.treasures = [];
    if (mapDef.treasures) {
      for (const treasurePlacement of mapDef.treasures) {
        this.treasures.push(
          new Treasure(treasurePlacement.x, treasurePlacement.y, treasurePlacement.gold)
        );
      }
    }

    // キャッシュされた宝箱状態を適用
    this.applyTreasureStates();

    // 固定敵を配置（ボスなど）
    this.fixedEnemies = this.spawnFixedEnemies(mapDef);

    this.addMessage(`${mapDef.name}に到着した。`, 'normal');

    // カメラをプレイヤー位置に追従
    this.updateCamera();
  }

  /**
   * カメラをプレイヤーに追従させる
   */
  private updateCamera(): void {
    const mapHeight = this.gameMap.getState().tiles.length;
    const mapWidth = this.gameMap.getState().tiles[0]?.length ?? VIEWPORT_WIDTH;

    // プレイヤーを中心に
    let cameraX = this.player.x;
    let cameraY = this.player.y;

    // マップ端でカメラを制限（画面外を映さない）
    const halfW = this.camera.viewportWidth / 2;
    const halfH = this.camera.viewportHeight / 2;

    // マップがビューポートより小さい場合は中央に固定
    if (mapWidth <= this.camera.viewportWidth) {
      cameraX = mapWidth / 2;
    } else {
      cameraX = Math.max(halfW, Math.min(mapWidth - halfW, cameraX));
    }

    if (mapHeight <= this.camera.viewportHeight) {
      cameraY = mapHeight / 2;
    } else {
      cameraY = Math.max(halfH, Math.min(mapHeight - halfH, cameraY));
    }

    this.camera.x = cameraX;
    this.camera.y = cameraY;
  }

  /**
   * プレイヤーを移動
   */
  public move(direction: Direction): void {
    if (this.battleEngine || this.dialogueEngine || this.shopState ||
        this.isGameOver || this.party.isAllDead()) {
      return;
    }

    const nextPosition = this.player.getNextPosition(direction);

    // マップの通行チェック
    const blockedReason = this.gameMap.getBlockedReason(nextPosition);
    if (blockedReason) {
      this.addMessage(blockedReason, 'normal');
      this.notifyListeners();
      return;
    }

    // 条件付き扉の通過チェック
    const door = this.gameMap.getDoorAt(nextPosition);
    if (door && !door.canPass(this.party)) {
      this.addMessage(door.getBlockedMessage(), 'normal');
      this.notifyListeners();
      return;
    }

    // NPC・宝箱とのインタラクションをチェック
    const allObjects = this.getAllInteractableObjects();
    for (const obj of allObjects) {
      if (obj.isAt(nextPosition) && isInteractable(obj) && obj.canInteract()) {
        const result = obj.onInteract(this.player);

        switch (result.type) {
          case 'dialogue':
            this.startDialogue(result.data as NPC);
            return;
          case 'treasure':
            const treasureData = result.data as { gold: number };
            this.party.addGold(treasureData.gold);
            this.addMessage(`宝箱を開けた！${treasureData.gold} ゴールドを獲得！`, 'loot');
            break;
          case 'battle':
            const enemy = result.data as Enemy;
            this.addMessage(`${enemy.name}が現れた！`, 'combat');
            this.startBattle([enemy]);
            return;
        }

        if (result.blockMovement) {
          this.notifyListeners();
          return;
        }
      }
    }

    // 移動実行
    this.player.moveTo(nextPosition);

    // カメラ追従
    this.updateCamera();

    // ワープポイントチェック
    const warp = this.gameMap.getWarpAt(nextPosition);
    if (warp) {
      this.loadMap(warp.toMapId, warp.toX, warp.toY);
      this.notifyListeners();
      return;
    }

    // エンカウント判定
    this.checkEncounter(nextPosition);

    this.notifyListeners();
  }

  /**
   * デバッグモードかどうかをチェック
   */
  private isDebugMode(): boolean {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'debug';
    }
    return false;
  }

  /**
   * エンカウント判定
   */
  private checkEncounter(_position: { x: number; y: number }): void {
    // デバッグモードではエンカウントしない
    if (this.isDebugMode()) return;

    const encounter = this.gameMap.getEncounter();
    if (!encounter) return;

    // エンカウント率判定
    if (Math.random() > encounter.rate) {
      return;
    }

    // エンカウント発生（1〜3体の敵をランダム生成）
    const enemies = this.createRandomEnemies(encounter.enemyIds);
    const enemyNames = enemies.map(e => e.name).join('、');
    this.addMessage(`${enemyNames}が現れた！`, 'combat');
    this.startBattle(enemies);
  }

  /**
   * ランダムな敵を複数生成（1〜3体）
   */
  private createRandomEnemies(enemyIds: string[]): Enemy[] {
    const count = Math.floor(Math.random() * 3) + 1; // 1〜3体
    const enemies: Enemy[] = [];

    // パーティーリーダーのレベルを基準に敵を生成
    const leaderLevel = this.party.getLeader()?.getState().level ?? 1;

    for (let i = 0; i < count; i++) {
      const enemyName = enemyIds[Math.floor(Math.random() * enemyIds.length)];
      const template = ENEMY_TEMPLATES.find(t => t.name === enemyName);
      enemies.push(new Enemy(0, 0, leaderLevel, template));
    }

    return enemies;
  }

  /**
   * 固定敵をスポーン（条件をチェック）
   */
  private spawnFixedEnemies(mapDef: MapDefinition): Enemy[] {
    if (!mapDef.fixedEnemies) return [];

    const leaderLevel = this.party.getLeader()?.getState().level ?? 1;

    return mapDef.fixedEnemies
      .filter(fe => this.checkSpawnCondition(fe.spawnCondition))
      .map(fe => {
        const template = ENEMY_TEMPLATES.find(t => t.name === fe.templateName);
        return new Enemy(fe.x, fe.y, leaderLevel, template);
      });
  }

  /**
   * スポーン条件をチェック
   */
  private checkSpawnCondition(cond?: FixedEnemyPlacement['spawnCondition']): boolean {
    if (!cond) return true;

    const value = this.gameStateManager.get(cond.key as StateKey);

    switch (cond.op) {
      case '<':  return value < cond.value;
      case '<=': return value <= cond.value;
      case '==': return value === cond.value;
      case '!=': return value !== cond.value;
      case '>=': return value >= cond.value;
      case '>':  return value > cond.value;
      default:   return false;
    }
  }

  /**
   * 全てのInteractableオブジェクトを取得
   */
  private getAllInteractableObjects(): GameObject[] {
    return [
      ...this.npcs,
      ...this.treasures.filter(t => !t.isOpened()),
      ...this.fixedEnemies.filter(e => !e.isDead()),
    ];
  }

  /**
   * 描画用に全GameObjectを取得
   */
  public getGameObjects(): GameObject[] {
    return [
      ...this.treasures,
      ...this.npcs,
      ...this.fixedEnemies.filter(e => !e.isDead()),
      this.player,
    ];
  }

  // ==================== バトル関連 ====================

  private startBattle(enemies: Enemy[]): void {
    this.battleEngine = new BattleEngine(this.party, enemies);

    this.battleEngine.setOnBattleEnd((result, defeatedEnemies) => {
      this.handleBattleEnd(result, defeatedEnemies);
    });

    this.battleEngine.subscribe(() => {
      this.notifyListeners();
    });

    this.notifyListeners();
  }

  public selectBattleCommand(command: BattleCommand): void {
    this.battleEngine?.selectCommand(command);
  }

  public useBattleSkill(skill: SkillDefinition): void {
    this.battleEngine?.useSkill(skill);
  }

  public useBattleItem(itemId: string): void {
    this.battleEngine?.useItem(itemId);
  }

  public cancelBattleSelection(): void {
    this.battleEngine?.cancelSelection();
  }

  private handleBattleEnd(result: BattleResult, enemies: Enemy[]): void {
    if (result === 'victory') {
      // 全敵からの報酬を合算
      const totalXp = enemies.reduce((sum, e) => sum + e.xpReward, 0);
      const totalGold = enemies.reduce((sum, e) => sum + e.goldReward, 0);

      this.addMessage('戦闘に勝利した！', 'combat');
      this.addMessage(
        `${totalXp} XP と ${totalGold} ゴールドを獲得！`,
        'loot'
      );

      // パーティーにゴールド追加
      this.party.addGold(totalGold);

      // 生存メンバーに経験値を均等分配
      const aliveMembers = this.party.getAliveMembers();
      if (aliveMembers.length > 0) {
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

      // 撃破時の状態変更（ボス撃破フラグなど）
      for (const enemy of enemies) {
        const onDefeat = enemy.battleConfig.onDefeat;
        if (onDefeat) {
          for (const change of onDefeat) {
            this.gameStateManager.set(change.key as StateKey, change.value);
          }
        }
      }

      // パーティー全員の戦闘後回復
      this.party.recoverAllAfterBattle();
    } else if (result === 'defeat') {
      this.isGameOver = true;
      this.addMessage('敗北した...ゲームオーバー', 'combat');
    }
  }

  public closeBattle(): void {
    if (this.battleEngine?.getState().phase === 'battle_end') {
      this.battleEngine = null;
      this.notifyListeners();
    }
  }

  public selectBattleTarget(targetIndex: number): void {
    this.battleEngine?.selectTarget(targetIndex);
  }

  // ==================== 会話関連 ====================

  private startDialogue(npc: NPC): void {
    // ゲーム状態取得関数を渡す
    const getGameState = (key: string) => this.gameStateManager.get(key as StateKey);
    this.dialogueEngine = new DialogueEngine(npc, getGameState);

    this.dialogueEngine.setCallbacks({
      onDialogueEnd: () => {
        this.dialogueEngine = null;
        this.notifyListeners();
      },
      onOpenShop: (shopNpc) => {
        this.dialogueEngine = null;
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

    this.dialogueEngine.subscribe(() => {
      this.notifyListeners();
    });

    this.notifyListeners();
  }

  public selectDialogueChoice(choice: DialogueChoice): void {
    this.dialogueEngine?.selectChoice(choice);
  }

  public closeDialogue(): void {
    this.dialogueEngine?.close();
    this.dialogueEngine = null;
    this.notifyListeners();
  }

  public advanceDialogue(): void {
    this.dialogueEngine?.advance();
  }

  // ==================== ショップ関連 ====================

  private openShop(npc: NPC): void {
    if (!npc.shopItems) return;

    this.shopState = {
      isActive: true,
      shopName: npc.name,
      items: npc.shopItems.map(item => ({
        ...item,
        item: { ...item.item },
      })),
    };

    this.notifyListeners();
  }

  public buyItem(shopItem: ShopItem): boolean {
    if (this.party.getGold() < shopItem.price) {
      this.addMessage('ゴールドが足りない！', 'normal');
      this.notifyListeners();
      return false;
    }

    if (shopItem.stock === 0) {
      this.addMessage('在庫切れだ！', 'normal');
      this.notifyListeners();
      return false;
    }

    this.party.spendGold(shopItem.price);
    this.party.addItemById(shopItem.item.id);

    if (shopItem.stock > 0) {
      shopItem.stock--;
    }

    this.addMessage(`${shopItem.item.name}を購入した！`, 'loot');
    this.notifyListeners();
    return true;
  }

  public closeShop(): void {
    this.shopState = null;
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
    if (!this.party.spendGold(cost)) {
      return false;
    }

    // パーティー全員を全回復
    this.party.fullHealAll();
    this.addMessage('パーティー全員のHPとMPが全回復した！', 'loot');

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
      treasures: this.treasures.map(t => t.getState()),
      npcs: this.npcs.map(n => n.getState()),
      map: this.gameMap.getState(),
      camera: { ...this.camera },
      messages: [...this.messages],
      isGameOver: this.isGameOver,
      battle: this.battleEngine?.getState() ?? null,
      dialogue: this.dialogueEngine?.getState() ?? null,
      shop: this.shopState,
      mapName: this.currentMapDefinition?.name ?? '',
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
    this.listeners.forEach(listener => listener(state));
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
    return this.currentMapId;
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
    this.cacheTreasureStates();

    const success = SaveManager.save(
      slotId,
      this.getState(),
      this.currentMapId,
      this.treasureStatesCache,
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
   * 現在のマップの宝箱状態をキャッシュ
   */
  private cacheTreasureStates(): void {
    this.treasureStatesCache[this.currentMapId] = this.treasures.map(t => ({
      x: t.x,
      y: t.y,
      opened: t.opened,
    }));
  }

  /**
   * キャッシュされた宝箱状態を現在のマップに適用
   */
  private applyTreasureStates(): void {
    const states = this.treasureStatesCache[this.currentMapId];
    if (!states) return;

    for (const treasure of this.treasures) {
      const savedState = states.find(s => s.x === treasure.x && s.y === treasure.y);
      if (savedState?.opened && !treasure.opened) {
        treasure.open();
      }
    }
  }

  /**
   * セーブデータからゲーム状態を復元
   */
  private restoreFromSaveData(saveData: SaveData): void {
    // 状態をリセット
    this.messages = [];
    this.messageId = 0;
    this.isGameOver = false;
    this.battleEngine = null;
    this.dialogueEngine = null;
    this.shopState = null;

    // 宝箱状態キャッシュを復元
    this.treasureStatesCache = saveData.treasureStates;

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
