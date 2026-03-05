# 設計レビュー: Enemy 生成ロジックの分離（EnemyFactory 導入）

- **日付**: 2026-03-06
- **対象**: `docs/changes/20260306-enemy-factory/design.md`
- **レビュアー**: ユーザー
- **結果**: 承認（修正後）

---

## 初回レビュー指摘事項

### 1. Enemy コンストラクタの新シグネチャに `stats` を分離するのは過剰（必須修正）

**問題**: 初回設計では以下のコンストラクタを提案していた:
```typescript
constructor(
  x: number, y: number,
  battleConfig: EnemyBattleConfig,
  stats: { maxHp: number; attack: number; xpReward: number; goldReward: number }
)
```

`battleConfig` と `stats` の両方を渡す必要があり冗長。また `EnemyFactory.create(stats)` を「テスト用」として設けるのは、テストの書き方を本番 API に漏らすことになる。

**解決**: コンストラクタは `(x, y, playerLevel, battleConfig)` のまま、`battleConfig` を必須化するだけに留めた。ステータス計算はコンストラクタに残し、ゴールドのランダム幅もゲームの挙動として Enemy が持つべき知識とした。

### 2. `EncounterManager.createRandomEnemies()` の敵数ランダムロジックの所在（推奨修正）

**問題**: `createFromCandidates` が複数体を返すかのように読める命名。

**解決**: JSDoc で「1体を生成する」ことを明記。敵数のループは呼び出し側（EncounterManager）が担当。

### 3. `onDefeat` ボスフラグの設計書への言及漏れ（推奨修正）

**問題**: `BattleCalculator` が `enemy.battleConfig.onDefeat` を参照しているが、影響範囲に記載がなかった。

**解決**: 「影響なしのファイル」セクションに `BattleCalculator` への影響なしを明記。

---

## 最終設計

- `EnemyFactory` の API を3メソッドにシンプル化:
  - `createFromTemplate()` - テンプレート指定
  - `createRandom()` - 全テンプレートからランダム
  - `createFromCandidates()` - 候補から1体生成
- `Enemy` コンストラクタは `battleConfig` 必須化のみ
- ステータス計算（レベルスケーリング、ゴールドランダム）は Enemy に残す

---

## 承認

設計レビュー指摘3点がすべて適切に反映され、LGTM となった。
