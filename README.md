# 2026年クエスト (2026 Quest)

React + TypeScript で実装された2DターンベースRPG。

## 概要

ドラクエ風のクラシックRPGをReact + TypeScriptで実装したプロジェクトです。Claude Codeを使用して開発されました。

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| ビルドツール | Vite |
| フレームワーク | React |
| 言語 | TypeScript (strict mode) |
| テスト | Vitest |
| 描画 | Canvas 2D API |

## アーキテクチャ

```
src/
├── components/          # React UIコンポーネント
│   ├── game/           # ゲームオブジェクト（GameObject, Transform, Renderer）
│   ├── ui/             # 再利用可能UIコンポーネント
│   └── pause/          # ポーズメニュー
├── models/             # ゲームロジッククラス
│   ├── items/          # アイテムシステム（Factory Pattern）
│   ├── statusEffects/  # ステータス効果システム
│   └── conditions/     # ドア通過条件
├── engine/             # コアエンジン
│   ├── GameEngine.ts   # メインゲームループ・状態管理
│   ├── BattleEngine.ts # ターン制バトルシステム
│   ├── DialogueEngine.ts
│   └── calculators/    # 純粋計算関数
├── types/              # TypeScript型定義
├── hooks/              # Reactカスタムフック
├── services/           # 永続化等のサービス
└── data/               # ゲームデータ定義
```

### 採用パターン

- **Observer Pattern** - GameEngine → React コンポーネント間の状態同期
- **Factory Pattern** - アイテム・ステータス効果の生成
- **Command Pattern** - 純粋計算関数によるビジネスロジック分離
- **MVC的な層分離** - Model / View / Controller の責務分離

## 実装済み機能

### コアシステム
- タイルベース2Dマップ移動
- カメラ追従システム
- 複数マップ・ワープポイント
- セーブ/ロード（localStorage）

### バトルシステム
- ターン制パーティバトル（最大4人 vs 最大3体）
- コマンド選択（攻撃/スキル/アイテム/防御）
- 敵AI（aggressive/defensive/random）
- 経験値・レベルアップ
- ステータス効果（毒、インフルエンザ等）

### パーティシステム
- 4人パーティ管理
- キャラクタークラス（勇者/戦士/魔法使い/ヒーラー）
- 装備システム（武器/防具/アクセサリ）

### NPC・ショップ
- ツリー型ダイアログシステム
- 選択肢分岐・条件分岐
- ショップ（売買）
- 宿屋（HP/MP回復）

## 起動方法

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# テスト実行
npm test

# ビルド
npm run build
```

## 操作方法

| キー | アクション |
|------|------------|
| 矢印キー / WASD | 移動 |
| Space / Enter | 決定・話しかける |
| ESC / M | ポーズメニュー |

## 拡張方法

### アイテム追加
`src/models/items/ItemFactory.ts` にアイテム定義を追加

### 状態異常追加
`src/models/statusEffects/` に `BaseStatusEffect` を継承したクラスを作成

### マップ追加
`src/data/maps.ts` にマップ定義を追加

### NPC・会話追加
`src/data/npcDefinitions.ts` にNPC定義を追加

## ドキュメント

詳細な設計ドキュメントは `docs/specs/` フォルダを参照してください。

## ライセンス

MIT License
