import { PoisonEffect } from './PoisonEffect';
import { PartyMember } from '../PartyMember';
import { createTestMemberDef } from '../../__test-helpers__/factories';

describe('PoisonEffect — 毒', () => {
  describe('ターン終了時のダメージ', () => {
    it('最大HP100のキャラに毎ターン10ダメージ（10%）を与える', () => {
      const member = new PartyMember(createTestMemberDef({ baseStats: { hp: 100, maxHp: 100, mp: 30, maxMp: 30, attack: 15 } }));
      const poison = new PoisonEffect();

      const result = poison.onTurnEnd(member);

      expect(result).not.toBeNull();
      expect(result!.damage).toBe(10);
      expect(member.hp).toBe(90);
    });

    it('最大HP15のキャラでも最低1ダメージは入る', () => {
      const member = new PartyMember(createTestMemberDef({ baseStats: { hp: 8, maxHp: 8, mp: 5, maxMp: 5, attack: 3 } }));
      const poison = new PoisonEffect();

      const result = poison.onTurnEnd(member);

      expect(result).not.toBeNull();
      expect(result!.damage).toBe(1); // floor(8 * 0.1) = 0 → max(1, 0) = 1
    });

    it('ダメージでHP 0以下になるとメッセージに「倒れた」が含まれる', () => {
      const member = new PartyMember(createTestMemberDef({ baseStats: { hp: 5, maxHp: 100, mp: 30, maxMp: 30, attack: 15 } }));
      // HPを5まで減らす
      member.takeDamageRaw(95);
      const poison = new PoisonEffect();

      const result = poison.onTurnEnd(member);

      expect(result).not.toBeNull();
      expect(result!.damage).toBe(10);
      expect(member.isDead()).toBe(true);
      expect(result!.message).toContain('倒れた');
    });

    it('死亡キャラには毒ダメージが発生しない', () => {
      const member = new PartyMember(createTestMemberDef());
      member.takeDamageRaw(200);
      expect(member.isDead()).toBe(true);
      const poison = new PoisonEffect();

      const result = poison.onTurnEnd(member);
      expect(result).toBeNull();
    });
  });

  describe('持続性', () => {
    it('デフォルトは永続（remainingTurns = -1）で自然回復しない', () => {
      const poison = new PoisonEffect();
      expect(poison.remainingTurns).toBe(-1);
    });

    it('tick() を呼んでも remainingTurns は -1 のまま', () => {
      const poison = new PoisonEffect();
      poison.tick();
      expect(poison.remainingTurns).toBe(-1);
      expect(poison.shouldRemove()).toBe(false);
    });

    it('duration指定ありの場合、tick() で remainingTurns が減る', () => {
      const poison = new PoisonEffect(3);
      expect(poison.remainingTurns).toBe(3);

      poison.tick();
      expect(poison.remainingTurns).toBe(2);

      poison.tick();
      poison.tick();
      expect(poison.remainingTurns).toBe(0);
      expect(poison.shouldRemove()).toBe(true);
    });
  });
});
