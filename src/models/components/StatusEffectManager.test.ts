import { StatusEffectManager } from './StatusEffectManager';
import { PartyMember } from '../PartyMember';
import { PartyMemberTemplate } from '../../types/party';

describe('StatusEffectManager', () => {
  function createMember(hp?: number): PartyMember {
    const definition: PartyMemberTemplate = {
      id: 'test',
      name: 'テスト',
      class: 'warrior',
      baseStats: { maxHp: hp ?? 100, maxMp: 20, attack: 10 },
      skills: [],
    };
    return new PartyMember(definition);
  }

  describe('add', () => {
    it('状態異常を追加できる', () => {
      const manager = new StatusEffectManager();

      const result = manager.add('poison');

      expect(result).toBe(true);
      expect(manager.has('poison')).toBe(true);
    });

    it('同じ状態異常は重複しない', () => {
      const manager = new StatusEffectManager();
      manager.add('poison');

      const result = manager.add('poison');

      expect(result).toBe(false);
    });

    it('異なる状態異常は追加できる', () => {
      const manager = new StatusEffectManager();
      manager.add('poison');

      const result = manager.add('influenza');

      expect(result).toBe(true);
      expect(manager.has('poison')).toBe(true);
      expect(manager.has('influenza')).toBe(true);
    });
  });

  describe('remove', () => {
    it('状態異常を解除できる', () => {
      const manager = new StatusEffectManager();
      manager.add('poison');

      const result = manager.remove('poison');

      expect(result).toBe(true);
      expect(manager.has('poison')).toBe(false);
    });

    it('存在しない状態異常の解除はfalseを返す', () => {
      const manager = new StatusEffectManager();

      const result = manager.remove('poison');

      expect(result).toBe(false);
    });
  });

  describe('has', () => {
    it('状態異常がある場合はtrueを返す', () => {
      const manager = new StatusEffectManager();
      manager.add('poison');

      expect(manager.has('poison')).toBe(true);
    });

    it('状態異常がない場合はfalseを返す', () => {
      const manager = new StatusEffectManager();

      expect(manager.has('poison')).toBe(false);
    });
  });

  describe('clear', () => {
    it('全ての状態異常を解除する', () => {
      const manager = new StatusEffectManager();
      manager.add('poison');
      manager.add('influenza');

      manager.clear();

      expect(manager.has('poison')).toBe(false);
      expect(manager.has('influenza')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('全ての状態異常を取得する', () => {
      const manager = new StatusEffectManager();
      manager.add('poison');
      manager.add('influenza');

      const effects = manager.getAll();

      expect(effects.length).toBe(2);
    });
  });

  describe('getInfos', () => {
    it('UI表示用の情報を取得する', () => {
      const manager = new StatusEffectManager();
      manager.add('poison');

      const infos = manager.getInfos();

      expect(infos.length).toBe(1);
      expect(infos[0].type).toBe('poison');
      expect(infos[0].name).toBe('毒');
    });
  });

  describe('processTurnEnd', () => {
    it('毒ダメージが適用される', () => {
      const manager = new StatusEffectManager();
      manager.add('poison');
      const target = createMember(100);
      const initialHp = target.hp;

      const results = manager.processTurnEnd(target);

      expect(results.length).toBe(1);
      expect(results[0].damage).toBeDefined();
      expect(target.hp).toBeLessThan(initialHp);
    });

    it('ターゲットが死亡した場合はtargetDiedがtrue', () => {
      const manager = new StatusEffectManager();
      manager.add('poison');
      const target = createMember(100);
      // HPを1にする
      target.takeDamageRaw(99);

      const results = manager.processTurnEnd(target);

      expect(results[0].targetDied).toBe(true);
    });

    it('持続時間が終了した状態異常は削除される', () => {
      const manager = new StatusEffectManager();
      manager.add('poison', 1); // 1ターン
      const target = createMember();

      manager.processTurnEnd(target);

      expect(manager.has('poison')).toBe(false);
    });
  });
});
