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
    it('HPが減ったリーダーに薬草を使うと回復する', () => {
      const engine = createEngine();
      const party = engine.getParty();
      const leader = party.getLeader()!;
      leader.takeDamageRaw(30);
      const hpBefore = leader.hp;

      const result = engine.useFieldItem('potion');

      expect(result.success).toBe(true);
      expect(leader.hp).toBeGreaterThan(hpBefore);
    });

    it('存在しないアイテムの使用は失敗する', () => {
      const engine = createEngine();

      const result = engine.useFieldItem('nonexistent_item');

      expect(result.success).toBe(false);
    });
  });

  describe('ゲーム状態（フラグ）', () => {
    it('ゲーム状態を set/get できる', () => {
      const engine = createEngine();

      engine.setGameState('quest_forest' as any, 1);

      expect(engine.getGameState('quest_forest' as any)).toBe(1);
      expect(engine.isGameStateSet('quest_forest' as any)).toBe(true);
    });

    it('未設定のフラグは 0 を返す', () => {
      const engine = createEngine();

      expect(engine.getGameState('quest_forest' as any)).toBe(0);
      expect(engine.isGameStateSet('quest_forest' as any)).toBe(false);
    });
  });
});
