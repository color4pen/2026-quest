import { getEquippableItems } from './EquipmentPanel';
import { InventoryItemState, EquipmentSlot } from '../../types/game';

function createEquipmentItem(id: string, name: string, slot: EquipmentSlot): InventoryItemState {
  return {
    item: { id, name, description: '', type: 'equipment', equipSlot: slot },
    quantity: 1,
    canUseInMenu: false,
    canUseInBattle: false,
  };
}

function createConsumableItem(id: string, name: string): InventoryItemState {
  return {
    item: { id, name, description: '', type: 'heal' },
    quantity: 1,
    canUseInMenu: true,
    canUseInBattle: true,
  };
}

describe('getEquippableItems', () => {
  const inventory: InventoryItemState[] = [
    createEquipmentItem('wooden_sword', '木の剣', 'weapon'),
    createEquipmentItem('iron_sword', '鉄の剣', 'weapon'),
    createEquipmentItem('magic_staff', '魔法の杖', 'weapon'),
    createEquipmentItem('leather_armor', '革の鎧', 'armor'),
    createEquipmentItem('mage_robe', '魔法使いのローブ', 'armor'),
    createEquipmentItem('power_ring', '力の指輪', 'accessory'),
    createEquipmentItem('life_pendant', '命のペンダント', 'accessory'),
    createConsumableItem('potion', '薬草'),
  ];

  it('weapon スロットには武器のみ返す', () => {
    const result = getEquippableItems('weapon', inventory);

    expect(result.map(i => i.item.id)).toEqual([
      'wooden_sword', 'iron_sword', 'magic_staff',
    ]);
  });

  it('armor スロットには防具のみ返す', () => {
    const result = getEquippableItems('armor', inventory);

    expect(result.map(i => i.item.id)).toEqual([
      'leather_armor', 'mage_robe',
    ]);
  });

  it('accessory スロットには装飾品のみ返す', () => {
    const result = getEquippableItems('accessory', inventory);

    expect(result.map(i => i.item.id)).toEqual([
      'power_ring', 'life_pendant',
    ]);
  });

  it('消費アイテムは装備品として返さない', () => {
    const result = getEquippableItems('weapon', inventory);

    expect(result.every(i => i.item.type === 'equipment')).toBe(true);
  });

  it('空のインベントリでは空配列を返す', () => {
    const result = getEquippableItems('weapon', []);

    expect(result).toEqual([]);
  });
});
