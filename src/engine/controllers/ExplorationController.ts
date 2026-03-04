import { Direction, MessageType, VIEWPORT_WIDTH } from '../../types/game';
import { Player, Party, Enemy, NPC } from '../../models';
import { GameObject } from '../../components/game';
import { MapManager } from '../MapManager';
import { CameraManager } from '../CameraManager';
import { EncounterManager } from '../EncounterManager';
import { InteractionHandler } from '../InteractionHandler';

export interface ExplorationCallbacks {
  addMessage: (text: string, type: MessageType) => void;
  startBattle: (enemies: Enemy[]) => void;
  startDialogue: (npc: NPC) => void;
  notifyListeners: () => void;
}

/**
 * フィールド探索（移動・インタラクション・エンカウント）を制御
 */
export class ExplorationController {
  constructor(
    private player: Player,
    private party: Party,
    private mapManager: MapManager,
    private cameraManager: CameraManager,
    private encounterManager: EncounterManager,
    private interactionHandler: InteractionHandler,
    private callbacks: ExplorationCallbacks
  ) {}

  /**
   * プレイヤーを移動
   * @returns true: 移動成功またはインタラクション発生
   */
  public move(direction: Direction): boolean {
    if (this.party.isAllDead()) return false;

    const nextPosition = this.player.getNextPosition(direction);

    // 通行チェック（壁・扉）
    const blocked = this.mapManager.getMovementBlock(nextPosition, this.party);
    if (blocked) {
      this.callbacks.addMessage(blocked, 'normal');
      this.callbacks.notifyListeners();
      return false;
    }

    // インタラクション（NPC・宝箱・固定敵）
    const interaction = this.interactionHandler.check(
      this.getAllInteractableObjects(),
      nextPosition,
      this.player
    );
    if (this.handleInteraction(interaction)) return true;

    // 移動 → カメラ → ワープ → エンカウント
    this.player.moveTo(nextPosition);
    this.updateCamera();

    const warp = this.mapManager.getWarpAt(nextPosition);
    if (warp) {
      return true; // ワープはGameEngineで処理
    }

    this.checkEncounter();
    return true;
  }

  /**
   * ワープ先を取得（move後に呼び出し）
   */
  public getWarpAt(x: number, y: number): { toMapId: string; toX: number; toY: number } | null {
    return this.mapManager.getWarpAt({ x, y });
  }

  /**
   * インタラクション結果を処理
   * @returns true なら移動をスキップ
   */
  private handleInteraction(
    interaction: ReturnType<typeof this.interactionHandler.check>
  ): boolean {
    switch (interaction.type) {
      case 'dialogue':
        this.callbacks.startDialogue(interaction.npc);
        return true;
      case 'treasure':
        this.party.addGold(interaction.gold);
        this.callbacks.addMessage(
          `宝箱を開けた！${interaction.gold} ゴールドを獲得！`,
          'loot'
        );
        return false;
      case 'battle':
        this.callbacks.addMessage(`${interaction.enemy.name}が現れた！`, 'combat');
        this.callbacks.startBattle([interaction.enemy]);
        return true;
      case 'blocked':
        this.callbacks.notifyListeners();
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

    const enemyNames = enemies.map((e) => e.name).join('、');
    this.callbacks.addMessage(`${enemyNames}が現れた！`, 'combat');
    this.callbacks.startBattle(enemies);
  }

  /**
   * カメラをプレイヤーに追従させる
   */
  public updateCamera(): void {
    const mapState = this.mapManager.getGameMapState();
    const mapHeight = mapState.tiles.length;
    const mapWidth = mapState.tiles[0]?.length ?? VIEWPORT_WIDTH;
    this.cameraManager.update(this.player.x, this.player.y, mapWidth, mapHeight);
  }

  /**
   * 全てのInteractableオブジェクトを取得
   */
  private getAllInteractableObjects(): GameObject[] {
    return [
      ...this.mapManager.getNpcs(),
      ...this.mapManager.getTreasures().filter((t) => !t.isOpened()),
      ...this.mapManager.getFixedEnemies().filter((e) => !e.isDead()),
    ];
  }

  /**
   * 描画用に全GameObjectを取得
   */
  public getGameObjects(): GameObject[] {
    return [
      ...this.mapManager.getTreasures(),
      ...this.mapManager.getNpcs(),
      ...this.mapManager.getFixedEnemies().filter((e) => !e.isDead()),
      this.player,
    ];
  }
}
