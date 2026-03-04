import { BattleActionExecutor } from './BattleActionExecutor';
import { Party, PartyMember, Enemy } from '../models';
import { SkillDefinition } from '../types/game';
import { INITIAL_PARTY_MEMBER } from '../data/partyMembers';
import { createTestEnemyTemplate } from '../__test-helpers__/factories';

describe('BattleActionExecutor', () => {
  let party: Party;
  let enemies: Enemy[];
  let executor: BattleActionExecutor;
  let member: PartyMember;

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    party = new Party();
    party.addMember(INITIAL_PARTY_MEMBER);
    member = party.getLeader()!;

    enemies = [
      new Enemy(0, 0, 1, createTestEnemyTemplate({ name: 'スライム', hpMultiplier: 0.5 })),
      new Enemy(0, 0, 1, createTestEnemyTemplate({ name: 'ゴブリン', hpMultiplier: 1.0 })),
    ];

    executor = new BattleActionExecutor(party, enemies);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeAttack', () => {
    it('敵にダメージを与える', () => {
      const hpBefore = enemies[0].hp;
      const logs = executor.executeAttack(member, 0);

      expect(enemies[0].hp).toBeLessThan(hpBefore);
      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs[0].text).toContain('の攻撃');
      expect(logs[1].text).toContain('ダメージ');
    });

    it('敵を倒すと「倒した」ログが出る', () => {
      // 敵のHPを1にしておく
      enemies[0].takeDamage(enemies[0].hp - 1);

      const logs = executor.executeAttack(member, 0);

      expect(enemies[0].isDead()).toBe(true);
      expect(logs.some(l => l.text.includes('倒した'))).toBe(true);
    });

    it('存在しないターゲットには空のログを返す', () => {
      const logs = executor.executeAttack(member, 99);

      expect(logs).toHaveLength(0);
    });

    it('死亡済みの敵には攻撃できない', () => {
      enemies[0].takeDamage(enemies[0].maxHp);
      expect(enemies[0].isDead()).toBe(true);

      const logs = executor.executeAttack(member, 0);

      expect(logs).toHaveLength(0);
    });
  });

  describe('executeSkill', () => {
    const attackSkill: SkillDefinition = {
      id: 'fire',
      name: 'ファイア',
      description: '炎で攻撃',
      mpCost: 5,
      type: 'attack',
      power: 30,
      target: 'enemy',
    };

    const healSkill: SkillDefinition = {
      id: 'heal',
      name: 'ヒール',
      description: 'HPを回復',
      mpCost: 4,
      type: 'heal',
      power: 30,
      target: 'self',
    };

    it('攻撃スキルで敵にダメージを与える', () => {
      const hpBefore = enemies[0].hp;
      const logs = executor.executeSkill(member, attackSkill, 0);

      expect(enemies[0].hp).toBeLessThan(hpBefore);
      expect(logs.some(l => l.text.includes('ファイア'))).toBe(true);
      expect(logs.some(l => l.text.includes('ダメージ'))).toBe(true);
    });

    it('回復スキルで味方のHPを回復する', () => {
      member.takeDamageRaw(50);
      const hpBefore = member.hp;

      const logs = executor.executeSkill(member, healSkill, undefined, member.id);

      expect(member.hp).toBeGreaterThan(hpBefore);
      expect(logs.some(l => l.text.includes('ヒール'))).toBe(true);
      expect(logs.some(l => l.text.includes('回復'))).toBe(true);
    });

    it('MP不足でスキルが失敗する', () => {
      const expensiveSkill: SkillDefinition = { ...attackSkill, mpCost: 9999 };

      const logs = executor.executeSkill(member, expensiveSkill, 0);

      expect(logs).toHaveLength(0);
    });

    it('スキル使用でMPが消費される', () => {
      const mpBefore = member.mp;

      executor.executeSkill(member, attackSkill, 0);

      expect(member.mp).toBe(mpBefore - attackSkill.mpCost);
    });
  });

  describe('executeItem', () => {
    beforeEach(() => {
      // テスト用にアイテムを追加
      party.addItemById('potion', 3);
      party.addItemById('bomb', 2);
      party.addItemById('antidote', 1);
    });

    it('回復アイテムでHPを回復する', () => {
      member.takeDamageRaw(50);
      const hpBefore = member.hp;

      const logs = executor.executeItem(member, 'potion', undefined, member.id);

      expect(member.hp).toBeGreaterThan(hpBefore);
      expect(logs.some(l => l.text.includes('回復'))).toBe(true);
    });

    it('ダメージアイテムで敵にダメージを与える', () => {
      const hpBefore = enemies[0].hp;

      const logs = executor.executeItem(member, 'bomb', 0);

      expect(enemies[0].hp).toBeLessThan(hpBefore);
      expect(logs.some(l => l.text.includes('ダメージ'))).toBe(true);
    });

    it('治療アイテムで状態異常を治す', () => {
      member.addStatusEffect('poison');
      expect(member.hasStatusEffect('poison')).toBe(true);

      const logs = executor.executeItem(member, 'antidote', undefined, member.id);

      expect(member.hasStatusEffect('poison')).toBe(false);
      expect(logs.some(l => l.text.includes('治った'))).toBe(true);
    });

    it('状態異常がない場合は効果がない', () => {
      expect(member.hasStatusEffect('poison')).toBe(false);

      const logs = executor.executeItem(member, 'antidote', undefined, member.id);

      expect(logs.some(l => l.text.includes('効果がなかった'))).toBe(true);
    });

    it('存在しないアイテムは空のログを返す', () => {
      const logs = executor.executeItem(member, 'nonexistent_item');

      expect(logs).toHaveLength(0);
    });

    it('アイテム使用でインベントリから消費される', () => {
      member.takeDamageRaw(30); // 回復できるようにダメージを与える
      const countBefore = party.getItemCount('potion');

      executor.executeItem(member, 'potion', undefined, member.id);

      const countAfter = party.getItemCount('potion');
      expect(countAfter).toBe(countBefore - 1);
    });
  });

  describe('executeDefend', () => {
    it('防御状態になる', () => {
      const logs = executor.executeDefend(member);

      expect(member.isDefending).toBe(true);
      expect(logs[0].text).toContain('防御');
    });
  });
});
