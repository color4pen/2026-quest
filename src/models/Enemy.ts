import {
  Position,
  ENEMY_BASE_STATS,
  MAP_WIDTH,
  MAP_HEIGHT,
  EnemyBattleConfig,
  ENEMY_TEMPLATES,
} from '../types/game';
import {
  GameObject,
  GameObjectState,
  EnemyRenderer,
  Interactable,
  InteractionResult,
} from '../components/game';
import { CombatCalculator } from '../engine/CombatCalculator';
import { HitPoints } from './values/HitPoints';

/**
 * 敵状態（React用）
 */
export interface EnemyState extends GameObjectState {
  hp: number;
  maxHp: number;
  attack: number;
  xpReward: number;
  goldReward: number;
  battleConfig: EnemyBattleConfig;
}

/**
 * 敵クラス
 * GameObjectを継承し、Interactableを実装
 */
export class Enemy extends GameObject implements Interactable {
  private _hp: HitPoints;
  public attack: number;
  public xpReward: number;
  public goldReward: number;

  // バトル設定（Enemyが所有）
  public readonly battleConfig: EnemyBattleConfig;

  constructor(x: number, y: number, playerLevel: number, battleConfig?: EnemyBattleConfig) {
    super(x, y);

    // Rendererを設定（自身の描画方法を所有）
    this.renderer = new EnemyRenderer(this.transform);

    // バトル設定を所有（渡されなければランダムに選択）
    this.battleConfig = battleConfig ??
      ENEMY_TEMPLATES[Math.floor(Math.random() * ENEMY_TEMPLATES.length)];

    // ステータス初期化（敵ごとの倍率を適用）
    const baseHp = ENEMY_BASE_STATS.hp + playerLevel * 10;
    const baseAttack = ENEMY_BASE_STATS.attack + playerLevel * 2;
    const baseXp = ENEMY_BASE_STATS.xpReward * playerLevel;
    const baseGold = ENEMY_BASE_STATS.goldMin +
      Math.floor(Math.random() * (ENEMY_BASE_STATS.goldMax - ENEMY_BASE_STATS.goldMin));

    const maxHp = Math.floor(baseHp * this.battleConfig.hpMultiplier);
    this._hp = HitPoints.create(maxHp);
    this.attack = Math.floor(baseAttack * this.battleConfig.attackMultiplier);
    this.xpReward = Math.floor(baseXp * this.battleConfig.xpMultiplier);
    this.goldReward = Math.floor(baseGold * this.battleConfig.goldMultiplier);
  }

  // ==================== HP getter（後方互換性） ====================

  get hp(): number { return this._hp.current; }
  get maxHp(): number { return this._hp.max; }

  /**
   * 敵の名前を取得（バトル設定から）
   */
  get name(): string {
    return this.battleConfig.name;
  }

  /**
   * 敵の画像を取得（バトル設定から）
   */
  get image(): string | undefined {
    return this.battleConfig.image;
  }

  // ==================== Interactable実装 ====================

  /**
   * プレイヤーとの相互作用（バトル開始）
   */
  onInteract(_player: GameObject): InteractionResult {
    return {
      type: 'battle',
      data: this,
      blockMovement: true,
    };
  }

  /**
   * インタラクション可能か（生きている場合のみ）
   */
  canInteract(): boolean {
    return !this.isDead() && this._active;
  }

  // ==================== 戦闘関連 ====================

  /**
   * 攻撃ダメージを計算
   */
  calculateAttackDamage(): number {
    return CombatCalculator.calculateAttackDamage({
      attack: this.attack,
      isPlayer: false,
    });
  }

  /**
   * ダメージを受ける
   */
  takeDamage(amount: number): void {
    this._hp = this._hp.damage(amount);
  }

  /**
   * 死亡判定
   */
  isDead(): boolean {
    return this._hp.isDead;
  }

  // ==================== 状態管理 ====================

  /**
   * 状態を取得（React用）
   */
  getState(): EnemyState {
    return {
      ...this.getBaseState(),
      hp: this._hp.current,
      maxHp: this._hp.max,
      attack: this.attack,
      xpReward: this.xpReward,
      goldReward: this.goldReward,
      battleConfig: this.battleConfig,
    };
  }

  // ==================== ファクトリ ====================

  /**
   * 複数の敵を生成
   */
  static spawnEnemies(
    count: number,
    playerPosition: Position,
    playerLevel: number,
    existingPositions: Position[] = []
  ): Enemy[] {
    const enemies: Enemy[] = [];
    const occupied = new Set(
      [...existingPositions, playerPosition].map(p => `${p.x},${p.y}`)
    );

    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      let attempts = 0;
      const maxAttempts = 100;

      do {
        x = Math.floor(Math.random() * MAP_WIDTH);
        y = Math.floor(Math.random() * MAP_HEIGHT);
        attempts++;
      } while (
        attempts < maxAttempts &&
        (occupied.has(`${x},${y}`) ||
          Math.abs(x - playerPosition.x) + Math.abs(y - playerPosition.y) < 3)
      );

      if (attempts < maxAttempts) {
        occupied.add(`${x},${y}`);
        enemies.push(new Enemy(x, y, playerLevel));
      }
    }

    return enemies;
  }
}
