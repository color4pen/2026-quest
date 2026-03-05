import { EncounterConfig } from '../types/game';
import { Enemy, EnemyFactory } from '../models';

export class EncounterManager {
  /**
   * エンカウント判定
   * @returns 遭遇した敵の配列。エンカウントなしなら null
   */
  checkEncounter(encounter: EncounterConfig | undefined, leaderLevel: number): Enemy[] | null {
    if (this.isDebugMode()) return null;
    if (!encounter) return null;
    if (Math.random() > encounter.rate) return null;

    return this.createRandomEnemies(encounter.enemyIds, leaderLevel);
  }

  /**
   * デバッグモードかどうかをチェック
   */
  isDebugMode(): boolean {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'debug';
    }
    return false;
  }

  /**
   * ランダムな敵を複数生成（1〜3体）
   */
  private createRandomEnemies(enemyIds: string[], leaderLevel: number): Enemy[] {
    const count = Math.floor(Math.random() * 3) + 1;
    const enemies: Enemy[] = [];

    for (let i = 0; i < count; i++) {
      enemies.push(EnemyFactory.createFromCandidates(0, 0, enemyIds, leaderLevel));
    }

    return enemies;
  }
}
