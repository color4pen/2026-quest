import { SaveManager } from './SaveManager';
import { SAVE_SLOT_KEY_PREFIX, MAX_SAVE_SLOTS, SAVE_VERSION } from '../types/save';
import type { SaveData, SignedSaveData } from '../types/save';
import { sign } from './integrity';

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

  // 署名付きフォーマットでストレージに保存
  function storeSignedSaveData(slotId: number, saveData: SaveData): void {
    const payloadJson = JSON.stringify(saveData);
    const signedData: SignedSaveData = {
      payload: saveData,
      signature: sign(payloadJson),
    };
    storage[`${SAVE_SLOT_KEY_PREFIX}${slotId}`] = JSON.stringify(signedData);
  }

  describe('スロット管理', () => {
    it('空きスロットの getSaveSlots は isEmpty: true を返す', () => {
      const slots = SaveManager.getSaveSlots();

      expect(slots.length).toBe(MAX_SAVE_SLOTS);
      expect(slots.every(s => s.isEmpty)).toBe(true);
    });

    it('セーブ済みスロットは isEmpty: false でメタ情報を含む', () => {
      const saveData = createMinimalSaveData();
      storeSignedSaveData(0, saveData);

      const slots = SaveManager.getSaveSlots();

      expect(slots[0].isEmpty).toBe(false);
      expect(slots[0].timestamp).toBe(saveData.timestamp);
      expect(slots[0].mapName).toBeTruthy();
    });

    it('deleteSave でスロットが空になる', () => {
      storeSignedSaveData(0, createMinimalSaveData());

      expect(SaveManager.hasData(0)).toBe(true);
      SaveManager.deleteSave(0);
      expect(SaveManager.hasData(0)).toBe(false);
    });

    it('hasSaveData はいずれかのスロットにデータがあれば true', () => {
      expect(SaveManager.hasSaveData()).toBe(false);

      storeSignedSaveData(2, createMinimalSaveData());
      expect(SaveManager.hasSaveData()).toBe(true);
    });
  });

  describe('セーブ & ロードのラウンドトリップ', () => {
    it('セーブしたデータをロードすると同じ内容が復元される', () => {
      const original = createMinimalSaveData();
      storeSignedSaveData(0, original);

      const loaded = SaveManager.load(0);

      expect(loaded).not.toBeNull();
      expect(loaded!.currentMapId).toBe('village');
      expect(loaded!.playerPosition).toEqual({ x: 5, y: 5 });
    });

    it('パーティメンバーのHP/MP/レベルが保持される', () => {
      const original = createMinimalSaveData();
      storeSignedSaveData(0, original);

      const loaded = SaveManager.load(0);
      const member = loaded!.party.members[0];

      expect(member.hp).toBe(80);
      expect(member.mp).toBe(20);
      expect(member.level).toBe(3);
    });

    it('インベントリのアイテムと数量が保持される', () => {
      const original = createMinimalSaveData();
      storeSignedSaveData(0, original);

      const loaded = SaveManager.load(0);

      expect(loaded!.party.inventory).toEqual([
        { itemId: 'potion', quantity: 5 },
        { itemId: 'bomb', quantity: 2 },
      ]);
      expect(loaded!.party.gold).toBe(250);
    });

    it('ゲームフラグが保持される', () => {
      const original = createMinimalSaveData();
      storeSignedSaveData(0, original);

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
      storeSignedSaveData(0, oldData);

      const loaded = SaveManager.load(0);

      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(SAVE_VERSION);
    });
  });

  describe('署名検証', () => {
    it('署名が一致すればロードできる', () => {
      const saveData = createMinimalSaveData();
      storeSignedSaveData(0, saveData);

      const loaded = SaveManager.load(0);

      expect(loaded).not.toBeNull();
      expect(loaded!.currentMapId).toBe('village');
    });

    it('署名が改ざんされていたらロードが null を返す', () => {
      const saveData = createMinimalSaveData();
      const signedData: SignedSaveData = {
        payload: saveData,
        signature: 'tampered-signature',
      };
      storage[`${SAVE_SLOT_KEY_PREFIX}0`] = JSON.stringify(signedData);

      const loaded = SaveManager.load(0);

      expect(loaded).toBeNull();
    });

    it('payload が改ざんされていたらロードが null を返す', () => {
      const saveData = createMinimalSaveData();
      const payloadJson = JSON.stringify(saveData);
      const signedData: SignedSaveData = {
        payload: saveData,
        signature: sign(payloadJson),
      };
      // payloadのgoldを改ざん
      signedData.payload.party.gold = 999999;
      storage[`${SAVE_SLOT_KEY_PREFIX}0`] = JSON.stringify(signedData);

      const loaded = SaveManager.load(0);

      expect(loaded).toBeNull();
    });

    it('旧フォーマット（署名なし）は自動マイグレーションされる', () => {
      const saveData = createMinimalSaveData();
      // 旧フォーマット: 署名なしで直接保存
      storage[`${SAVE_SLOT_KEY_PREFIX}0`] = JSON.stringify(saveData);

      const loaded = SaveManager.load(0);

      expect(loaded).not.toBeNull();
      expect(loaded!.currentMapId).toBe('village');

      // ストレージが署名付きフォーマットに更新されていることを確認
      const storedRaw = storage[`${SAVE_SLOT_KEY_PREFIX}0`];
      const stored = JSON.parse(storedRaw);
      expect(stored).toHaveProperty('signature');
      expect(stored).toHaveProperty('payload');
    });

    it('改ざんされたスロットも getSaveSlots では表示される', () => {
      const saveData = createMinimalSaveData();
      const signedData: SignedSaveData = {
        payload: saveData,
        signature: 'tampered-signature',
      };
      storage[`${SAVE_SLOT_KEY_PREFIX}0`] = JSON.stringify(signedData);

      const slots = SaveManager.getSaveSlots();

      // 署名検証なしで表示される
      expect(slots[0].isEmpty).toBe(false);
      expect(slots[0].timestamp).toBe(saveData.timestamp);
    });
  });
});
