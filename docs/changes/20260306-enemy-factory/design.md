# Enemy 生成ロジックの分離（EnemyFactory 導入）

## 種別
- [x] リファクタリング

## 概要
Enemy クラスのコンストラクタ内に混在しているテンプレートのランダム選択ロジックを EnemyFactory に分離し、責務を明確化する。

### 問題点
現在の `Enemy` コンストラクタ：
```typescript
constructor(x: number, y: number, playerLevel: number, battleConfig?: EnemyBattleConfig) {
  // テンプレート未指定時にランダム選択（エンティティの責務外）
  this.battleConfig = battleConfig ??
    ENEMY_TEMPLATES[Math.floor(Math.random() * ENEMY_TEMPLATES.length)];
  // ...
}
```

- エンティティがテンプレート選択のランダムロジックを持つのは DDD 的に不適切
- テスト時に `vi.spyOn(Math, 'random')` でモックが必要
- `Enemy.spawnEnemies()` も同様にエンティティに生成ロジックが混在

### 分離の範囲
- **分離対象**: テンプレート選択のランダム性
- **残す対象**: ステータス計算（レベルスケーリング、ゴールドのランダム幅）
  - ゴールドのランダム幅はゲームの挙動として Enemy が持つべき知識

## 現状分析

### Enemy 生成箇所
| ファイル | 用途 | テンプレート指定 |
|---------|------|-----------------|
| `EncounterManager.ts:39` | ランダムエンカウント | 名前から検索 |
| `MapManager.ts:146` | 固定敵配置 | 名前から検索 |
| `Enemy.ts:249` | `spawnEnemies()` | なし（ランダム） |
| テストファイル | テスト | `createTestEnemyTemplate()` で明示 |

### 問題箇所の詳細
1. **テンプレート未指定時のランダム選択** - コンストラクタ行52-53
2. **`spawnEnemies()` 静的メソッド** - 行221-254（未使用だが残存）

## 設計方針

### 新規作成
- `src/models/EnemyFactory.ts` - テンプレート選択を担当するファクトリクラス

### EnemyFactory の責務
```typescript
export class EnemyFactory {
  /**
   * テンプレートとレベルから Enemy を生成
   * （薄いラッパー、明示的なテンプレート指定用）
   */
  static createFromTemplate(
    x: number,
    y: number,
    template: EnemyBattleConfig,
    playerLevel: number
  ): Enemy;

  /**
   * 全テンプレートからランダムに1体生成
   */
  static createRandom(x: number, y: number, playerLevel: number): Enemy;

  /**
   * 候補リストからランダムに1体生成
   * （敵数のループは呼び出し側が担当）
   */
  static createFromCandidates(
    x: number,
    y: number,
    candidateNames: string[],
    playerLevel: number
  ): Enemy;
}
```

### Enemy クラスの変更
```typescript
// Before: テンプレート省略可（ランダム選択）
constructor(x: number, y: number, playerLevel: number, battleConfig?: EnemyBattleConfig)

// After: テンプレート必須（ランダム選択を除去）
constructor(x: number, y: number, playerLevel: number, battleConfig: EnemyBattleConfig)
```

- ステータス計算（レベルスケーリング、ゴールドランダム）はコンストラクタに残す
- `spawnEnemies()` は未使用のため削除

### 削除
- `Enemy.spawnEnemies()` - 未使用のため削除

## 実装計画

### Step 1: EnemyFactory 作成
- `src/models/EnemyFactory.ts` を新規作成
- テスト `EnemyFactory.test.ts` を追加

### Step 2: Enemy コンストラクタ変更
- `battleConfig` を必須パラメータに変更
- `spawnEnemies()` を削除
- `ENEMY_TEMPLATES` のインポートを削除

### Step 3: 利用箇所の更新
- `EncounterManager.ts` - `EnemyFactory.createFromCandidates()` を使用
- `MapManager.ts` - `EnemyFactory.createFromTemplate()` を使用

### Step 4: テスト更新
- テストは既存の `new Enemy(x, y, level, template)` 形式のまま
- `vi.spyOn(Math, 'random')` はゴールド計算用に一部残る

## 影響範囲

### 変更されるファイル
- `src/models/Enemy.ts` - `battleConfig` 必須化、`spawnEnemies()` 削除
- `src/models/EnemyFactory.ts` - 新規
- `src/models/index.ts` - EnemyFactory エクスポート追加
- `src/engine/EncounterManager.ts` - Factory 使用に変更
- `src/engine/MapManager.ts` - Factory 使用に変更（変更なし、既にテンプレート渡し）

### 影響なしのファイル
- `src/engine/calculators/BattleCalculator.ts` - `enemy.battleConfig.onDefeat` 参照は変わらない
- テストファイル - 既に `createTestEnemyTemplate()` でテンプレート明示済み

### テストへの影響
- `EncounterManager.test.ts` - Factory 経由に更新
- 他のテストは `new Enemy(x, y, level, template)` 形式のまま動作

## 承認
- [ ] 設計レビュー完了
- [ ] 実装開始
