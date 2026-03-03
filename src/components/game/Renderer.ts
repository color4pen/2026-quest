import { TILE_SIZE, CameraState } from '../../types/game';
import { Transform } from './Transform';

/**
 * 描画設定
 */
export interface RenderConfig {
  visible?: boolean;
  zIndex?: number;
}

/**
 * Rendererコンポーネント（抽象基底クラス）
 * Unity の SpriteRenderer に相当 - 描画を担当
 */
export abstract class Renderer {
  protected transform: Transform;
  public visible: boolean = true;
  public zIndex: number = 0;

  constructor(transform: Transform, config?: RenderConfig) {
    this.transform = transform;
    if (config?.visible !== undefined) this.visible = config.visible;
    if (config?.zIndex !== undefined) this.zIndex = config.zIndex;
  }

  /**
   * 描画（サブクラスで実装）
   */
  abstract render(ctx: CanvasRenderingContext2D, camera?: CameraState): void;

  /**
   * ピクセル座標を取得（カメラ座標を考慮）
   */
  protected getPixelPosition(camera?: CameraState): { px: number; py: number } {
    if (!camera) {
      // カメラがない場合は従来通り
      return {
        px: this.transform.x * TILE_SIZE,
        py: this.transform.y * TILE_SIZE,
      };
    }

    // カメラからの相対位置を計算
    // スクリーンX = (タイルX - カメラX + ビューポート幅/2) * TILE_SIZE
    const screenX = (this.transform.x - camera.x + camera.viewportWidth / 2) * TILE_SIZE;
    const screenY = (this.transform.y - camera.y + camera.viewportHeight / 2) * TILE_SIZE;

    return {
      px: screenX,
      py: screenY,
    };
  }

  /**
   * オブジェクトがビューポート内にあるかチェック
   */
  public isInViewport(camera: CameraState): boolean {
    const halfW = camera.viewportWidth / 2;
    const halfH = camera.viewportHeight / 2;

    return (
      this.transform.x >= camera.x - halfW - 1 &&
      this.transform.x <= camera.x + halfW + 1 &&
      this.transform.y >= camera.y - halfH - 1 &&
      this.transform.y <= camera.y + halfH + 1
    );
  }
}

/**
 * プレイヤー用Renderer
 */
export class PlayerRenderer extends Renderer {
  render(ctx: CanvasRenderingContext2D, camera?: CameraState): void {
    if (!this.visible) return;

    const { px, py } = this.getPixelPosition(camera);

    // 体
    ctx.fillStyle = '#e94560';
    ctx.fillRect(px + 8, py + 12, 16, 12);

    // 頭
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(px + 10, py + 6, 12, 10);

    // 髪
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(px + 10, py + 4, 12, 4);

    // 目
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 12, py + 10, 2, 2);
    ctx.fillRect(px + 18, py + 10, 2, 2);

    // 剣
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(px + 24, py + 14, 4, 8);
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(px + 24, py + 20, 4, 3);

    // 脚
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(px + 10, py + 24, 6, 4);
    ctx.fillRect(px + 16, py + 24, 6, 4);
  }
}

/**
 * 敵用Renderer
 */
export class EnemyRenderer extends Renderer {
  render(ctx: CanvasRenderingContext2D, camera?: CameraState): void {
    if (!this.visible) return;

    const { px, py } = this.getPixelPosition(camera);

    // 体
    ctx.fillStyle = '#3d7c3f';
    ctx.fillRect(px + 6, py + 10, 20, 14);
    ctx.fillRect(px + 4, py + 14, 24, 10);

    // 目
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(px + 10, py + 16, 4, 4);
    ctx.fillRect(px + 18, py + 16, 4, 4);

    // ハイライト
    ctx.fillStyle = '#5a9c5c';
    ctx.fillRect(px + 8, py + 12, 6, 4);
  }
}

/**
 * NPC用Renderer設定
 */
export interface NPCRenderConfig extends RenderConfig {
  bodyColor: string;
  hairColor: string;
  legsColor: string;
  iconColor: string;
}

/**
 * NPC用Renderer
 */
export class NPCRenderer extends Renderer {
  private colors: NPCRenderConfig;

  constructor(transform: Transform, colors: NPCRenderConfig) {
    super(transform, colors);
    this.colors = colors;
  }

  render(ctx: CanvasRenderingContext2D, camera?: CameraState): void {
    if (!this.visible) return;

    const { px, py } = this.getPixelPosition(camera);

    // 体
    ctx.fillStyle = this.colors.bodyColor;
    ctx.fillRect(px + 8, py + 12, 16, 12);

    // 頭
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(px + 10, py + 6, 12, 10);

    // 髪
    ctx.fillStyle = this.colors.hairColor;
    ctx.fillRect(px + 10, py + 4, 12, 4);

    // 目
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 12, py + 10, 2, 2);
    ctx.fillRect(px + 18, py + 10, 2, 2);

    // 脚
    ctx.fillStyle = this.colors.legsColor;
    ctx.fillRect(px + 10, py + 24, 6, 4);
    ctx.fillRect(px + 16, py + 24, 6, 4);

    // NPC種別アイコン
    ctx.fillStyle = this.colors.iconColor;
    ctx.fillRect(px + 24, py + 4, 6, 6);
  }

  /**
   * NPC種別から色設定を取得
   */
  static getColorsForType(type: string): NPCRenderConfig {
    switch (type) {
      case 'villager':
        return {
          bodyColor: '#6b8e23',
          hairColor: '#4a3728',
          legsColor: '#3d2817',
          iconColor: '#ffffff',
        };
      case 'shopkeeper':
        return {
          bodyColor: '#daa520',
          hairColor: '#2f4f4f',
          legsColor: '#3d2817',
          iconColor: '#ffd700',
        };
      case 'innkeeper':
        return {
          bodyColor: '#4169e1',
          hairColor: '#8b4513',
          legsColor: '#3d2817',
          iconColor: '#87ceeb',
        };
      default:
        return {
          bodyColor: '#6b8e23',
          hairColor: '#4a3728',
          legsColor: '#3d2817',
          iconColor: '#ffffff',
        };
    }
  }
}

/**
 * パソコン用Renderer
 */
export class ComputerRenderer extends Renderer {
  render(ctx: CanvasRenderingContext2D, camera?: CameraState): void {
    if (!this.visible) return;

    const { px, py } = this.getPixelPosition(camera);

    // モニター外枠
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(px + 4, py + 4, 24, 18);

    // モニター画面
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(px + 6, py + 6, 20, 14);

    // 画面の文字（緑色のターミナル風）
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(px + 8, py + 8, 8, 2);
    ctx.fillRect(px + 8, py + 12, 12, 2);
    ctx.fillRect(px + 8, py + 16, 6, 2);

    // カーソル点滅風
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(px + 16, py + 16, 3, 2);

    // モニタースタンド
    ctx.fillStyle = '#3c3c3c';
    ctx.fillRect(px + 13, py + 22, 6, 3);
    ctx.fillRect(px + 10, py + 25, 12, 2);

    // キーボード
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(px + 4, py + 28, 24, 4);

    // キーボードのキー
    ctx.fillStyle = '#6a6a6a';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(px + 6 + i * 4, py + 29, 3, 2);
    }
  }
}

/**
 * 宝箱用Renderer
 */
export class TreasureRenderer extends Renderer {
  private opened: boolean = false;

  setOpened(opened: boolean): void {
    this.opened = opened;
  }

  render(ctx: CanvasRenderingContext2D, camera?: CameraState): void {
    if (!this.visible || this.opened) return;

    const { px, py } = this.getPixelPosition(camera);

    // 宝箱
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(px + 8, py + 14, 16, 10);

    // 金具
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(px + 14, py + 18, 4, 4);
    ctx.fillRect(px + 10, py + 14, 12, 2);
  }
}
