import { InfluenzaEffect } from './InfluenzaEffect';
import { PartyMember } from '../PartyMember';
import { createTestMemberDef } from '../../__test-helpers__/factories';

describe('InfluenzaEffect — インフルエンザ', () => {
  describe('ターン終了時のダメージ', () => {
    it('最大HP100のキャラに毎ターン5ダメージ（5%）を与える', () => {
      const member = new PartyMember(createTestMemberDef());
      const flu = new InfluenzaEffect();

      const result = flu.onTurnEnd(member);

      expect(result).not.toBeNull();
      expect(result!.damage).toBe(5);
      expect(member.hp).toBe(95);
    });

    it('毒より軽いが同じ仕組みで動作する', () => {
      const member = new PartyMember(createTestMemberDef({ baseStats: { hp: 200, maxHp: 200, mp: 30, maxMp: 30, attack: 15 } }));
      const flu = new InfluenzaEffect();

      const result = flu.onTurnEnd(member);

      expect(result!.damage).toBe(10); // floor(200 * 0.05) = 10
      expect(result!.message).toContain('インフルエンザ');
    });

    it('デフォルトは永続', () => {
      const flu = new InfluenzaEffect();
      expect(flu.remainingTurns).toBe(-1);
      expect(flu.type).toBe('influenza');
    });
  });
});
