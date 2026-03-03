# 短期対応 設計書

- **タスク**: 001-20260303-code-review
- **スコープ**: レビュー項目 2-2, 2-3, 2-4, 4, 3-7（短期対応5件）

---

## S-1. PartyMember の public フィールドを private + getter に変更 (レビュー 2-2)

### 対象ファイル

- `src/models/PartyMember.ts`

### 現状

```typescript
public level: number;
public xp: number;
public xpToNext: number;
public attack: number;
public isDefending: boolean = false;
public baseDefense: number = 0;
public skills: SkillDefinition[];
```

外部から `member.level = 100` 等の直接代入が可能。

### 外部参照の調査結果

| フィールド | 外部からの読み取り | 外部からの書き込み |
|---|---|---|
| `level` | `SaveManager.ts:193` | なし（`restoreState()` 経由のみ） |
| `xp` | `SaveManager.ts:194` | なし（`restoreState()` 経由のみ） |
| `xpToNext` | `SaveManager.ts:195` | なし（`restoreState()` 経由のみ） |
| `attack` | `SaveManager.ts:198`, `CombatCalculator.ts:57,64` | なし（`restoreState()` 経由のみ） |
| `isDefending` | `BattleEngine.ts:563,711,728`, `CombatCalculator.ts:76` | `BattleEngine.ts:503`（`= true`） |
| `baseDefense` | なし（`restoreState()` 経由のみ） | なし |
| `skills` | なし（`getState()` 経由のみ） | なし |

### 変更内容

```typescript
// Before
public level: number;
public xp: number;
public xpToNext: number;
public attack: number;
public isDefending: boolean = false;
public baseDefense: number = 0;
public skills: SkillDefinition[];

// After
private _level: number;
private _xp: number;
private _xpToNext: number;
private _attack: number;
private _isDefending: boolean = false;
private _baseDefense: number = 0;
private _skills: SkillDefinition[];

get level(): number { return this._level; }
get xp(): number { return this._xp; }
get xpToNext(): number { return this._xpToNext; }
get attack(): number { return this._attack; }
get isDefending(): boolean { return this._isDefending; }
get baseDefense(): number { return this._baseDefense; }
get skills(): SkillDefinition[] { return [...this._skills]; }
```

### 外部書き込みの対応

`BattleEngine.ts:503` の `member.isDefending = true` を置き換えるため、メソッドを追加:

```typescript
// PartyMember に追加
defend(): void {
  this._isDefending = true;
}
```

```typescript
// BattleEngine.ts:503
// Before
member.isDefending = true;

// After
member.defend();
```

### クラス内部の対応

`this.level`, `this.xp` 等の内部参照を全て `this._level`, `this._xp` 等に変更。
対象箇所: constructor, `gainXp()`, `levelUp()`, `resetAfterBattle()`, `fullRestore()`, `die()`, `restoreState()`, `getState()`

---

## S-2. Observer パターンに try-catch 追加 (レビュー 2-3)

### 対象ファイル

- `src/engine/GameEngine.ts:750`
- `src/engine/BattleEngine.ts:756`
- `src/engine/DialogueEngine.ts:247`

### 現状

3ファイルとも同じパターン:

```typescript
private notifyListeners(): void {
  const state = this.getState();
  this.listeners.forEach(listener => listener(state));
}
```

1つの listener が例外を投げると `forEach` が中断し、後続の listener に通知されない。

### 変更内容

3ファイル共通で以下のパターンに変更:

```typescript
private notifyListeners(): void {
  const state = this.getState();
  this.listeners.forEach(listener => {
    try {
      listener(state);
    } catch (e) {
      console.error('Listener error:', e);
    }
  });
}
```

GameEngine のみ `this.markDirty()` の呼び出しが先頭にある点に注意:

```typescript
// GameEngine.ts
private notifyListeners(): void {
  this.markDirty();
  const state = this.getState();
  this.listeners.forEach(listener => {
    try {
      listener(state);
    } catch (e) {
      console.error('Listener error:', e);
    }
  });
}
```

BattleEngine も同様に `this.markDirty()` あり。DialogueEngine にはなし。

---

## S-3. BattleEngine の setTimeout クリーンアップ (レビュー 2-4)

### 対象ファイル

- `src/engine/BattleEngine.ts`

### 現状

2箇所で `setTimeout` を使用しているが、戻り値を保持していない:

```typescript
// :396 - パーティアクション間の遅延
setTimeout(() => {
  this.executeNextPartyAction();
  this.notifyListeners();
}, 400);

// :595 - 敵ターン間の遅延
setTimeout(() => {
  this.executeNextEnemyTurn();
  this.notifyListeners();
}, 300);
```

バトル終了時やコンポーネントアンマウント時にタイマーが残る。

### 変更内容

#### 1. タイマーID配列をフィールドに追加

```typescript
private pendingTimers: ReturnType<typeof setTimeout>[] = [];
```

#### 2. タイマー登録用の private メソッドを追加

```typescript
private scheduleAction(callback: () => void, delay: number): void {
  const timerId = setTimeout(() => {
    this.pendingTimers = this.pendingTimers.filter(id => id !== timerId);
    callback();
  }, delay);
  this.pendingTimers.push(timerId);
}
```

#### 3. 既存の setTimeout を置換

```typescript
// :396
this.scheduleAction(() => {
  this.executeNextPartyAction();
  this.notifyListeners();
}, 400);

// :595
this.scheduleAction(() => {
  this.executeNextEnemyTurn();
  this.notifyListeners();
}, 300);
```

#### 4. クリーンアップメソッドを追加

```typescript
private clearPendingTimers(): void {
  this.pendingTimers.forEach(id => clearTimeout(id));
  this.pendingTimers = [];
}
```

#### 5. バトル終了時にクリア

バトル終了処理（`result` 設定箇所）で `this.clearPendingTimers()` を呼び出す。
また、`startBattle()` の冒頭でも呼び出し、前回のタイマーが残っていた場合に備える。

---

## S-4. 未使用型の削除 (レビュー 4)

### 対象ファイル

- `src/types/battle.ts:162-165`

### 削除対象

```typescript
// battle.ts:162-165 — 未使用
export interface InventoryItem {
  item: ItemDefinition;
  quantity: number;
}
```

`InventoryItem`（`battle.ts`）はどこからも import されていない。
コンポーネントは `InventoryItemState`（`party.ts:44`）を使用しており、完全に別の型。

### 削除対象外

`GrassDecoration`（`game.ts:49-52`）は `GameMap.ts`, `GameCanvas.tsx` で使用されているため**削除しない**。
レビュー文書の記載は誤り。

---

## S-5. CSS 変数未定義の修正 (レビュー 3-7)

### 対象ファイル

- `src/App.css`
- `src/components/ui/Button.css:66`

### 現状

```css
/* Button.css:66 */
.btn-ghost {
  color: var(--text-muted);
}
```

`--text-muted` が `:root` に定義されていないため、フォールバック値なしで未定義変数を参照。

### 変更内容

`App.css` の `:root` に追加:

```css
:root {
  --pixel-size: 4px;
  --bg-dark: #1a1a2e;
  --bg-mid: #16213e;
  --accent-primary: #e94560;
  --accent-secondary: #0f3460;
  --text-light: #f1f1f1;
  --text-muted: #888;          /* 追加 */
  --grass: #4a7c59;
  --path: #8b7355;
  --tree: #2d5016;
  --water: #4a90e2;
}
```

`#888` は既存の `.btn-secondary` の `color: #aaa` より暗く、ゴースト（透明背景）ボタンの控えめな表示に適切。

---

## 実施順序

1. **S-4** 未使用型の削除（影響範囲が最小）
2. **S-5** CSS 変数修正（影響範囲が最小）
3. **S-1** PartyMember カプセル化（モデル層の変更）
4. **S-2** Observer try-catch（エンジン層の変更）
5. **S-3** setTimeout クリーンアップ（エンジン層の変更）

## 検証方法

- `npx tsc --noEmit` — 型チェック通過
- `npm run build` — ビルド成功
- 開発サーバーで手動動作確認（バトル開始・終了・防御コマンドの動作）
