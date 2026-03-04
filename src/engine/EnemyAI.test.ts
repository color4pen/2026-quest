import { EnemyAI } from './EnemyAI';
import { Party, PartyMember, Enemy } from '../models';
import { INITIAL_PARTY_MEMBER } from '../data/partyMembers';
import { createTestEnemyTemplate } from '../__test-helpers__/factories';

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
    it('aggressive AIは attack か power_attack を返す', () => {
      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate({ aiType: 'aggressive' }));

      // 複数回実行して全てがattackかpower_attackであることを確認
      const actions = new Set<string>();
      for (let i = 0; i < 100; i++) {
        actions.add(ai.decideAction(enemy));
      }

      expect(actions.has('wait')).toBe(false);
      expect(actions.has('attack') || actions.has('power_attack')).toBe(true);
    });

    it('defensive AIは attack か wait を返す', () => {
      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate({ aiType: 'defensive' }));

      const actions = new Set<string>();
      for (let i = 0; i < 100; i++) {
        actions.add(ai.decideAction(enemy));
      }

      expect(actions.has('power_attack')).toBe(false);
      expect(actions.has('attack') || actions.has('wait')).toBe(true);
    });

    it('random AIは全ての行動を返しうる', () => {
      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate({ aiType: 'random' }));

      const actions = new Set<string>();
      for (let i = 0; i < 200; i++) {
        actions.add(ai.decideAction(enemy));
      }

      // randomは3種全ての行動が出る可能性がある
      expect(actions.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('executeTurn', () => {
    it('attackでパーティメンバーにダメージを与える', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5); // attack を選択

      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate({ attackMultiplier: 1.0 }));

      const hpBefore = members[0].hp;
      const result = ai.executeTurn(enemy, members);

      expect(members[0].hp).toBeLessThan(hpBefore);
      expect(result.logs.some(l => l.text.includes('攻撃'))).toBe(true);
      expect(result.logs.some(l => l.text.includes('ダメージ'))).toBe(true);
    });

    it('power_attackで強攻撃ログが出る', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1); // power_attack を選択

      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate({ aiType: 'random' }));

      const result = ai.executeTurn(enemy, members);

      expect(result.logs.some(l => l.text.includes('強攻撃'))).toBe(true);
    });

    it('waitで「様子を見ている」ログを出す', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.35); // wait を選択

      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate({ aiType: 'random' }));

      const hpBefore = members[0].hp;
      const result = ai.executeTurn(enemy, members);

      expect(members[0].hp).toBe(hpBefore); // ダメージなし
      expect(result.logs.some(l => l.text.includes('様子を見ている'))).toBe(true);
    });

    it('毒攻撃で毒状態を付与する', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5); // attack + 毒付与

      const poisonEnemy = new Enemy(0, 0, 1, createTestEnemyTemplate({
        aiType: 'random',
        poisonChance: 1.0, // 100%毒付与
      }));

      expect(members[0].hasStatusEffect('poison')).toBe(false);

      const result = ai.executeTurn(poisonEnemy, members);

      expect(members[0].hasStatusEffect('poison')).toBe(true);
      expect(result.logs.some(l => l.text.includes('毒を受けた'))).toBe(true);
    });

    it('パーティメンバーが死亡したらpartyMemberDiedがtrue', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      // メンバーのHPを1にして即死させる
      members[0].takeDamageRaw(members[0].hp - 1);

      const strongEnemy = new Enemy(0, 0, 10, createTestEnemyTemplate({
        aiType: 'aggressive',
        attackMultiplier: 10.0, // 高ダメージ
      }));

      const result = ai.executeTurn(strongEnemy, members);

      expect(members[0].isDead()).toBe(true);
      expect(result.partyMemberDied).toBe(true);
      expect(result.logs.some(l => l.text.includes('倒れた'))).toBe(true);
    });

    it('防御中のメンバーへの攻撃は防御ログが出る', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      members[0].defend(); // 防御状態にする

      const enemy = new Enemy(0, 0, 1, createTestEnemyTemplate());

      const result = ai.executeTurn(enemy, members);

      expect(result.logs.some(l => l.text.includes('防御した'))).toBe(true);
    });
  });
});
