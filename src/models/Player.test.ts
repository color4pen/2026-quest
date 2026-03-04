import { Player } from './Player';

describe('Player', () => {
  describe('移動', () => {
    it('上方向の getNextPosition は y-1 の座標を返す', () => {
      const player = new Player(5, 5);
      const next = player.getNextPosition('up');
      expect(next).toEqual({ x: 5, y: 4 });
    });

    it('下方向の getNextPosition は y+1 の座標を返す', () => {
      const player = new Player(5, 5);
      const next = player.getNextPosition('down');
      expect(next).toEqual({ x: 5, y: 6 });
    });

    it('moveTo で座標が更新される', () => {
      const player = new Player(5, 5);
      player.moveTo({ x: 7, y: 3 });
      const state = player.getState();
      expect(state.x).toBe(7);
      expect(state.y).toBe(3);
    });

    it('setPosition で直接座標を設定できる', () => {
      const player = new Player(5, 5);
      player.setPosition(10, 12);
      const state = player.getState();
      expect(state.x).toBe(10);
      expect(state.y).toBe(12);
    });
  });

  describe('リセット', () => {
    it('reset でデフォルト位置 (5,5) に戻る', () => {
      const player = new Player(10, 10);
      player.reset();
      const state = player.getState();
      expect(state.x).toBe(5);
      expect(state.y).toBe(5);
    });

    it('reset で指定位置に設定できる', () => {
      const player = new Player(10, 10);
      player.reset(3, 7);
      const state = player.getState();
      expect(state.x).toBe(3);
      expect(state.y).toBe(7);
    });
  });
});
