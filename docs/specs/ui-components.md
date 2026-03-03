# UIコンポーネント設計ドキュメント

## 概要

React コンポーネントによるゲームUI。GameEngine の状態を `useGameEngine` フック経由で購読し、モーダル・メニュー・ステータスバー等を表示する。全てのゲームロジックは Engine/Model 側にあり、UI は表示とユーザー入力の橋渡しのみを担当。

## アプリケーション構造

### GamePhase

```typescript
type GamePhase = 'title' | 'playing';
```

### App.tsx の構成

```
App
├── TitleScreen              （gamePhase === 'title'）
│   └── SaveLoadModal        （つづきから）
│
└── ゲーム画面               （gamePhase === 'playing'）
    ├── PlayerStats          （左パネル）
    ├── GameCanvas           （中央パネル）
    ├── GameInfo             （右パネル）
    ├── BattleModal          （戦闘中）
    ├── DialogueModal        （会話中）
    ├── ShopModal            （ショップ中）
    ├── GameOverModal        （ゲームオーバー）
    └── PauseMenu            （ESC/Mキー）
```

### キー操作

| キー | 動作 | 条件 |
|------|------|------|
| Arrow / WASD | プレイヤー移動 | バトル・会話・ショップ・ポーズ中以外 |
| ESC / M | ポーズメニュー開閉 | タイトル・バトル・会話・ショップ・ゲームオーバー中以外 |

## useGameEngine フック

GameEngine のシングルトンを管理し、状態購読と操作メソッドを提供する。

```typescript
function useGameEngine(isPaused: boolean) {
  // GameEngine を useRef で保持（再生成防止）
  const engineRef = useRef<GameEngine | null>(null);

  // 状態購読
  const [state, setState] = useState<GameEngineState>(...);
  useEffect(() => engine.subscribe(setState), [engine]);

  // GameObjects（useMemo）
  const gameObjects = useMemo(() => engine.getGameObjects(), [engine, state]);

  // キーボードイベント（移動）
  useEffect(() => { ... }, [move, state.battle, state.dialogue, state.shop, isPaused]);

  return {
    state, gameObjects,
    move, resetGame,
    // バトル操作
    selectBattleCommand, useBattleSkill, useBattleItem,
    selectBattleTarget, cancelBattleSelection, closeBattle,
    // 会話操作
    selectDialogueChoice, closeDialogue, advanceDialogue,
    // ショップ操作
    buyItem, closeShop,
    // フィールド操作
    useFieldItem, recruitMember, equipItem, unequipItem,
    // セーブ/ロード
    getSaveSlots, saveGame, loadGame, hasSaveData,
    engine,
  };
}
```

## コンポーネント一覧

### TitleScreen

タイトル画面。「はじめから」「つづきから」ボタン。セーブデータがない場合は「つづきから」を非表示。

### GameCanvas

Canvas 2D 描画コンポーネント。マップタイル → 草地装飾 → GameObjects の順に描画。

### PlayerStats

左パネル。パーティーメンバーのHP/MP バー・レベル・状態異常バッジ・所持金・マップ名を表示。

### GameInfo / MessageLog

右パネル。ゲーム内メッセージログを表示。MessageType（normal/combat/loot/level-up）で色分け。

### BattleModal

バトルUI。フェーズに応じてコマンド選択・スキル選択・アイテム選択・ターゲット選択を切り替え表示。バトルログ・敵画像・パーティーメンバーカードを含む。

### DialogueModal

会話UI。NPC名・セリフ・選択肢ボタン・NPC画像（あれば）を表示。選択肢がない場合は「次へ」ボタン。

### ShopModal

ショップUI。アイテム一覧・価格・在庫・所持金を表示。購入ボタン。

### PauseMenu

ポーズメニュー。複数サブメニューを持つ。

| サブメニュー | 機能 |
|-------------|------|
| アイテム | アイテム使用（対象メンバー選択） |
| そうび | 装備着脱（スロット選択 → アイテム選択） |
| つよさ | メンバー詳細ステータス・状態異常表示 |
| セーブ | SaveLoadModal（セーブモード） |
| ロード | SaveLoadModal（ロードモード） |
| タイトルに戻る | 確認ダイアログ → タイトル画面へ |

PauseMenu 内の setTimeout は `useRef` で管理し、アンマウント時にクリーンアップ。

### SaveLoadModal

セーブ/ロード共用モーダル。5スロットの情報（マップ名・リーダー名・レベル・日時）を表示。

### GameOverModal

ゲームオーバー画面。「タイトルに戻る」ボタン。

## 共通UIコンポーネント（ui/）

| コンポーネント | 役割 |
|--------------|------|
| `Button` | 汎用ボタン |
| `Modal` | モーダルラッパー |
| `StatusBar` | HP/MP バー |
| `MemberCard` | パーティーメンバーカード（バトル・メニュー用） |

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/App.tsx` | アプリケーションルート |
| `src/hooks/useGameEngine.ts` | GameEngine 統合フック |
| `src/components/GameCanvas.tsx` | Canvas 描画 |
| `src/components/BattleModal.tsx` | バトルUI |
| `src/components/DialogueModal.tsx` | 会話UI |
| `src/components/ShopModal.tsx` | ショップUI |
| `src/components/PauseMenu.tsx` | ポーズメニュー |
| `src/components/SaveLoadModal.tsx` | セーブ/ロードUI |
| `src/components/TitleScreen.tsx` | タイトル画面 |
| `src/components/GameOverModal.tsx` | ゲームオーバー |
| `src/components/PlayerStats.tsx` | ステータス表示 |
| `src/components/GameInfo.tsx` | メッセージログ |
| `src/components/ui/*.tsx` | 共通UIパーツ |
