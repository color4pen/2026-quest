import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Message, BattleState, DialogueState, ShopState, ShopItem } from '../types/game';
import { PartyState, PartyMemberState, InventoryItemState } from '../types/party';
import { SaveSlotInfo } from '../types/save';

// ==================== サンプルデータファクトリー ====================

export function createMember(overrides: Partial<PartyMemberState> = {}): PartyMemberState {
  return {
    id: 'member-1',
    name: 'テスト勇者',
    hp: 50,
    maxHp: 100,
    mp: 20,
    maxMp: 30,
    attack: 15,
    defense: 10,
    level: 1,
    xp: 0,
    xpToNext: 100,
    skills: [],
    equipment: {
      weapon: null,
      armor: null,
      accessory: null,
    },
    statusEffects: [],
    className: '勇者',
    class: 'warrior',
    isAlive: true,
    ...overrides,
  };
}

export function createPartyState(overrides: Partial<PartyState> = {}): PartyState {
  return {
    members: [createMember()],
    gold: 100,
    inventory: [],
    ...overrides,
  };
}

export function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 1,
    text: 'テストメッセージ',
    type: 'normal',
    ...overrides,
  };
}

export function createBattleState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    isActive: true,
    phase: 'command_select',
    result: null,
    partyMembers: [
      {
        id: 'hero',
        name: '勇者',
        hp: 50,
        maxHp: 100,
        mp: 20,
        maxMp: 30,
        attack: 15,
        defense: 10,
        isDefending: false,
        statusEffects: [],
      },
    ],
    currentMemberIndex: 0,
    enemies: [
      {
        id: 'enemy-1',
        name: 'スライム',
        hp: 30,
        maxHp: 30,
        attack: 5,
        defense: 2,
        xpReward: 10,
        goldMin: 5,
        goldMax: 10,
        skills: [],
        isDefending: false,
        isDead: false,
      },
    ],
    selectedTargetIndex: null,
    currentEnemyTurnIndex: 0,
    logs: [],
    selectedCommand: null,
    isDefending: false,
    ...overrides,
  };
}

export function createDialogueState(overrides: Partial<DialogueState> = {}): DialogueState {
  return {
    npcName: 'テストNPC',
    text: 'こんにちは！',
    choices: null,
    ...overrides,
  };
}

export function createShopState(overrides: Partial<ShopState> = {}): ShopState {
  return {
    isActive: true,
    shopName: 'テストショップ',
    items: [
      createShopItem({ item: { id: 'potion', name: 'やくそう', description: 'HPを30回復' }, price: 10 }),
      createShopItem({ item: { id: 'antidote', name: 'どくけし', description: '毒を治療' }, price: 8 }),
    ],
    ...overrides,
  };
}

export function createShopItem(overrides: Partial<ShopItem> = {}): ShopItem {
  return {
    item: { id: 'potion', name: 'やくそう', description: 'HPを30回復' },
    price: 10,
    stock: -1,
    ...overrides,
  };
}

export function createSaveSlot(overrides: Partial<SaveSlotInfo> = {}): SaveSlotInfo {
  return {
    slotId: 0,
    isEmpty: false,
    timestamp: Date.now(),
    mapName: 'はじまりの村',
    leaderName: 'engineer',
    leaderLevel: 5,
    ...overrides,
  };
}

export function createEmptySaveSlot(slotId: number): SaveSlotInfo {
  return {
    slotId,
    isEmpty: true,
    timestamp: null,
    mapName: null,
    leaderName: null,
    leaderLevel: null,
  };
}

export function createInventoryItem(overrides: Partial<InventoryItemState> = {}): InventoryItemState {
  return {
    item: {
      id: 'potion',
      name: 'やくそう',
      description: 'HPを30回復',
      type: 'heal',
    },
    quantity: 3,
    canUseInMenu: true,
    canUseInBattle: true,
    ...overrides,
  };
}

export function createEquipmentInventoryItem(overrides: Partial<InventoryItemState> = {}): InventoryItemState {
  return {
    item: {
      id: 'wooden_sword',
      name: '木の剣',
      description: '攻撃力+5',
      type: 'equipment',
      equipSlot: 'weapon',
    },
    quantity: 1,
    canUseInMenu: false,
    canUseInBattle: false,
    ...overrides,
  };
}

// ==================== モック ====================

export function createMockBattleAPI() {
  return {
    selectCommand: vi.fn(),
    useSkill: vi.fn(),
    useItem: vi.fn(),
    selectTarget: vi.fn(),
    cancel: vi.fn(),
    close: vi.fn(),
  };
}

export function createMockDialogueAPI() {
  return {
    selectChoice: vi.fn(),
    advance: vi.fn(),
    close: vi.fn(),
  };
}

export function createMockShopAPI() {
  return {
    buyItem: vi.fn().mockReturnValue(true),
    close: vi.fn(),
  };
}

export function createMockSaveAPI() {
  return {
    save: vi.fn().mockReturnValue(true),
    load: vi.fn().mockReturnValue(true),
    getSlots: vi.fn().mockReturnValue([]),
    hasData: vi.fn().mockReturnValue(false),
  };
}

export function createMockPartyAPI() {
  return {
    useFieldItem: vi.fn().mockReturnValue({ success: true, message: '回復した！' }),
    equipItem: vi.fn().mockReturnValue({ success: true, message: '装備した！' }),
    unequipItem: vi.fn().mockReturnValue({ success: true, message: '外した！' }),
    recruitMember: vi.fn().mockReturnValue(true),
  };
}

export function createMockExplorationAPI() {
  return {
    move: vi.fn(),
    reset: vi.fn(),
  };
}

// ==================== カスタムレンダー ====================

const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { renderWithProviders as render };
