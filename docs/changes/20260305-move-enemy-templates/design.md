# ENEMY_TEMPLATES を data/ に移動

## 種別
- [x] リファクタリング

## 概要

`types/battle.ts` にある `ENEMY_TEMPLATES` 定数を `data/enemyTemplates.ts` に移動する。

**理由**: 他のマスターデータ（NPC、マップ、スキル、パーティメンバー）はすべて `data/` に配置されているが、敵データだけ `types/` に残っており一貫性がない。

## 現状分析

### 現在の構造
```
types/battle.ts（234行）
├── 型定義: BattleCommand, EnemyAIType, EnemyBattleConfig, SkillDefinition, ...
└── データ定数: ENEMY_TEMPLATES（90行、9種類の敵）
```

### data/ の既存ファイル
- `data/partyMembers.ts` — パーティメンバーデータ
- `data/npcDefinitions.ts` — NPCデータ
- `data/maps.ts` — マップデータ
- `data/skills.ts` — スキルデータ

### ENEMY_TEMPLATES の使用箇所
- `models/Enemy.ts` — 敵生成時にランダム選択
- `engine/EncounterManager.ts` — エンカウント時の敵生成
- `engine/MapManager.ts` — 固定敵の生成

## 設計方針

1. `data/enemyTemplates.ts` を新規作成
2. `ENEMY_TEMPLATES` 定数を移動
3. `EnemyBattleConfig` 型は `types/battle.ts` に残す（型とデータの分離）
4. 使用箇所のimportを更新

## 実装計画

- Step 1: `data/enemyTemplates.ts` を作成し、`ENEMY_TEMPLATES` を移動
- Step 2: `types/battle.ts` から `ENEMY_TEMPLATES` を削除
- Step 3: 使用箇所のimportを更新（3ファイル）
- Step 4: 型チェック・テスト

## 影響範囲

| ファイル | 変更内容 |
|---------|---------|
| `data/enemyTemplates.ts` | 新規作成 |
| `types/battle.ts` | `ENEMY_TEMPLATES` 削除 |
| `types/game.ts` | re-export削除 |
| `models/Enemy.ts` | import元変更 |
| `engine/EncounterManager.ts` | import元変更 |
| `engine/MapManager.ts` | import元変更 |

## 承認
- [ ] 設計レビュー完了
- [ ] 実装開始
