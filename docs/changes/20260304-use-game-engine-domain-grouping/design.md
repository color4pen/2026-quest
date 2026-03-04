# 設計書: useGameEngine ドメイングループ化

## 現状の問題

`useGameEngine` が 24 個の値をフラットに返しており、App.tsx での分割代入が長い。
ドメインの境界が曖昧で、どの関数がどの画面で使われるか読み取りにくい。

```typescript
const {
  state, gameObjects, resetGame,
  selectBattleCommand, useBattleSkill, useBattleItem,
  selectBattleTarget, cancelBattleSelection, closeBattle,
  selectDialogueChoice, closeDialogue, advanceDialogue,
  buyItem, closeShop,
  useFieldItem, equipItem, unequipItem,
  getSaveSlots, saveGame, loadGame, hasSaveData,
} = useGameEngine(isPaused);
```

## 方針

返り値をドメインごとにグループ化し、`useMemo` でオブジェクトを安定化する。

## ドメイン分類

| ドメイン | 値 | 消費コンポーネント |
|---------|----|----|
| `battle` | selectCommand, useSkill, useItem, selectTarget, cancel, close | BattleModal |
| `dialogue` | selectChoice, advance, close | DialogueModal |
| `shop` | buyItem, close | ShopModal |
| `exploration` | move, reset | App (キー入力) |
| `party` | useFieldItem, equipItem, unequipItem, recruitMember | PauseMenu 経由 |
| `save` | save, load, getSlots, hasData | PauseMenu, TitleScreen |
| (トップレベル) | state, gameObjects | 各所 |

## 変更後の useGameEngine 返り値

```typescript
interface UseGameEngineReturn {
  state: GameEngineState;
  gameObjects: GameObject[];

  battle: {
    selectCommand: (command: BattleCommand) => void;
    useSkill: (skillId: string) => void;
    useItem: (itemId: string) => void;
    selectTarget: (targetIndex: number) => void;
    cancel: () => void;
    close: () => void;
  };

  dialogue: {
    selectChoice: (choiceIndex: number) => void;
    advance: () => void;
    close: () => void;
  };

  shop: {
    buyItem: (shopItem: ShopItem) => boolean;
    close: () => void;
  };

  exploration: {
    move: (direction: Direction) => void;
    reset: () => void;
  };

  party: {
    useFieldItem: (...) => ...;
    equipItem: (...) => ...;
    unequipItem: (...) => ...;
    recruitMember: (...) => ...;
  };

  save: {
    save: (slotId: number) => boolean;
    load: (slotId: number) => boolean;
    getSlots: () => SaveSlotInfo[];
    hasData: () => boolean;
  };
}
```

## 変更ファイル

### 1. `src/hooks/useGameEngine.ts` — グループ化 + useMemo

各ドメインオブジェクトを `useMemo` で安定化:

```typescript
const battle = useMemo(() => ({
  selectCommand: (cmd: BattleCommand) => { engine.selectBattleCommand(cmd); syncState(); },
  useSkill: (id: string) => { engine.useBattleSkill(id); syncState(); },
  // ...
}), [engine]);
```

### 2. `src/App.tsx` — 分割代入の書き換え

```typescript
const { state, gameObjects, battle, dialogue, shop, exploration, party, save } = useGameEngine(isPaused);
```

子コンポーネントへの prop 渡しを更新:

```tsx
<BattleModal
  battle={state.battle}
  party={state.party}
  onSelectCommand={battle.selectCommand}
  onUseSkill={battle.useSkill}
  // ...
/>
```

### 3. 各モーダルコンポーネント — props 更新

| コンポーネント | 変更内容 |
|--------------|---------|
| `BattleModal.tsx` | `onSelectCommand` 等の prop 名は維持（App 側で紐付け変更） |
| `DialogueModal.tsx` | 同上 |
| `ShopModal.tsx` | 同上 |
| `PauseMenu.tsx` | 同上 |

**注: 子コンポーネントの props インターフェースは変えない。** App.tsx での紐付けだけ変更する。

例:
```tsx
// Before
<BattleModal onSelectCommand={selectBattleCommand} ... />
// After
<BattleModal onSelectCommand={battle.selectCommand} ... />
```

これにより子コンポーネントの変更は不要。

## 影響範囲

- `useGameEngine.ts` — 大幅変更（グループ化）
- `App.tsx` — 分割代入と prop 渡しの書き換え
- 子コンポーネント — **変更なし**（props インターフェース維持）

## テスト

既存テストは `GameEngine` クラスを直接テストしており、`useGameEngine` フック経由ではないため影響なし。

## 実装順序

1. `useGameEngine.ts` にドメイングループを追加（既存のフラットな返り値と併存）
2. `App.tsx` をグループ版に切り替え
3. フラットな返り値を削除
4. 型チェック + ビルド + 動作確認
