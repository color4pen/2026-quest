import { CombatCalculator, COMBAT_CONSTANTS } from './CombatCalculator';

describe('CombatCalculator', () => {
  describe('通常攻撃のダメージ計算', () => {
    it('攻撃力10のプレイヤーが攻撃すると、10〜14のダメージを与える', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0); // 乱数0 → +0
      expect(CombatCalculator.calculateAttackDamage({ attack: 10, isPlayer: true })).toBe(10);

      vi.spyOn(Math, 'random').mockReturnValue(0.99); // 乱数0.99 → +4
      expect(CombatCalculator.calculateAttackDamage({ attack: 10, isPlayer: true })).toBe(14);
    });

    it('敵が攻撃する場合は乱数幅が3に縮小される（10〜12）', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(CombatCalculator.calculateAttackDamage({ attack: 10, isPlayer: false })).toBe(10);

      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      expect(CombatCalculator.calculateAttackDamage({ attack: 10, isPlayer: false })).toBe(12);
    });
  });

  describe('防御によるダメージ軽減', () => {
    it('防御力5の相手に攻撃すると、素のダメージから5が引かれる', () => {
      const result = CombatCalculator.applyDefense(20, { defense: 5 });
      expect(result.damage).toBe(15);
      expect(result.originalDamage).toBe(20);
    });

    it('防御力がダメージを上回っても最低1ダメージは保証される', () => {
      const result = CombatCalculator.applyDefense(3, { defense: 10 });
      expect(result.damage).toBe(COMBAT_CONSTANTS.MIN_DAMAGE);
    });

    it('防御コマンド中の相手にはダメージがさらに半減する', () => {
      const result = CombatCalculator.applyDefense(20, { defense: 0, isDefending: true });
      expect(result.damage).toBe(10); // 20 * 0.5 = 10
    });

    it('防御力 + 防御コマンドの複合適用', () => {
      const result = CombatCalculator.applyDefense(20, { defense: 6, isDefending: true });
      // (20 - 6) = 14 → 14 * 0.5 = 7
      expect(result.damage).toBe(7);
    });
  });

  describe('スキルによるダメージ計算', () => {
    it('power倍率1.5のスキルで攻撃力10なら、15+乱数のダメージになる', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const skill = { id: 's', name: 's', description: '', mpCost: 5, power: 1.5, type: 'attack' as const, target: 'enemy' as const };
      expect(CombatCalculator.calculateSkillDamage({ attack: 10 }, skill)).toBe(15);
    });

    it('スキルダメージにも防御は適用される', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const skill = { id: 's', name: 's', description: '', mpCost: 5, power: 2.0, type: 'attack' as const, target: 'enemy' as const };
      const result = CombatCalculator.calculateDamage({ attack: 10 }, { defense: 5 }, skill);
      // skill damage = floor(10 * 2.0) + 0 = 20, defense = 20 - 5 = 15
      expect(result.damage).toBe(15);
    });
  });

  describe('回復量の計算', () => {
    it('HP 70/100 のキャラに50回復すると、30だけ回復する（上限クランプ）', () => {
      expect(CombatCalculator.calculateHeal(50, 70, 100)).toBe(30);
    });

    it('HP満タンのキャラには0回復', () => {
      expect(CombatCalculator.calculateHeal(50, 100, 100)).toBe(0);
    });
  });

  describe('状態異常ダメージ', () => {
    it('最大HP100で割合10%なら、10ダメージ', () => {
      expect(CombatCalculator.calculateStatusDamage(100, 0.1)).toBe(10);
    });

    it('割合計算の結果が0以下でも最低1ダメージ', () => {
      expect(CombatCalculator.calculateStatusDamage(5, 0.01)).toBe(1);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
