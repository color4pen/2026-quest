import { EnemyBattleConfig } from '../types/game';
import { ENEMY_TEMPLATES, getEnemyTemplateByName } from '../data/enemyTemplates';
import { Enemy } from './Enemy';

/**
 * 敵生成ファクトリ
 * テンプレート選択のランダムロジックを担当
 */
export class EnemyFactory {
  /**
   * テンプレートとレベルから Enemy を生成
   */
  static createFromTemplate(
    x: number,
    y: number,
    template: EnemyBattleConfig,
    playerLevel: number
  ): Enemy {
    return new Enemy(x, y, playerLevel, template);
  }

  /**
   * 全テンプレートからランダムに1体生成
   */
  static createRandom(x: number, y: number, playerLevel: number): Enemy {
    const template = ENEMY_TEMPLATES[Math.floor(Math.random() * ENEMY_TEMPLATES.length)];
    return new Enemy(x, y, playerLevel, template);
  }

  /**
   * 候補リストからランダムに1体生成
   * 敵数のループは呼び出し側が担当
   */
  static createFromCandidates(
    x: number,
    y: number,
    candidateNames: string[],
    playerLevel: number
  ): Enemy {
    const name = candidateNames[Math.floor(Math.random() * candidateNames.length)];
    const template = getEnemyTemplateByName(name);

    if (!template) {
      // フォールバック: 見つからない場合はランダムに生成
      console.warn(`Enemy template not found: ${name}, using random template`);
      return this.createRandom(x, y, playerLevel);
    }

    return new Enemy(x, y, playerLevel, template);
  }
}
