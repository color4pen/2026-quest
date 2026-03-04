import { SaveManager } from './SaveManager';
import { SAVE_SLOT_KEY_PREFIX, MAX_SAVE_SLOTS, SAVE_VERSION } from '../types/save';
import type { SaveData } from '../types/save';

describe('SaveManager', () => {
  // localStorage モック
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function createMinimalSaveData(overrides?: Partial<SaveData>): SaveData {
    return {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      currentMapId: 'village',
      playerPosition: { x: 5, y: 5 },
      treasureStates: {},
      party: {
        members: [
          {
            definitionId: 'engineer',
            hp: 80,
            mp: 20,
            level: 3,
            xp: 150,
            xpToNext: 300,
            baseMaxHp: 100,
            baseMaxMp: 30,
            baseAttack: 15,
            baseDefense: 5,
            statusEffects: [],
            equipment: { weapon: null, armor: null, accessory: null },
          },
        ],
        gold: 250,
        inventory: [
          { itemId: 'potion', quantity: 5 },
          { itemId: 'bomb', quantity: 2 },
        ],
      },
      gameState: { quest_forest: 1 },
      ...overrides,
    };
  }

  describe('スロット管理', () => {
    it('空きスロットの getSaveSlots は isEmpty: true を返す', () => {
      const slots = SaveManager.getSaveSlots();

      expect(slots.length).toBe(MAX_SAVE_SLOTS);
      expect(slots.every(s => s.isEmpty)).toBe(true);
    });

    it('セーブ済みスロットは isEmpty: false でメタ情報を含む', () => {
      const saveData = createMinimalSaveData();
      storage[`${SAVE_SLOT_KEY_PREFIX}0`] = JSON.stringify(saveData);

      const slots = SaveManager.getSaveSlots();

      expect(slots[0].isEmpty).toBe(false);
      expect(slots[0].timestamp).toBe(saveData.timestamp);
      expect(slots[0].mapName).toBeTruthy();
    });

    it('deleteSave でスロットが空になる', () => {
      storage[`${SAVE_SLOT_KEY_PREFIX}0`] = JSON.stringify(createMinimalSaveData());

      expect(SaveManager.hasData(0)).toBe(true);
      SaveManager.deleteSave(0);
      expect(SaveManager.hasData(0)).toBe(false);
    });

    it('hasSaveData はいずれかのスロットにデータがあれば true', () => {
      expect(SaveManager.hasSaveData()).toBe(false);

      storage[`${SAVE_SLOT_KEY_PREFIX}2`] = JSON.stringify(createMinimalSaveData());
      expect(SaveManager.hasSaveData()).toBe(true);
    });
  });

  describe('セーブ & ロードのラウンドトリップ', () => {
    it('セーブしたデータをロードすると同じ内容が復元される', () => {
      const original = createMinimalSaveData();
      storage[`${SAVE_SLOT_KEY_PREFIX}0`] = JSON.stringify(original);

      const loaded = SaveManager.load(0);

      expect(loaded).not.toBeNull();
      expect(loaded!.currentMapId).toBe('village');
      expect(loaded!.playerPosition).toEqual({ x: 5, y: 5 });
    });

    it('パーティメンバーのHP/MP/レベルが保持される', () => {
      const original = createMinimalSaveData();
      storage[`${SAVE_SLOT_KEY_PREFIX}0`] = JSON.stringify(original);

      const loaded = SaveManager.load(0);
      const member = loaded!.party.members[0];

      expect(member.hp).toBe(80);
      expect(member.mp).toBe(20);
      expect(member.level).toBe(3);
    });

    it('インベントリのアイテムと数量が保持される', () => {
      const original = createMinimalSaveData();
      storage[`${SAVE_SLOT_KEY_PREFIX}0`] = JSON.stringify(original);

      const loaded = SaveManager.load(0);

      expect(loaded!.party.inventory).toEqual([
        { itemId: 'potion', quantity: 5 },
        { itemId: 'bomb', quantity: 2 },
      ]);
      expect(loaded!.party.gold).toBe(250);
    });

    it('ゲームフラグが保持される', () => {
      const original = createMinimalSaveData();
      storage[`${SAVE_SLOT_KEY_PREFIX}0`] = JSON.stringify(original);

      const loaded = SaveManager.load(0);

      expect(loaded!.gameState).toEqual({ quest_forest: 1 });
    });
  });

  describe('異常系', () => {
    it('範囲外のスロットIDではロードが null を返す', () => {
      expect(SaveManager.load(-1)).toBeNull();
      expect(SaveManager.load(MAX_SAVE_SLOTS)).toBeNull();
    });

    it('範囲外のスロットIDでは deleteSave が false を返す', () => {
      expect(SaveManager.deleteSave(-1)).toBe(false);
      expect(SaveManager.deleteSave(MAX_SAVE_SLOTS)).toBe(false);
    });

    it('壊れた JSON データではロードが null を返る', () => {
      storage[`${SAVE_SLOT_KEY_PREFIX}0`] = '{invalid json!!!';

      const loaded = SaveManager.load(0);

      expect(loaded).toBeNull();
    });

    it('壊れたデータのスロットは getSaveSlots で isEmpty: true になる', () => {
      storage[`${SAVE_SLOT_KEY_PREFIX}0`] = '{invalid';

      const slots = SaveManager.getSaveSlots();

      expect(slots[0].isEmpty).toBe(true);
    });
  });

  describe('バージョン移行', () => {
    it('異なるバージョンのデータはマイグレーションされる', () => {
      const oldData = createMinimalSaveData({ version: 0 });
      storage[`${SAVE_SLOT_KEY_PREFIX}0`] = JSON.stringify(oldData);

      const loaded = SaveManager.load(0);

      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(SAVE_VERSION);
    });
  });
});
