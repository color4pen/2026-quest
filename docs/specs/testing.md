# テスト設計ドキュメント

## 概要

Vitest を使用したユニットテスト。全テストファイルはソースファイルと同じディレクトリに `*.test.ts` として配置（colocation パターン）。

- **フレームワーク**: Vitest v4
- **テスト数**: 200 テスト / 21 ファイル
- **実行時間**: 約 600ms

## テスト構成

### 3 フェーズ構成

依存関係の少ない順にテストを構築している。

| Phase | 対象 | テスト数 | モック |
|-------|------|---------|--------|
| 1: 純粋ロジック | CombatCalculator, Items, StatusEffects | 55 | `Math.random` のみ |
| 2: モデル+サブマネージャー | PartyMember, Enemy, Party, Inventory, GameMap, Player, Treasure, CameraManager, EncounterManager, InteractionHandler, MapManager | 99 | `Math.random` のみ |
| 3: エンジン統合 | BattleEngine, DialogueEngine, GameEngine, SaveManager | 46 | `Math.random`, `vi.useFakeTimers`, `localStorage` |

### ファイル一覧

```
src/
├── __test-helpers__/
│   └── factories.ts              # テストデータファクトリ
├── engine/
│   ├── BattleEngine.test.ts      # 9 tests
│   ├── CameraManager.test.ts     # 5 tests
│   ├── CombatCalculator.test.ts  # 12 tests
│   ├── DialogueEngine.test.ts    # 12 tests
│   ├── EncounterManager.test.ts  # 5 tests
│   ├── GameEngine.test.ts        # 12 tests
│   ├── InteractionHandler.test.ts # 5 tests
│   └── MapManager.test.ts        # 6 tests
├── models/
│   ├── Enemy.test.ts             # 7 tests
│   ├── GameMap.test.ts           # 12 tests
│   ├── Inventory.test.ts         # 12 tests
│   ├── Party.test.ts             # 14 tests
│   ├── PartyMember.test.ts       # 21 tests
│   ├── Player.test.ts            # 6 tests
│   ├── Treasure.test.ts          # 6 tests
│   ├── items/
│   │   ├── ConsumableItem.test.ts    # 14 tests
│   │   ├── EquipmentItem.test.ts     # 7 tests
│   │   └── ItemFactory.test.ts       # 12 tests
│   └── statusEffects/
│       ├── InfluenzaEffect.test.ts   # 3 tests
│       └── PoisonEffect.test.ts      # 7 tests
└── services/
    └── SaveManager.test.ts       # 13 tests
```

## テストの書き方

### 基本ルール

1. **シナリオベース**: `describe` でシナリオ（状況）、`it` でアクション→結果を日本語で記述
2. **AAA パターン**: Arrange（準備）→ Act（実行）→ Assert（検証）の順序
3. **1テスト1アサーション**: 原則として1つの振る舞いに対して1テスト
4. **実装依存を避ける**: public API のみをテスト、private メソッドは間接的に検証

### describe/it の命名規則

```typescript
describe('PartyMember', () => {
  describe('ダメージ処理', () => {
    it('10ダメージを受けると HP が 90 に減る', () => { ... });
    it('HP 以上のダメージを受けても HP は 0 未満にならない', () => { ... });
    it('HP が 0 になると isAlive が false になる', () => { ... });
  });
});
```

- `describe`: 対象クラス → シナリオ（日本語）
- `it`: 「〜すると〜になる」の形式

### ファクトリ関数

テストデータは `src/__test-helpers__/factories.ts` に集約。

```typescript
import { createTestMemberDef, createTestMapDef, createTestEnemyTemplate }
  from '../__test-helpers__/factories';

// デフォルト値で生成
const def = createTestMemberDef();

// 一部をオーバーライド
const tankDef = createTestMemberDef({
  baseStats: { hp: 200, maxHp: 200, mp: 10, maxMp: 10, attack: 8 },
});
```

提供されるファクトリ:

| 関数 | 戻り値 | 用途 |
|------|--------|------|
| `createTestMemberDef(overrides?)` | `PartyMemberDefinition` | パーティメンバー定義 |
| `createTestMapDef(overrides?)` | `MapDefinition` | マップ定義（10x10 grass） |
| `createTestEnemyTemplate(overrides?)` | `EnemyBattleConfig` | 敵テンプレート |

### モック戦略

#### Math.random の制御

乱数に依存する処理は `vi.spyOn(Math, 'random')` で制御。

```typescript
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

#### タイマー制御（BattleEngine）

BattleEngine の `scheduleAction()` は `setTimeout` を使用する。テストでは `vi.useFakeTimers()` で制御。

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// 全 pending タイマーを進める
vi.advanceTimersByTime(1000);
```

#### localStorage モック（SaveManager）

```typescript
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
```

## 設定

### vite.config.ts

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,        // describe/it/expect をグローバルに
    environment: 'node',  // DOM 不要（ロジック層のみ）
  },
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

### package.json scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## 注意事項

### ゲームデータとの依存

- **マップ ID**: `village`, `field`, `dungeon`（`INITIAL_MAP_ID = 'village'`）
- **village の playerStart**: `{ x: 5, y: 7 }`
- **初期インベントリ**: potion×3, bomb×2, calonal×10, tamiflu×10, antidote×3, wooden_sword×1, leather_armor×1, camera×1
- **初期ゴールド**: 100

初期インベントリに含まれるアイテムを「存在しないアイテム」としてテストに使わないこと。代わりに `elixir` 等のデフォルトで含まれないアイテムを使用する。

### Enemy の HP 計算

`Math.floor(baseHp * hpMultiplier)` で計算される。`hpMultiplier` が小さすぎると HP が 0 になり、生成時点で死亡状態になるため注意。

```
baseHp = ENEMY_BASE_STATS.hp(30) + playerLevel * 10
```

playerLevel=1 の場合 baseHp=40。`hpMultiplier: 0.1` で HP=4 が最小の安全値。

### 未実装の状態異常

`StatusEffectType` は `'poison' | 'influenza'` のみ。以下は未実装:
- RegenEffect, ParalysisEffect, DefenseUpEffect, AttackUpEffect

将来これらが実装された場合、対応するテストファイルを追加すること。
