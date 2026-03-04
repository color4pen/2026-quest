# PartyMember.ts 分割

## 概要

PartyMember.ts（506行）を責務ごとに分割し、可読性・保守性を向上させる。
現在、1つのクラスに戦闘・経験値・装備・状態異常の全機能が混在している。

## 現状分析

### PartyMember.ts（506行）の責務

| 責務 | 行数 | メソッド数 |
|-----|------|----------|
| 戦闘（ダメージ/回復/MP） | ~80行 | 12 |
| 経験値・レベル | ~30行 | 2 |
| 状態異常 | ~90行 | 8 |
| 装備 | ~90行 | 9 |
| 基本情報・getter | ~30行 | 10 |
| 状態復元・取得 | ~50行 | 2 |

### 問題点

1. **単一責任原則違反**: 4つの異なる責務が1クラスに集中
2. **テストの複雑化**: 装備テストでも戦闘の知識が必要
3. **変更影響範囲**: 状態異常の変更が全体に波及

## 設計方針

### 分割案：コンポジションパターン

PartyMember を薄いファサードとし、各責務を専用クラスに委譲する。

```
PartyMember (ファサード)
  ├── CombatStats (戦闘ステータス計算)
  ├── ExperienceManager (経験値・レベル管理)
  ├── EquipmentManager (装備管理) ← 既存の値オブジェクトと連携
  └── StatusEffectManager (状態異常管理)
```

### 新規クラス設計

#### 1. ExperienceManager（経験値・レベル管理）

```typescript
// src/models/components/ExperienceManager.ts
export class ExperienceManager {
  private _level: number;
  private _xp: number;
  private _xpToNext: number;
  private readonly levelUpBonus: LevelUpBonus;

  get level(): number;
  get xp(): number;
  get xpToNext(): number;

  gainXp(amount: number): LevelUpResult | null;
  restoreState(level: number, xp: number, xpToNext: number): void;
}
```

#### 2. StatusEffectManager（状態異常管理）

```typescript
// src/models/components/StatusEffectManager.ts
export class StatusEffectManager {
  private effects: StatusEffect[];

  add(type: StatusEffectType, duration?: number): boolean;
  remove(type: StatusEffectType): boolean;
  has(type: StatusEffectType): boolean;
  clear(): void;
  getAll(): readonly StatusEffect[];
  getInfos(): StatusEffectInfo[];
  processTurnEnd(target: StatusEffectTarget): TurnEndResult[];
}
```

#### 3. EquipmentManager（装備管理）

```typescript
// src/models/components/EquipmentManager.ts
export class EquipmentManager {
  private slots: EquipmentSlots;

  equip(item: EquipmentItem): EquipmentItem | null;
  unequip(slot: EquipmentSlot): EquipmentItem | null;
  getAt(slot: EquipmentSlot): EquipmentItem | null;
  getAll(): EquipmentSlots;
  getBonuses(): EquipmentStatBlock;
  getState(): EquipmentSlotState;
}
```

### PartyMember の変更

```typescript
export class PartyMember {
  // 基本情報
  public readonly id: string;
  public readonly name: string;

  // コンポーネント
  private readonly experience: ExperienceManager;
  private readonly equipment: EquipmentManager;
  private readonly statusEffects: StatusEffectManager;

  // HP/MP（値オブジェクト）
  private _hp: HitPoints;
  private _mp: ManaPoints;

  // 委譲メソッド（既存APIを維持）
  gainXp(amount: number): boolean {
    const result = this.experience.gainXp(amount);
    if (result) { this.applyLevelUp(result); }
    return result !== null;
  }
}
```

## 実装計画

- Step 1: ExperienceManager を抽出・テスト作成
- Step 2: StatusEffectManager を抽出・テスト作成
- Step 3: EquipmentManager を抽出・テスト作成
- Step 4: PartyMember をファサード化
- Step 5: 統合テスト確認

## 実施結果

| 指標 | Before | After |
|-----|--------|-------|
| PartyMember 行数 | 506 | 418 |
| 新規コンポーネント | - | 3クラス (266行) |
| 新規テスト | - | 30件 |
| 責務の明確性 | 低 | 高 |

### 抽出したクラス

| クラス | 行数 | テスト数 |
|--------|------|---------|
| ExperienceManager | 92 | 8 |
| StatusEffectManager | 94 | 13 |
| EquipmentManager | 80 | 9 |

## 承認

- [x] 設計レビュー完了
- [x] 実装完了
