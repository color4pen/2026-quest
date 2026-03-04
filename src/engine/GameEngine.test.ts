import { GameEngine } from './GameEngine';

describe('GameEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createEngine(): GameEngine {
    return new GameEngine();
  }

  describe('初期化', () => {
    it('初期化後、プレイヤーが (5,5) に配置される', () => {
      const engine = createEngine();
      const state = engine.getState();

      expect(state.player.x).toBe(5);
      expect(state.player.y).toBe(7);
    });

    it('初期パーティメンバーが1人追加される', () => {
      const engine = createEngine();
      const state = engine.getState();

      expect(state.party.members.length).toBe(1);
    });

    it('フェーズが exploring になる（battle/dialogue/shop は null）', () => {
      const engine = createEngine();
      const state = engine.getState();

      expect(state.isGameOver).toBe(false);
      expect(state.battle).toBeNull();
      expect(state.dialogue).toBeNull();
      expect(state.shop).toBeNull();
    });

    it('初期マップが village である', () => {
      const engine = createEngine();

      expect(engine.getCurrentMapId()).toBe('village');
    });
  });

  describe('マップ移動', () => {
    it('歩行可能なタイルに移動できる', () => {
      const engine = createEngine();
      const beforeY = engine.getState().player.y;

      engine.move('down');

      expect(engine.getState().player.y).toBe(beforeY + 1);
    });

    it('移動不可タイルには移動できない（座標が変わらない）', () => {
      const engine = createEngine();

      // 壁や木がある方向に何度も移動して端に到達させる
      for (let i = 0; i < 30; i++) {
        engine.move('up');
      }
      const atEdgeY = engine.getState().player.y;

      // これ以上 up に移動できないはず
      engine.move('up');
      expect(engine.getState().player.y).toBe(atEdgeY);
    });
  });

  describe('ショップ', () => {
    it('ゴールド不足で購入に失敗する', () => {
      const engine = createEngine();
      const expensiveItem = {
        item: { id: 'potion', name: 'ポーション', description: '回復', type: 'heal' as const },
        price: 99999,
        stock: -1,
      };

      const result = engine.buyItem(expensiveItem);

      expect(result).toBe(false);
    });
  });

  describe('リセット', () => {
    it('reset 後に初期状態に戻る', () => {
      const engine = createEngine();

      // 何度か移動
      engine.move('down');
      engine.move('right');

      engine.reset();

      const state = engine.getState();
      expect(state.player.x).toBe(5);
      expect(state.player.y).toBe(7);
      expect(state.isGameOver).toBe(false);
    });
  });

  describe('フィールドアイテム使用', () => {
    it('HP満タンのメンバーへの薬草使用は失敗する', () => {
      const engine = createEngine();
      const stateBefore = engine.getState();
      const leader = stateBefore.party.members[0];

      const result = engine.useFieldItem('potion', leader.id);

      // HP満タンなので使用不可
      expect(result.success).toBe(false);
      expect(result.message).toContain('満タン');
    });

    it('存在しないアイテムの使用は失敗する', () => {
      const engine = createEngine();

      const result = engine.useFieldItem('nonexistent_item');

      expect(result.success).toBe(false);
    });
  });

  // ゲーム状態（フラグ）のテストは GameStateManager.test.ts で実施
  // GameEngine からは private メソッドとなったため直接テストしない
});
