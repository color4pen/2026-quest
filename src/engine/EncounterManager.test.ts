import { EncounterManager } from './EncounterManager';

describe('EncounterManager', () => {
  const manager = new EncounterManager();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('エンカウント判定', () => {
    it('エンカウント率100%のマップでは必ず敵が出現する', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const enemies = manager.checkEncounter({ rate: 1.0, enemyIds: ['スライム'] }, 1);
      expect(enemies).not.toBeNull();
      expect(enemies!.length).toBeGreaterThan(0);
    });

    it('エンカウント率0%のマップでは敵が出現しない', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const enemies = manager.checkEncounter({ rate: 0, enemyIds: ['スライム'] }, 1);
      expect(enemies).toBeNull();
    });

    it('エンカウント設定のないマップでは null が返る', () => {
      const enemies = manager.checkEncounter(undefined, 1);
      expect(enemies).toBeNull();
    });

    it('乱数がエンカウント率を超えると敵が出現しない', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9);
      const enemies = manager.checkEncounter({ rate: 0.5, enemyIds: ['スライム'] }, 1);
      expect(enemies).toBeNull();
    });
  });

  describe('デバッグモード', () => {
    it('通常環境（window.location なし）ではデバッグモードではない', () => {
      // node環境では window.location が存在しない場合がある
      expect(manager.isDebugMode()).toBe(false);
    });
  });
});
