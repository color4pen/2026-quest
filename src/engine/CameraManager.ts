import { CameraState, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../types/game';

export class CameraManager {
  private camera: CameraState;

  constructor() {
    this.camera = {
      x: 0,
      y: 0,
      viewportWidth: VIEWPORT_WIDTH,
      viewportHeight: VIEWPORT_HEIGHT,
    };
  }

  /**
   * カメラをプレイヤーに追従させる
   * マップ端でクランプ、マップがビューポートより小さい場合は中央に固定
   */
  update(playerX: number, playerY: number, mapWidth: number, mapHeight: number): void {
    const halfW = this.camera.viewportWidth / 2;
    const halfH = this.camera.viewportHeight / 2;

    if (mapWidth <= this.camera.viewportWidth) {
      this.camera.x = mapWidth / 2;
    } else {
      this.camera.x = Math.max(halfW, Math.min(mapWidth - halfW, playerX));
    }

    if (mapHeight <= this.camera.viewportHeight) {
      this.camera.y = mapHeight / 2;
    } else {
      this.camera.y = Math.max(halfH, Math.min(mapHeight - halfH, playerY));
    }
  }

  getState(): CameraState {
    return { ...this.camera };
  }
}
