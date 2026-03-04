import { EquipmentManager } from './EquipmentManager';
import { EquipmentItem } from '../items/EquipmentItem';

describe('EquipmentManager', () => {
  function createWeapon(attack: number = 10): EquipmentItem {
    return new EquipmentItem('sword', '剣', '攻撃力+' + attack, 'weapon', { attack });
  }

  function createArmor(defense: number = 5): EquipmentItem {
    return new EquipmentItem('armor', '鎧', '防御力+' + defense, 'armor', { defense });
  }

  function createAccessory(maxHp: number = 20): EquipmentItem {
    return new EquipmentItem('ring', '指輪', '最大HP+' + maxHp, 'accessory', { maxHp });
  }

  describe('equip', () => {
    it('装備を追加できる', () => {
      const manager = new EquipmentManager();
      const sword = createWeapon();

      const previous = manager.equip(sword);

      expect(previous).toBeNull();
      expect(manager.getAt('weapon')).toBe(sword);
    });

    it('装備を交換すると前の装備が返る', () => {
      const manager = new EquipmentManager();
      const sword1 = createWeapon(10);
      const sword2 = createWeapon(20);
      manager.equip(sword1);

      const previous = manager.equip(sword2);

      expect(previous).toBe(sword1);
      expect(manager.getAt('weapon')).toBe(sword2);
    });
  });

  describe('unequip', () => {
    it('装備を外せる', () => {
      const manager = new EquipmentManager();
      const sword = createWeapon();
      manager.equip(sword);

      const removed = manager.unequip('weapon');

      expect(removed).toBe(sword);
      expect(manager.getAt('weapon')).toBeNull();
    });

    it('装備がない場合はnullを返す', () => {
      const manager = new EquipmentManager();

      const removed = manager.unequip('weapon');

      expect(removed).toBeNull();
    });
  });

  describe('getAt', () => {
    it('指定スロットの装備を取得できる', () => {
      const manager = new EquipmentManager();
      const sword = createWeapon();
      manager.equip(sword);

      expect(manager.getAt('weapon')).toBe(sword);
      expect(manager.getAt('armor')).toBeNull();
    });
  });

  describe('getAll', () => {
    it('全装備を取得できる', () => {
      const manager = new EquipmentManager();
      const sword = createWeapon();
      const armor = createArmor();
      manager.equip(sword);
      manager.equip(armor);

      const all = manager.getAll();

      expect(all.weapon).toBe(sword);
      expect(all.armor).toBe(armor);
      expect(all.accessory).toBeNull();
    });
  });

  describe('getBonuses', () => {
    it('装備がない場合は0を返す', () => {
      const manager = new EquipmentManager();

      const bonuses = manager.getBonuses();

      expect(bonuses.attack).toBe(0);
      expect(bonuses.defense).toBe(0);
      expect(bonuses.maxHp).toBe(0);
      expect(bonuses.maxMp).toBe(0);
    });

    it('全装備のボーナスを合算する', () => {
      const manager = new EquipmentManager();
      manager.equip(createWeapon(15));
      manager.equip(createArmor(10));
      manager.equip(createAccessory(30));

      const bonuses = manager.getBonuses();

      expect(bonuses.attack).toBe(15);
      expect(bonuses.defense).toBe(10);
      expect(bonuses.maxHp).toBe(30);
    });
  });

  describe('getState', () => {
    it('UI表示用の状態を取得できる', () => {
      const manager = new EquipmentManager();
      manager.equip(createWeapon());

      const state = manager.getState();

      expect(state.weapon).not.toBeNull();
      expect(state.weapon?.name).toBe('剣');
      expect(state.armor).toBeNull();
      expect(state.accessory).toBeNull();
    });
  });
});
