import type { EnemyBattleConfig } from '../types/battle';

/**
 * 敵テンプレート定義
 * ランダムエンカウント・固定敵の生成に使用
 */
export const ENEMY_TEMPLATES: EnemyBattleConfig[] = [
  {
    name: 'スライム',
    image: '/assets/images/enemies/slime.png',
    aiType: 'random',
    hpMultiplier: 0.8,
    attackMultiplier: 0.7,
    xpMultiplier: 0.5,
    goldMultiplier: 0.5,
    poisonChance: 0.15,  // 15%の確率で毒
  },
  {
    name: 'バット',
    image: '/assets/images/enemies/bat.png',
    aiType: 'random',
    hpMultiplier: 0.6,
    attackMultiplier: 0.8,
    xpMultiplier: 0.6,
    goldMultiplier: 0.4,
  },
  {
    name: 'ゴブリン',
    image: '/assets/images/enemies/goblin.png',
    aiType: 'aggressive',
    hpMultiplier: 1.0,
    attackMultiplier: 1.0,
    xpMultiplier: 1.0,
    goldMultiplier: 1.0,
  },
  {
    name: 'コボルト',
    image: '/assets/images/enemies/kobold.png',
    aiType: 'defensive',
    hpMultiplier: 0.9,
    attackMultiplier: 0.9,
    xpMultiplier: 0.8,
    goldMultiplier: 1.2,
  },
  {
    name: 'ウルフ',
    image: '/assets/images/enemies/wolf.png',
    aiType: 'aggressive',
    hpMultiplier: 0.9,
    attackMultiplier: 1.3,
    xpMultiplier: 1.1,
    goldMultiplier: 0.8,
  },
  {
    name: 'スケルトン',
    image: '/assets/images/enemies/skeleton.png',
    aiType: 'random',
    hpMultiplier: 1.1,
    attackMultiplier: 1.0,
    xpMultiplier: 1.2,
    goldMultiplier: 1.0,
  },
  {
    name: 'ゾンビ',
    image: '/assets/images/enemies/zombie.png',
    aiType: 'defensive',
    hpMultiplier: 1.4,
    attackMultiplier: 0.8,
    xpMultiplier: 1.0,
    goldMultiplier: 0.6,
    poisonChance: 0.25,  // 25%の確率で毒
  },
  {
    name: 'オーク',
    image: '/assets/images/enemies/orc.png',
    aiType: 'aggressive',
    hpMultiplier: 1.5,
    attackMultiplier: 1.4,
    xpMultiplier: 1.5,
    goldMultiplier: 1.5,
  },
  // ボス
  {
    name: '洞窟の主',
    image: '/assets/images/enemies/cave_boss.jpg',
    aiType: 'aggressive',
    hpMultiplier: 3.0,
    attackMultiplier: 2.0,
    xpMultiplier: 5.0,
    goldMultiplier: 10.0,
    onDefeat: [
      { key: 'quest_forest', value: 2 },
    ],
  },
];

/**
 * 名前から敵テンプレートを取得
 */
export function getEnemyTemplateByName(name: string): EnemyBattleConfig | undefined {
  return ENEMY_TEMPLATES.find(t => t.name === name);
}
