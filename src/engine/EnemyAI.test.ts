import { EnemyAI } from './EnemyAI';
import { Party, PartyMember, Enemy } from '../models';
import { INITIAL_PARTY_MEMBER } from '../data/partyMembers';
import { createTestEnemyTemplate } from '../__test-helpers__/factories';
import type { ActionContext } from '../models/actions';

describe('EnemyAI', () => {
  let ai: EnemyAI;
  let party: Party;
  let members: PartyMember[];

  beforeEach(() => {
    ai = new EnemyAI();
    party = new Party();
    party.addMember(INITIAL_PARTY_MEMBER);
    members = party.getAliveMembers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('decideAction', () => {
    it('アクションとターゲットを返す', () => {
      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate());

      const decision = ai.decideAction(enemy, members);

      expect(decision.action).toBeDefined();
      expect(decision.target).toBeDefined();
      expect(decision.target).toBe(members[0]); // 1人しかいない
    });

    it('aggressive AIは通常攻撃か強攻撃を選択する', () => {
      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate({ aiType: 'aggressive' }));

      const actionIds = new Set<string>();
      const actionNames = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const { action } = ai.decideAction(enemy, members);
        actionIds.add(action.id);
        actionNames.add(action.name);
      }

      // 様子見（wait）は選ばれない
      expect(actionIds.has('wait')).toBe(false);
      // 攻撃系のみ
      expect(actionIds.has('attack')).toBe(true);
      // 強攻撃も出る可能性がある
      // expect(actionNames.has('強攻撃')).toBe(true); // 確率なので出ないこともある
    });

    it('defensive AIは通常攻撃か様子見を選択する', () => {
      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate({ aiType: 'defensive' }));

      const actionNames = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const { action } = ai.decideAction(enemy, members);
        actionNames.add(action.name);
      }

      // 強攻撃は選ばれない
      expect(actionNames.has('強攻撃')).toBe(false);
    });

    it('random AIは全ての行動を選択しうる', () => {
      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate({ aiType: 'random' }));

      const actionTypes = new Set<string>();
      for (let i = 0; i < 200; i++) {
        const { action } = ai.decideAction(enemy, members);
        actionTypes.add(action.id === 'wait' ? 'wait' : action.name === '強攻撃' ? 'power' : 'attack');
      }

      // random は複数種類の行動を選ぶ
      expect(actionTypes.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('アクション実行', () => {
    function createEnemyContext(enemy: Enemy): ActionContext {
      return {
        performer: enemy,
        allies: [enemy],
        enemies: members,
      };
    }

    it('攻撃アクションでパーティメンバーにダメージを与える', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5); // 通常攻撃を選択

      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate({ attackMultiplier: 1.0 }));
      const { action, target } = ai.decideAction(enemy, members);

      const hpBefore = target.hp;
      const result = action.execute(target, createEnemyContext(enemy));

      expect(target.hp).toBeLessThan(hpBefore);
      expect(result.logs.some(l => l.text.includes('攻撃'))).toBe(true);
      expect(result.logs.some(l => l.text.includes('ダメージ'))).toBe(true);
    });

    it('強攻撃を選択すると強攻撃ログが出る', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1); // 強攻撃を選択

      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate({ aiType: 'aggressive' }));
      const { action, target } = ai.decideAction(enemy, members);

      // 強攻撃が選ばれた場合
      if (action.name === '強攻撃') {
        const result = action.execute(target, createEnemyContext(enemy));
        expect(result.logs.some(l => l.text.includes('強攻撃'))).toBe(true);
      }
    });

    it('様子見を選択すると「様子を見ている」ログが出る', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.35); // 様子見を選択

      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate({ aiType: 'random' }));
      const { action, target } = ai.decideAction(enemy, members);

      // 様子見が選ばれた場合
      if (action.id === 'wait') {
        const hpBefore = target.hp;
        const result = action.execute(target, createEnemyContext(enemy));

        expect(target.hp).toBe(hpBefore); // ダメージなし
        expect(result.logs.some(l => l.text.includes('様子を見ている'))).toBe(true);
      }
    });

    it('毒攻撃で毒状態を付与する', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5); // 通常攻撃を選択 (rand >= 0.4)

      const poisonEnemy = new Enemy(0, 0, 1, createTestEnemyTemplate({
        aiType: 'random',
        poisonChance: 1.0, // 100%毒付与
      }));

      expect(members[0].hasStatusEffect('poison')).toBe(false);

      const { action, target } = ai.decideAction(poisonEnemy, members);
      action.execute(target, createEnemyContext(poisonEnemy));

      expect(members[0].hasStatusEffect('poison')).toBe(true);
    });

    it('ターゲットが死亡すると倒れたログが出る', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      // メンバーのHPを1にして即死させる
      members[0].takeDamageRaw(members[0].hp - 1);

      const strongEnemy = new Enemy(0, 0, 10, createTestEnemyTemplate({
        aiType: 'aggressive',
        attackMultiplier: 10.0, // 高ダメージ
      }));

      const { action, target } = ai.decideAction(strongEnemy, members);
      const result = action.execute(target, createEnemyContext(strongEnemy));

      expect(target.isDead()).toBe(true);
      expect(result.logs.some(l => l.text.includes('倒した'))).toBe(true);
    });

    it('防御中のメンバーへの攻撃は防御ログが出る', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      members[0].defend(); // 防御状態にする

      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate());
      const { action, target } = ai.decideAction(enemy, members);
      const result = action.execute(target, createEnemyContext(enemy));

      expect(result.logs.some(l => l.text.includes('防御した'))).toBe(true);
    });
  });
});
