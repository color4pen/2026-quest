import type { PartyMemberTemplate } from '../types/party';
import type { MapDefinition, EnemyBattleConfig, TileType } from '../types/game';

export function createTestMemberDef(
  overrides?: Partial<PartyMemberTemplate>
): PartyMemberTemplate {
  return {
    id: 'test-member',
    name: 'テスト勇者',
    class: 'warrior',
    baseStats: { hp: 100, maxHp: 100, mp: 30, maxMp: 30, attack: 15 },
    skills: [
      { id: 'slash', name: '斬撃', description: '強力な一撃', mpCost: 5, power: 1.5, type: 'attack', target: 'enemy' },
      { id: 'heal', name: 'ヒール', description: 'HPを回復', mpCost: 8, power: 0, type: 'heal', target: 'self' },
    ],
    levelUpBonus: { hp: 20, mp: 10, attack: 5 },
    ...overrides,
  };
}

export function createTestMapDef(
  overrides?: Partial<MapDefinition>
): MapDefinition {
  const tiles: TileType[][] = [];
  for (let y = 0; y < 10; y++) {
    tiles.push(Array(10).fill('grass') as TileType[]);
  }
  return {
    id: 'test-map',
    name: 'テストマップ',
    tiles,
    playerStart: { x: 5, y: 5 },
    ...overrides,
  };
}

export function createTestEnemyTemplate(
  overrides?: Partial<EnemyBattleConfig>
): EnemyBattleConfig {
  return {
    name: 'テストスライム',
    aiType: 'random',
    hpMultiplier: 1.0,
    attackMultiplier: 1.0,
    xpMultiplier: 1.0,
    goldMultiplier: 1.0,
    ...overrides,
  };
}
