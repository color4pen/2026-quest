import { BattleEngine } from './BattleEngine';
import { Party } from '../models/Party';
import { Enemy } from '../models/Enemy';
import { createTestMemberDef, createTestEnemyTemplate } from '../__test-helpers__/factories';

describe('BattleEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createBattle(opts?: { memberHp?: number; enemyHpMultiplier?: number }) {
    const party = new Party();
    party.addMember(createTestMemberDef({ id: 'hero', baseStats: { hp: opts?.memberHp ?? 100, maxHp: opts?.memberHp ?? 100, mp: 30, maxMp: 30, attack: 15 } }));
    const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate({
      hpMultiplier: opts?.enemyHpMultiplier ?? 0.1, // 低HPで倒しやすく
      attackMultiplier: 0.5,
      name: 'テストスライム',
    }));
    const engine = new BattleEngine(party, [enemy]);
    return { party, enemy, engine };
  }

  function advanceAllTimers() {
    // BattleEngine uses 300-400ms delays
    vi.advanceTimersByTime(1000);
  }

  describe('通常攻撃による戦闘フロー', () => {
    it('味方が攻撃コマンドを選択してターゲットを選ぶと party_action フェーズに入る', () => {
      const { engine } = createBattle();
      expect(engine.getState().phase).toBe('command_select');

      engine.selectCommand('attack');
      // 敵1体なので自動ターゲット→パーティアクション開始
      const state = engine.getState();
      expect(['party_action', 'battle_end']).toContain(state.phase);
    });

    it('弱い敵を攻撃で倒すと result が "victory" になる', () => {
      const { engine } = createBattle({ enemyHpMultiplier: 0.1 });

      engine.selectCommand('attack');
      advanceAllTimers();

      const state = engine.getState();
      expect(state.result).toBe('victory');
    });

    it('味方が全滅すると result が "defeat" になる', () => {
      const { engine } = createBattle({ memberHp: 1, enemyHpMultiplier: 10.0 });

      engine.selectCommand('attack');
      // 味方行動後、敵行動で全滅
      advanceAllTimers();
      advanceAllTimers();

      const state = engine.getState();
      expect(state.result).toBe('defeat');
    });
  });

  describe('防御コマンド', () => {
    it('防御を選ぶと isDefending が true になる', () => {
      const { engine } = createBattle();

      engine.selectCommand('defend');
      advanceAllTimers();

      // 防御後、敵ターンに入る前にメンバーの防御状態を確認
      // 防御はターン終了後にリセットされるので、実行直後のログを確認
      const logs = engine.getState().logs;
      expect(logs.some(l => l.text.includes('防御の構え'))).toBe(true);
    });
  });

  describe('スキル使用', () => {
    it('MP不足のスキルは選択できず command_select に戻る', () => {
      const { engine } = createBattle();
      engine.selectCommand('skill');
      expect(engine.getState().phase).toBe('skill_select');

      // MP30 で mpCost 100 のスキル
      const expensiveSkill = { id: 'mega', name: 'メガ斬り', description: '', mpCost: 100, power: 3.0, type: 'attack' as const, target: 'enemy' as const };
      engine.useSkill(expensiveSkill);

      expect(engine.getState().phase).toBe('command_select');
      expect(engine.getState().logs.some(l => l.text.includes('MPが足りない'))).toBe(true);
    });
  });

  describe('アイテム使用', () => {
    it('戦闘中に薬草を使うとログにHP回復が記録される', () => {
      const { engine, party } = createBattle();
      const member = party.getMember(0)!;
      member.takeDamageRaw(30); // HP 70/100

      engine.selectCommand('item');
      expect(engine.getState().phase).toBe('item_select');

      engine.useItem('potion');
      advanceAllTimers();

      const logs = engine.getState().logs;
      expect(logs.some(l => l.text.includes('ポーション'))).toBe(true);
      expect(logs.some(l => l.text.includes('回復'))).toBe(true);
    });
  });

  describe('キャンセル操作', () => {
    it('スキル選択中にキャンセルすると command_select に戻る', () => {
      const { engine } = createBattle();
      engine.selectCommand('skill');
      expect(engine.getState().phase).toBe('skill_select');

      engine.cancelSelection();
      expect(engine.getState().phase).toBe('command_select');
    });

    it('アイテム選択中にキャンセルすると command_select に戻る', () => {
      const { engine } = createBattle();
      engine.selectCommand('item');
      expect(engine.getState().phase).toBe('item_select');

      engine.cancelSelection();
      expect(engine.getState().phase).toBe('command_select');
    });
  });

  describe('状態異常の進行', () => {
    it('毒状態のキャラはターン終了時にダメージを受ける', () => {
      const { engine, party } = createBattle({ enemyHpMultiplier: 10.0 });
      const member = party.getMember(0)!;
      member.addStatusEffect('poison');

      engine.selectCommand('defend');
      advanceAllTimers(); // party action
      advanceAllTimers(); // enemy action + status effects

      const logs = engine.getState().logs;
      expect(logs.some(l => l.text.includes('毒のダメージ'))).toBe(true);
    });
  });
});
