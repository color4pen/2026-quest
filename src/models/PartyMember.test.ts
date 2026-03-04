import { PartyMember } from './PartyMember';
import { EquipmentItem } from './items/EquipmentItem';
import { createTestMemberDef } from '../__test-helpers__/factories';

describe('PartyMember', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('戦闘でダメージを受ける', () => {
    it('攻撃力20の攻撃を防御力0で受けると、乱数分のダメージを受ける', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const member = new PartyMember(createTestMemberDef());
      const damage = member.takeDamage(20);
      // applyDefense: max(1, 20 - 0) = 20, not defending
      expect(damage).toBe(20);
      expect(member.hp).toBe(80);
    });

    it('防御コマンド中は受けるダメージが半分になる', () => {
      const member = new PartyMember(createTestMemberDef());
      member.defend();
      const damage = member.takeDamage(20);
      // applyDefense: max(1, 20 - 0) = 20, defending → floor(20 * 0.5) = 10
      expect(damage).toBe(10);
      expect(member.hp).toBe(90);
    });

    it('HPが0になると isDead() が true になる', () => {
      const member = new PartyMember(createTestMemberDef());
      member.takeDamageRaw(100);
      expect(member.isDead()).toBe(true);
      expect(member.isAlive()).toBe(false);
    });
  });

  describe('状態異常によるダメージ（takeDamageRaw）', () => {
    it('防御力を無視して直接ダメージを受ける', () => {
      const member = new PartyMember(createTestMemberDef());
      const armor = new EquipmentItem('armor', '鎧', '防御+10', 'armor', { defense: 10 });
      member.equip(armor);

      member.takeDamageRaw(20);
      // 防御力10があっても20ダメージそのまま
      expect(member.hp).toBe(80);
    });

    it('防御コマンド中でも軽減されない', () => {
      const member = new PartyMember(createTestMemberDef());
      member.defend();
      member.takeDamageRaw(20);
      expect(member.hp).toBe(80);
    });
  });

  describe('回復', () => {
    it('薬草で30回復し、最大HPを超えない', () => {
      const member = new PartyMember(createTestMemberDef());
      member.takeDamageRaw(50);
      expect(member.hp).toBe(50);

      const healed = member.heal(30);
      expect(healed).toBe(30);
      expect(member.hp).toBe(80);
    });

    it('HP満タンの場合は0回復', () => {
      const member = new PartyMember(createTestMemberDef());
      const healed = member.heal(30);
      expect(healed).toBe(0);
    });

    it('MP回復は effectiveMaxMp を上限とする', () => {
      const member = new PartyMember(createTestMemberDef()); // maxMp: 30
      member.useMp(20); // mp: 10
      const restored = member.restoreMp(100);
      expect(restored).toBe(20); // 30 - 10 = 20
      expect(member.mp).toBe(30);
    });
  });

  describe('MP消費', () => {
    it('MP 5のスキルをMP 30で使用すると、MP 25が残る', () => {
      const member = new PartyMember(createTestMemberDef()); // maxMp: 30
      const success = member.useMp(5);
      expect(success).toBe(true);
      expect(member.mp).toBe(25);
    });

    it('MP不足のスキルは使用できない（useMp が false）', () => {
      const member = new PartyMember(createTestMemberDef()); // maxMp: 30
      const success = member.useMp(50);
      expect(success).toBe(false);
      expect(member.mp).toBe(30); // 変化なし
    });
  });

  describe('装備によるステータス変化', () => {
    it('攻撃+5の武器を装備すると getEffectiveAttack が5上がる', () => {
      const member = new PartyMember(createTestMemberDef()); // attack: 15
      const sword = new EquipmentItem('sword', '剣', '攻撃+5', 'weapon', { attack: 5 });

      member.equip(sword);
      expect(member.getEffectiveAttack()).toBe(20);
    });

    it('武器を付け替えると前の武器が返却される', () => {
      const member = new PartyMember(createTestMemberDef());
      const sword1 = new EquipmentItem('sword1', '剣1', '', 'weapon', { attack: 3 });
      const sword2 = new EquipmentItem('sword2', '剣2', '', 'weapon', { attack: 8 });

      member.equip(sword1);
      const previous = member.equip(sword2);
      expect(previous).toBe(sword1);
      expect(member.getEffectiveAttack()).toBe(15 + 8);
    });

    it('防具のmaxHp+20で回復上限も上がる', () => {
      const member = new PartyMember(createTestMemberDef()); // maxHp: 100
      const armor = new EquipmentItem('armor', '鎧', 'HP+20', 'armor', { maxHp: 20 });
      member.equip(armor);

      expect(member.getEffectiveMaxHp()).toBe(120);
    });
  });

  describe('レベルアップ', () => {
    it('経験値がxpToNextに達するとレベルが1上がる', () => {
      const member = new PartyMember(createTestMemberDef());
      expect(member.level).toBe(1);

      const leveled = member.gainXp(100); // xpToNext = 100
      expect(leveled).toBe(true);
      expect(member.level).toBe(2);
    });

    it('レベルアップで基礎ステータスが成長する', () => {
      const member = new PartyMember(createTestMemberDef()); // hp:100, mp:30, atk:15, bonus: hp+20,mp+10,atk+5
      const originalMaxHp = member.maxHp;
      const originalAttack = member.attack;

      member.gainXp(100);
      expect(member.maxHp).toBe(originalMaxHp + 20);
      expect(member.attack).toBe(originalAttack + 5);
    });

    it('レベルアップしない経験値量では false が返る', () => {
      const member = new PartyMember(createTestMemberDef());
      const leveled = member.gainXp(50);
      expect(leveled).toBe(false);
      expect(member.level).toBe(1);
    });
  });

  describe('状態異常の管理', () => {
    it('毒を付与すると hasStatusEffect("poison") が true になる', () => {
      const member = new PartyMember(createTestMemberDef());
      member.addStatusEffect('poison');
      expect(member.hasStatusEffect('poison')).toBe(true);
    });

    it('同じ状態異常は重複付与されない', () => {
      const member = new PartyMember(createTestMemberDef());
      expect(member.addStatusEffect('poison')).toBe(true);
      expect(member.addStatusEffect('poison')).toBe(false);
      expect(member.getStatusEffects().length).toBe(1);
    });

    it('死亡キャラには状態異常を付与できない', () => {
      const member = new PartyMember(createTestMemberDef());
      member.takeDamageRaw(200);
      expect(member.addStatusEffect('poison')).toBe(false);
    });

    it('processStatusEffectsTurnEnd でダメージ適用→tick→期限切れ除去が行われる', () => {
      const member = new PartyMember(createTestMemberDef());
      member.addStatusEffect('poison', 1); // 1ターン限定の毒

      const results = member.processStatusEffectsTurnEnd();
      expect(results.length).toBe(1);
      expect(results[0].damage).toBe(10); // 100 * 0.1

      // 1ターンで除去されるべき
      expect(member.hasStatusEffect('poison')).toBe(false);
    });
  });

  describe('セーブデータからの復元', () => {
    it('restoreState で全ステータスが復元される', () => {
      const member = new PartyMember(createTestMemberDef());
      member.restoreState(50, 20, 5, 30, 200, 200, 60, 30, 10);

      expect(member.hp).toBe(50);
      expect(member.mp).toBe(20);
      expect(member.level).toBe(5);
      expect(member.xp).toBe(30);
      expect(member.xpToNext).toBe(200);
      expect(member.maxHp).toBe(200);
      expect(member.maxMp).toBe(60);
      expect(member.attack).toBe(30);
      expect(member.baseDefense).toBe(10);
    });
  });
});
