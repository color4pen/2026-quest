# 2026年クエスト (2026 Quest)

React + TypeScript で実装された2DターンベースRPG。

## 概要

Unity風のアーキテクチャをReact + TypeScriptで再現したRPGゲームです。Claude Codeを使用して開発されました。

### 技術スタック

| カテゴリ | 技術 |
|----------|------|
| ビルドツール | Vite 5.0 |
| フレームワーク | React 18.2 |
| 言語 | TypeScript 5.0 (strict mode) |
| 描画 | Canvas 2D API |

### プロジェクト規模

- **コード行数:** 約8,900行
- **ファイル数:** 63ファイル
- **開発時間:** 約5時間（Claude Code使用）

## アーキテクチャ

### 全体構成

```
src/
├── components/          # React UIコンポーネント
│   ├── game/           # ゲームオブジェクト（GameObject, Transform, Renderer）
│   └── ui/             # 再利用可能UIコンポーネント
├── models/             # ゲームロジッククラス
│   ├── items/          # アイテムシステム
│   ├── statusEffects/  # ステータス効果システム
│   └── conditions/     # ドア通過条件
├── engine/             # コアエンジン
│   ├── GameEngine.ts   # メインゲームループ・状態管理
│   ├── BattleEngine.ts # ターン制バトルシステム
│   ├── DialogueEngine.ts
│   └── CombatCalculator.ts
├── types/              # TypeScript型定義
├── hooks/              # Reactカスタムフック
└── data/               # ゲームデータ定義
```

### 採用パターン

#### 1. Entity-Component-System (ECS) 風

Unity風のゲームオブジェクト構造を採用。

```
GameObject (基底クラス)
├── Transform - 位置・移動管理
└── Renderer  - 描画ロジック
```

#### 2. Observer パターン

```typescript
// GameEngineがPublisher、ReactコンポーネントがSubscriber
gameEngine.subscribe((state) => {
  // 状態変更時に通知
});
```

#### 3. Factory パターン

```typescript
// アイテム生成
const potion = ItemFactory.create('potion');

// ステータス効果生成
const poison = StatusEffectFactory.create('poison');
```

#### 4. MVC的な層分離

```
View層       - React UIコンポーネント
Controller層 - GameEngine, BattleEngine, DialogueEngine
Model層      - Player, Party, Enemy, NPC, Items
```

## 実装済み機能

### コアシステム

- [x] タイルベース2Dマップ移動
- [x] カメラ追従システム
- [x] 複数マップ・ワープポイント
- [x] 衝突判定

### バトルシステム

- [x] ターン制パーティバトル（最大4人 vs 最大3体）
- [x] コマンド選択（攻撃/スキル/アイテム/防御）
- [x] 敵AI（aggressive/defensive/random）
- [x] 経験値・レベルアップ
- [x] ステータス効果（毒、インフルエンザ）

### パーティシステム

- [x] 4人パーティ管理
- [x] キャラクタークラス（勇者/戦士/魔法使い/ヒーラー）
- [x] 装備システム（武器/防具/アクセサリ）
- [x] クラス別スキル

### アイテムシステム

- [x] 回復アイテム
- [x] ダメージアイテム
- [x] 状態異常治療アイテム
- [x] 装備品
- [x] 貴重品

### NPC・ショップ

- [x] ツリー型ダイアログシステム
- [x] 選択肢分岐
- [x] ショップ（売買）
- [x] 宿屋（HP/MP回復）

### UI

- [x] ステータス表示
- [x] バトルログ
- [x] ポーズメニュー
- [x] インベントリ管理
- [x] 装備変更画面

## 起動方法

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

## 操作方法

| キー | アクション |
|------|------------|
| 矢印キー / WASD | 移動 |
| Space / Enter | 決定・話しかける |
| ESC / M | ポーズメニュー |

## 実装品質

### 良い点

- TypeScript strict mode で型安全性を確保
- 責務の明確な分離（Model/View/Controller）
- 拡張性の高いFactory/Observer パターン
- Unity風の理解しやすいアーキテクチャ

### 改善の余地

- テストコードなし
- セーブ/ロード機能未実装
- パフォーマンス最適化の余地あり

## 今後の方向性

1. **プロダクション品質化** - テスト追加、セーブ機能、エラーハンドリング強化
2. **コンテンツ拡充** - マップ、敵、ストーリー、クエストシステム
3. **フレームワーク化** - 再利用可能なRPGエンジンとして切り出し
4. **モダン技術移行** - WebGL、サウンド、アニメーション強化

## 類似フレームワーク

このプロジェクトのアーキテクチャは以下に近い設計思想を持っています：

- **Unity** - GameObject + Transform + Renderer の直接的なモデル
- **Excalibur.js** - TypeScript製ECS風ゲームエンジン
- **Phaser 3** - JavaScript 2Dゲームフレームワーク

## ドキュメント

詳細な設計ドキュメントは `docs/specs/` フォルダを参照：

### コアシステム
- [ゲームエンジン](docs/specs/game-engine.md) — 全体オーケストレーター・移動・インタラクション・委譲
- [ゲームオブジェクトシステム](docs/specs/game-object-system.md) — GameObject/Transform/Renderer 基盤
- [バトルシステム](docs/specs/battle-system.md) — ターン制戦闘エンジン
- [戦闘計算システム](docs/specs/combat-calculator.md) — ダメージ・回復量の計算ロジック
- [パーティシステム](docs/specs/party-system.md) — Party/PartyMember/Inventory 管理
- [マップシステム](docs/specs/map-system.md) — マップ定義・ワープ・エンカウント・通行条件

### サブシステム
- [アイテムシステム](docs/specs/item-system.md) — アイテム定義・Factory・装備
- [ステータス効果システム](docs/specs/status-effect-system.md) — 毒・インフルエンザ等の状態異常
- [ダイアログシステム](docs/specs/dialogue-system.md) — NPC会話・選択肢・条件分岐
- [ゲーム状態管理](docs/specs/game-state-system.md) — クエストフラグ・進行度管理
- [セーブ/ロードシステム](docs/specs/save-system.md) — localStorage永続化・バージョン管理
- [値オブジェクト](docs/specs/value-objects.md) — HitPoints/ManaPoints/Gold/EquipmentStatBlock

### 表示・UI
- [描画システム](docs/specs/rendering-system.md) — Canvas 2D描画・カメラ・カリング
- [UIコンポーネント](docs/specs/ui-components.md) — React UI設計・useGameEngineフック

### データ定義
- [ゲームデータ定義](docs/specs/game-data.md) — キャラクター・スキル・アイテムID・初期設定

## ライセンス

MIT License
