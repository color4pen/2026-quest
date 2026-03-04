import { CameraManager } from './CameraManager';
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../types/game';

describe('CameraManager', () => {
  describe('カメラ追従', () => {
    it('プレイヤーがマップ中央にいると、カメラがプレイヤー中心になる', () => {
      const cam = new CameraManager();
      cam.update(25, 20, 50, 40);

      const state = cam.getState();
      expect(state.x).toBe(25);
      expect(state.y).toBe(20);
    });

    it('プレイヤーがマップ左端にいると、カメラが半ビューポート幅にクランプされる', () => {
      const cam = new CameraManager();
      cam.update(0, 0, 50, 40);

      const state = cam.getState();
      expect(state.x).toBe(VIEWPORT_WIDTH / 2);
      expect(state.y).toBe(VIEWPORT_HEIGHT / 2);
    });

    it('プレイヤーがマップ右端にいると、カメラが右端にクランプされる', () => {
      const cam = new CameraManager();
      cam.update(49, 39, 50, 40);

      const state = cam.getState();
      expect(state.x).toBe(50 - VIEWPORT_WIDTH / 2);
      expect(state.y).toBe(40 - VIEWPORT_HEIGHT / 2);
    });

    it('マップがビューポートより小さい場合、中央に配置される', () => {
      const cam = new CameraManager();
      const smallWidth = 5;
      const smallHeight = 5;
      cam.update(2, 2, smallWidth, smallHeight);

      const state = cam.getState();
      expect(state.x).toBe(smallWidth / 2);
      expect(state.y).toBe(smallHeight / 2);
    });
  });

  describe('初期状態', () => {
    it('初期カメラ位置は (0, 0)', () => {
      const cam = new CameraManager();
      const state = cam.getState();
      expect(state.x).toBe(0);
      expect(state.y).toBe(0);
      expect(state.viewportWidth).toBe(VIEWPORT_WIDTH);
      expect(state.viewportHeight).toBe(VIEWPORT_HEIGHT);
    });
  });
});
