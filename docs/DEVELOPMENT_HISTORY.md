# 変更履歴 - 2026年クエスト

プロジェクト開始: 2026-01-08

---

## 2026-01-10

### UI/UX改善
- ゲームタイトル変更: 「ピクセルクエスト」→「2026年クエスト」
- Webページタイトル変更
- ゲーム画面の簡素化（タイトル表示・枠線・エフェクト削除）
- 背景色の統一

### アーキテクチャ改善
- `src/data/itemIds.ts` - アイテムID定数化（マジックストリング解消）
- `src/data/skills.ts` - スキル定義の一元化
- `src/data/gameConfig.ts` - ゲーム初期設定の統一
- 重複定義の削除（INITIAL_ITEMS, INITIAL_SKILLS）
- Party.tsでINITIAL_GOLDを使用

---

## 2026-01-09

### キャラクター変更
- 主人公名: 「アレックス」→「せきくん」
- 職業: 「勇者(hero)」→「エンジニア(engineer)」

### フラグ・状態管理システム
- GameStateManager実装（key-value型状態管理）
- STATE_KEYS定数定義
- NPC会話の条件分岐（ConditionalStartId）
- 長老NPCとクエスト会話実装

### バトル完了後の報酬システム
- ボス撃破時の状態変更（onDefeat）
- 洞窟ボス実装

### タイトル画面
- TitleScreen.tsx作成
- 「はじめから」「つづきから」ボタン
- セーブデータ有無による表示制御

### セーブ/ロード機能
- SaveManager実装
- 複数スロット対応
- SaveLoadModal共通化
- 宝箱状態の保存・復元バグ修正

### 装備システム
- EquipmentItem実装
- 武器・防具・装飾品スロット
- 装備による能力値変化
- メニューからの装備変更UI

### ダイアログシステム改善
- set_stateアクション追加
- give_itemアクション追加
- ダイアログ終了処理の修正

### バグ修正
- ダイアログが閉じない問題
- 宝箱リスポーン問題
- ゲームオーバー時タイトルに戻る

---

## 2026-01-08

### プロジェクト初期化
- HTMLベースのRPGゲームからReact化
- Vite + TypeScript環境構築

### コアシステム
- GameEngine（ゲームループ・状態管理）
- BattleEngine（コマンドバトルシステム）
- DialogueEngine（会話システム）

### オブジェクト指向アーキテクチャ
- GameObject基底クラス
- Transform（位置・移動）
- Renderer（描画）
- Unity風コンポーネントシステム

### マップシステム
- GameMap（タイル・衝突判定）
- 複数マップ対応（村・草原・洞窟・ワールドマップ）
- マップ間移動（Door/ワープポイント）
- エンカウントシステム（マップ別設定）

### バトルシステム
- コマンドバトル（攻撃・スキル・アイテム・防御・逃げる）
- 複数敵との戦闘
- 敵AIタイプ（normal, aggressive, defensive）
- 経験値・ゴールド・レベルアップ

### パーティシステム
- Party/PartyMemberクラス
- 最大4人パーティー
- 共有インベントリ・ゴールド
- クラス別スキル（戦士・魔法使い・僧侶）

### NPCシステム
- NPC基底クラス
- 種別: 村人・商人・宿屋
- 会話・ショップ・宿泊機能
- 画像表示対応

### アイテムシステム
- ItemFactory（アイテム生成）
- 種別: 回復・ダメージ・治療・貴重品・装備
- Inventory管理クラス

### 状態異常システム
- StatusEffectFactory
- 毒・インフルエンザ
- 戦闘中・フィールド効果

### 条件システム
- ConditionFactory
- PassCondition（通行条件）
- 状態異常による通行制限

### 宝箱システム
- Treasure GameObject
- 開封状態の永続化

### UIコンポーネント
- GameCanvas（ゲーム描画）
- PlayerStats（ステータス表示）
- GameInfo/MessageLog（メッセージログ）
- BattleModal（バトルUI）
- DialogueModal（会話UI）
- ShopModal（ショップUI）
- PauseMenu（メニュー画面）
- GameOverModal

### ポーズメニュー機能
- パーティー情報表示
- アイテム使用
- 装備変更
- セーブ/ロード
- タイトルへ戻る

### デバッグ機能
- URLパラメータ `?mode=debug` でエンカウント無効化

### 画像アセット対応
- キャラクター画像
- NPC画像
- 敵画像
- タイル画像（村・洞窟アイコン）

---

## ファイル構成

```
src/
├── components/          # UIコンポーネント
│   ├── game/           # ゲームオブジェクト描画
│   └── *.tsx           # React コンポーネント
├── data/               # データ定義
│   ├── gameConfig.ts   # ゲーム初期設定
│   ├── itemIds.ts      # アイテムID定数
│   ├── skills.ts       # スキル定義
│   ├── partyMembers.ts # パーティーメンバー定義
│   └── maps.ts         # マップ定義
├── engine/             # ゲームエンジン
│   ├── GameEngine.ts   # メインエンジン
│   ├── BattleEngine.ts # バトル処理
│   └── DialogueEngine.ts # 会話処理
├── hooks/              # React Hooks
│   └── useGameEngine.ts
├── models/             # ゲームオブジェクト
│   ├── items/          # アイテムクラス
│   ├── statusEffects/  # 状態異常
│   ├── conditions/     # 条件判定
│   ├── Party.ts
│   ├── PartyMember.ts
│   ├── Player.ts
│   ├── Enemy.ts
│   ├── NPC.ts
│   ├── Treasure.ts
│   └── GameMap.ts
├── services/           # サービス
│   └── SaveManager.ts
└── types/              # 型定義
    ├── battle.ts
    ├── party.ts
    ├── npc.ts
    ├── game.ts
    └── save.ts
```

---

## 統計

- 開発期間: 3日間（2026-01-08 〜 2026-01-10）
- ユーザーリクエスト: 約1,950件
- 主要修正ファイル:
  - GameEngine.ts: 167回
  - App.css: 60回
  - battle.ts: 57回
  - App.tsx: 57回
  - maps.ts: 51回
