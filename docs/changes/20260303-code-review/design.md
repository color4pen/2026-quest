# Task 001: コードレビュー対応

- **起票日**: 2026-03-03
- **レビュー元**: [code-review.md](./code-review.md)
- **ステータス**: 未着手

---

## 対応スコープ

### 即時対応（バグ修正）

| # | 対象 | ファイル | 内容 | 重要度 |
|---|------|----------|------|--------|
| 1-1 | heal/restoreMp 装備ボーナス無視 | `PartyMember.ts:140-146, 161-168` | HitPoints 再構築時に `effectiveMaxHp` を使用するよう修正 | 高 |
| 1-2 | SaveManager leaderName | `SaveManager.ts:39` | `definitionId` ではなく `name` を返すよう修正 | 高 |
| 2-7 | ManaPoints 負数未検証 | `ManaPoints.ts:20` | `ManaPoints.of()` に `Math.max(0, current)` を追加 | 中 |

### 短期対応（設計改善）

| # | 対象 | ファイル | 内容 |
|---|------|----------|------|
| 2-2 | PartyMember public フィールド | `PartyMember.ts:31-41` | `level`, `xp`, `attack` 等を private + getter に変更 |
| 2-3 | Observer エラーハンドリング | `GameEngine.ts:750`, `BattleEngine.ts:756`, `DialogueEngine.ts:247` | listener 呼び出しを try-catch で囲む |
| 2-4 | setTimeout 未クリーンアップ | `BattleEngine.ts:396, 595` | タイマーID保持 + バトル終了時にクリア |
| 4 | 未使用型の削除 | `game.ts:49-52`, `battle.ts:162-165` | `GrassDecoration`, `InventoryItem` を削除 |
| 3-7 | CSS 変数未定義 | `Button.css:66`, `App.css` | `:root` に `--text-muted` を追加 |

### 中長期対応（アーキテクチャ）

| # | 対象 | 内容 |
|---|------|------|
| 2-1 | GameEngine 分割 | EncounterManager, MapManager, ShopManager 等に責務分割 |
| 2-5 | ステートマシン導入 | battle/dialogue/shop の排他状態を enum で管理 |
| 1-3 | BattleEngine 文字列判定 | `StatusEffectResult` に `targetDied` フィールドを追加 |
| 3-1〜3-4 | React パフォーマンス | 画像ロード管理、useMemo、useCallback、依存配列最適化 |
| 3-6 | アクセシビリティ | 絵文字に ARIA ラベル付与 |
| 3-8 | レスポンシブ対応 | メディアクエリ追加 |

---

## 設計方針

### 即時対応の修正内容

#### 1-1. heal/restoreMp 装備ボーナス反映

```typescript
// Before: 基礎値の max で制限される
heal(amount: number): void {
  this._hp = HitPoints.of(this._hp.current + amount, this._hp.max);
}

// After: 装備込みの effectiveMaxHp で制限する
heal(amount: number): void {
  const effectiveMax = this.effectiveMaxHp;
  this._hp = HitPoints.of(
    Math.min(this._hp.current + amount, effectiveMax),
    this._hp.max
  );
}
```

`restoreMp()` も同様に `effectiveMaxMp` を使用。

#### 1-2. SaveManager leaderName

```typescript
// Before
leaderName: leader?.definitionId ?? null

// After: パーティメンバー定義から name を取得
leaderName: leader ? getPartyMemberName(leader.definitionId) : null
```

定義データへのアクセス方法は実装時に確認。

#### 2-7. ManaPoints 負数クランプ

```typescript
// Before
static of(current: number, max: number): ManaPoints {
  return new ManaPoints(current, max);
}

// After
static of(current: number, max: number): ManaPoints {
  return new ManaPoints(Math.max(0, current), max);
}
```

---

## 実施順序

1. 即時対応 3件（バグ修正）
2. 短期対応 5件（設計改善）
3. 中長期対応（別タスクとして起票を検討）

## 検証方法

- `npx tsc --noEmit` — 型チェック通過
- `npm run build` — ビルド成功
- 開発サーバーで手動動作確認
