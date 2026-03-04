import { EquipmentItem } from './EquipmentItem';
import type { ItemUseContext } from './Item';

describe('EquipmentItem — 装備品', () => {
  const ironSword = new EquipmentItem('iron_sword', '鉄の剣', '丈夫な鉄製の剣', 'weapon', { attack: 8 });
  const steelArmor = new EquipmentItem('steel_armor', '鋼の鎧', '最高級の防御力', 'armor', { defense: 15 });
  const magicStaff = new EquipmentItem('magic_staff', '魔法の杖', '魔力を高める杖', 'weapon', { attack: 5, maxMp: 20 });

  describe('ステータス情報', () => {
    it('鉄の剣は攻撃+8のステータスを持つ', () => {
      expect(ironSword.stats.attack).toBe(8);
      expect(ironSword.slot).toBe('weapon');
    });

    it('getStatsDescription が「攻撃+8」を返す', () => {
      expect(ironSword.getStatsDescription()).toBe('攻撃+8');
    });

    it('複数ステータスを持つ装備は全て表示される', () => {
      expect(magicStaff.getStatsDescription()).toBe('攻撃+5 MP+20');
    });

    it('getEquipmentInfo にスロットとステータスが含まれる', () => {
      const info = ironSword.getEquipmentInfo();
      expect(info.slot).toBe('weapon');
      expect(info.stats.attack).toBe(8);
    });
  });

  describe('直接使用は不可', () => {
    const ctx: ItemUseContext = { targetHp: 50, targetMaxHp: 100, targetStatusEffects: [], isInBattle: false };

    it('メニューからもバトルからも use できない', () => {
      expect(ironSword.canUseInMenu()).toBe(false);
      expect(ironSword.canUseInBattle()).toBe(false);
      expect(ironSword.canUse(ctx)).toBe(false);
    });

    it('「そうびメニューから装備してください」と表示される', () => {
      const result = ironSword.use(ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain('そうび');
    });
  });

  describe('防具のステータス', () => {
    it('鋼の鎧は防御+15のステータスを持つ', () => {
      expect(steelArmor.stats.defense).toBe(15);
      expect(steelArmor.slot).toBe('armor');
      expect(steelArmor.getStatsDescription()).toBe('防御+15');
    });
  });
});
