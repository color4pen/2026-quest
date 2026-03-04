/**
 * SaveLoadHandler テスト
 */

import { describe, it, expect } from 'vitest';
import { validateSaveData, createMemberRestoreData } from './SaveLoadHandler';
import { SaveData, SavedMemberData } from '../types/save';

describe('validateSaveData', () => {
  const createValidSaveData = (): SaveData => ({
    version: 1,
    timestamp: Date.now(),
    currentMapId: 'test-map',
    playerPosition: { x: 5, y: 5 },
    treasureStates: {},
    party: {
      members: [{
        definitionId: 'engineer',
        hp: 100,
        mp: 50,
        level: 1,
        xp: 0,
        xpToNext: 100,
        baseMaxHp: 100,
        baseMaxMp: 50,
        baseAttack: 10,
        baseDefense: 5,
        statusEffects: [],
        equipment: { weapon: null, armor: null, accessory: null },
      }],
      gold: 100,
      inventory: [],
    },
    gameState: {},
  });

  it('有効なセーブデータを検証できる', () => {
    const data = createValidSaveData();
    const result = validateSaveData(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('currentMapIdが空の場合エラー', () => {
    const data = createValidSaveData();
    data.currentMapId = '';
    const result = validateSaveData(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('currentMapId is missing');
  });

  it('playerPositionが無効な場合エラー', () => {
    const data = createValidSaveData();
    // @ts-expect-error testing invalid data
    data.playerPosition = { x: 'invalid', y: 5 };
    const result = validateSaveData(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('playerPosition is invalid');
  });

  it('partyがない場合エラー', () => {
    const data = createValidSaveData();
    // @ts-expect-error testing invalid data
    data.party = null;
    const result = validateSaveData(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('party data is missing');
  });

  it('party.membersが空の場合エラー', () => {
    const data = createValidSaveData();
    data.party.members = [];
    const result = validateSaveData(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('party.members is empty');
  });

  it('party.goldが負の場合エラー', () => {
    const data = createValidSaveData();
    data.party.gold = -100;
    const result = validateSaveData(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('party.gold is invalid');
  });

  it('party.inventoryが配列でない場合エラー', () => {
    const data = createValidSaveData();
    // @ts-expect-error testing invalid data
    data.party.inventory = 'invalid';
    const result = validateSaveData(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('party.inventory is not an array');
  });

  it('複数のエラーを検出できる', () => {
    const data = createValidSaveData();
    data.currentMapId = '';
    data.party.gold = -100;
    const result = validateSaveData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('createMemberRestoreData', () => {
  const createValidMemberData = (): SavedMemberData => ({
    definitionId: 'engineer',
    hp: 80,
    mp: 30,
    level: 5,
    xp: 450,
    xpToNext: 550,
    baseMaxHp: 120,
    baseMaxMp: 60,
    baseAttack: 15,
    baseDefense: 10,
    statusEffects: [{ type: 'poison', remainingTurns: 3 }],
    equipment: {
      weapon: 'iron-sword',
      armor: 'leather-armor',
      accessory: null,
    },
  });

  it('有効なメンバーデータを復元データに変換できる', () => {
    const memberData = createValidMemberData();
    const result = createMemberRestoreData(memberData);

    expect(result).not.toBeNull();
    expect(result!.definitionId).toBe('engineer');
    expect(result!.hp).toBe(80);
    expect(result!.mp).toBe(30);
    expect(result!.level).toBe(5);
    expect(result!.xp).toBe(450);
    expect(result!.xpToNext).toBe(550);
    expect(result!.baseMaxHp).toBe(120);
    expect(result!.baseMaxMp).toBe(60);
    expect(result!.baseAttack).toBe(15);
    expect(result!.baseDefense).toBe(10);
  });

  it('状態異常を正しく変換できる', () => {
    const memberData = createValidMemberData();
    const result = createMemberRestoreData(memberData);

    expect(result).not.toBeNull();
    expect(result!.statusEffects).toHaveLength(1);
    expect(result!.statusEffects[0].type).toBe('poison');
    expect(result!.statusEffects[0].remainingTurns).toBe(3);
  });

  it('装備を正しく変換できる', () => {
    const memberData = createValidMemberData();
    const result = createMemberRestoreData(memberData);

    expect(result).not.toBeNull();
    expect(result!.equipment.weapon).toBe('iron-sword');
    expect(result!.equipment.armor).toBe('leather-armor');
    expect(result!.equipment.accessory).toBeNull();
  });

  it('存在しないdefinitionIdの場合nullを返す', () => {
    const memberData = createValidMemberData();
    memberData.definitionId = 'nonexistent-member';
    const result = createMemberRestoreData(memberData);

    expect(result).toBeNull();
  });

  it('状態異常がない場合も正しく処理できる', () => {
    const memberData = createValidMemberData();
    memberData.statusEffects = [];
    const result = createMemberRestoreData(memberData);

    expect(result).not.toBeNull();
    expect(result!.statusEffects).toHaveLength(0);
  });

  it('装備がすべてnullの場合も正しく処理できる', () => {
    const memberData = createValidMemberData();
    memberData.equipment = { weapon: null, armor: null, accessory: null };
    const result = createMemberRestoreData(memberData);

    expect(result).not.toBeNull();
    expect(result!.equipment.weapon).toBeNull();
    expect(result!.equipment.armor).toBeNull();
    expect(result!.equipment.accessory).toBeNull();
  });
});
