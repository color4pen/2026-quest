import { Party } from './Party';
import { createTestMemberDef } from '../__test-helpers__/factories';

describe('Party', () => {
  describe('メンバー管理', () => {
    it('メンバーを追加するとgetMemberCountが増える', () => {
      const party = new Party();
      expect(party.getMemberCount()).toBe(0);

      party.addMember(createTestMemberDef({ id: 'hero' }));
      expect(party.getMemberCount()).toBe(1);
    });

    it('最大人数を超えて追加しようとすると false が返る', () => {
      const party = new Party();
      party.addMember(createTestMemberDef({ id: 'a' }));
      party.addMember(createTestMemberDef({ id: 'b' }));
      party.addMember(createTestMemberDef({ id: 'c' }));
      party.addMember(createTestMemberDef({ id: 'd' }));
      expect(party.isFull()).toBe(true);

      expect(party.addMember(createTestMemberDef({ id: 'e' }))).toBe(false);
    });

    it('同じIDのメンバーは重複追加できない', () => {
      const party = new Party();
      expect(party.addMember(createTestMemberDef({ id: 'hero' }))).toBe(true);
      expect(party.addMember(createTestMemberDef({ id: 'hero' }))).toBe(false);
      expect(party.getMemberCount()).toBe(1);
    });

    it('全員死亡で isAllDead が true になる', () => {
      const party = new Party();
      party.addMember(createTestMemberDef({ id: 'hero' }));
      const member = party.getMember(0)!;
      member.takeDamageRaw(200);

      expect(party.isAllDead()).toBe(true);
    });

    it('リーダーは先頭メンバー', () => {
      const party = new Party();
      party.addMember(createTestMemberDef({ id: 'first', name: '一号' }));
      party.addMember(createTestMemberDef({ id: 'second', name: '二号' }));

      expect(party.getLeader()!.name).toBe('一号');
    });
  });

  describe('ゴールド管理', () => {
    it('ゴールドを加算すると getGold に反映される', () => {
      const party = new Party();
      const initial = party.getGold();
      party.addGold(100);
      expect(party.getGold()).toBe(initial + 100);
    });

    it('所持金以上の支払いは失敗し、金額は変わらない', () => {
      const party = new Party();
      const initial = party.getGold();
      expect(party.spendGold(99999)).toBe(false);
      expect(party.getGold()).toBe(initial);
    });

    it('所持金内の支払いは成功する', () => {
      const party = new Party();
      const initial = party.getGold();
      expect(party.spendGold(10)).toBe(true);
      expect(party.getGold()).toBe(initial - 10);
    });
  });

  describe('アイテム使用パイプライン', () => {
    it('HPが減ったメンバーに薬草を使うとHPが回復し、在庫が1減る', () => {
      const party = new Party();
      party.addMember(createTestMemberDef({ id: 'hero' }));
      const member = party.getMember(0)!;
      member.takeDamageRaw(50);

      party.addItemById('potion', 2);
      const countBefore = party.getItemCount('potion');
      const result = party.useItemOnMember('potion', member);

      expect(result.success).toBe(true);
      expect(member.hp).toBeGreaterThan(50);
      expect(party.getItemCount('potion')).toBe(countBefore - 1);
    });

    it('HP満タンのメンバーには薬草を使えない', () => {
      const party = new Party();
      party.addMember(createTestMemberDef({ id: 'hero' }));
      const member = party.getMember(0)!;

      party.addItemById('potion', 1);
      const result = party.useItemOnMember('potion', member);
      expect(result.success).toBe(false);
    });

    it('在庫0のアイテムは使用できない', () => {
      const party = new Party();
      party.addMember(createTestMemberDef({ id: 'hero' }));
      const member = party.getMember(0)!;
      member.takeDamageRaw(50);

      // elixir は初期インベントリに含まれていない
      const result = party.useItemOnMember('elixir', member);
      expect(result.success).toBe(false);
      expect(result.message).toContain('ありません');
    });
  });

  describe('装備の着脱', () => {
    it('武器を装備するとインベントリから消え、メンバーに反映される', () => {
      const party = new Party();
      party.addMember(createTestMemberDef({ id: 'hero' }));
      party.addItemById('iron_sword', 1);

      const result = party.equipItem('hero', 'iron_sword');
      expect(result.success).toBe(true);
      expect(party.getItemCount('iron_sword')).toBe(0);

      const member = party.getMemberById('hero')!;
      expect(member.getEquipmentAt('weapon')).not.toBeNull();
    });

    it('装備中の武器を付け替えると、前の武器がインベントリに戻る', () => {
      const party = new Party();
      party.addMember(createTestMemberDef({ id: 'hero' }));
      // 初期インベントリに wooden_sword が1つある
      party.addItemById('iron_sword', 1);

      party.equipItem('hero', 'wooden_sword');
      expect(party.getItemCount('wooden_sword')).toBe(0); // 装備したので消える

      party.equipItem('hero', 'iron_sword');
      // 木の剣がインベントリに戻っている
      expect(party.getItemCount('wooden_sword')).toBe(1);
      expect(party.getItemCount('iron_sword')).toBe(0);
    });

    it('装備を外すとインベントリに戻る', () => {
      const party = new Party();
      party.addMember(createTestMemberDef({ id: 'hero' }));
      party.addItemById('iron_sword', 1);

      party.equipItem('hero', 'iron_sword');
      const result = party.unequipItem('hero', 'weapon');

      expect(result.success).toBe(true);
      expect(party.getItemCount('iron_sword')).toBe(1);
    });
  });
});
