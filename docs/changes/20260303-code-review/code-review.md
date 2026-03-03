# コードレビュー: 2026年クエスト

レビュー日: 2026-03-03

---

## 1. バグ (要修正)

### 1-1. HP/MP 回復時の装備ボーナス無視

- **ファイル**: `src/models/PartyMember.ts:140-146, 161-168`
- **内容**: `heal()` と `restoreMp()` で装備による最大HP/MP増加分が反映されない
- **原因**: 回復後の HitPoints 再構築時に `this._hp.max`（基礎値）を使用しており、装備ボーナス込みの `effectiveMaxHp` を使うべき
- **影響**: ゲームバランスに影響。装備で最大HPが増えても、回復上限が基礎値のまま
- **重要度**: 高

### 1-2. SaveManager の leaderName がIDを返している

- **ファイル**: `src/services/SaveManager.ts:39`
- **内容**: `leaderName: leader?.definitionId ?? null` — セーブスロットUIに名前ではなく定義ID（例: "engineer"）が表示される
- **修正案**: 定義IDからパーティメンバー定義を引いて `name` を返す
- **重要度**: 高

### 1-3. BattleEngine の文字列判定が脆弱

- **ファイル**: `src/engine/BattleEngine.ts:640-648`
- **内容**: `msg.includes('倒れた')` で状態異常による戦闘不能を判定している
- **問題**: 日本語文字列に依存しており、メッセージ変更やローカライズで壊れる
- **修正案**: `StatusEffectResult` に `targetDied: boolean` フィールドを追加し、構造化データで判定する
- **重要度**: 中

---

## 2. 設計上の問題

### 高優先度

#### 2-1. GameEngine が God Class

- **ファイル**: `src/engine/GameEngine.ts` 全体（約990行）
- **内容**: 移動・バトル・会話・ショップ・セーブ・カメラ・エンカウント・状態管理の全てを1クラスで担当
- **問題**: 単一責任原則に違反。変更が広範囲に波及し、テストが困難
- **改善案**: EncounterManager, MapManager, ShopManager 等に分割

#### 2-2. PartyMember の public フィールド

- **ファイル**: `src/models/PartyMember.ts:31-41`
- **対象**: `level`, `xp`, `xpToNext`, `attack`, `isDefending`, `baseDefense`
- **問題**: 外部から `member.level = 100` で無制限に変更可能。カプセル化が不十分
- **改善案**: private にして getter/setter 経由に変更

#### 2-3. Observer パターンのエラーハンドリング欠如

- **ファイル**: `src/engine/GameEngine.ts:750`, `src/engine/BattleEngine.ts:756`, `src/engine/DialogueEngine.ts:247`
- **内容**: `listeners.forEach(listener => listener(state))` で listener が例外を投げると後続が通知されない
- **改善案**: 各 listener 呼び出しを try-catch で囲む

#### 2-4. BattleEngine の setTimeout 未クリーンアップ

- **ファイル**: `src/engine/BattleEngine.ts:396, 595`
- **内容**: アニメーション用の setTimeout がバトル終了時にキャンセルされない
- **問題**: メモリリーク。コンポーネントアンマウント後にコールバックが実行される可能性
- **改善案**: タイマーIDを保持し、バトル終了時にクリア

### 中優先度

#### 2-5. ゲーム状態の排他制御なし

- **ファイル**: `src/engine/GameEngine.ts`
- **内容**: battle / dialogue / shop が同時に true になりうる構造
- **改善案**: ステートマシン（enum で現在の状態を明示的に管理）

#### 2-6. ItemFactory のシングルトンキャッシュ

- **ファイル**: `src/models/items/ItemFactory.ts:209-230`
- **内容**: `create()` が同じインスタンスをキャッシュして返す
- **問題**: アイテムのプロパティが mutation されると全箇所に波及
- **改善案**: 定義データのみキャッシュし、インスタンスは毎回生成

#### 2-7. ManaPoints の負数未検証

- **ファイル**: `src/models/values/ManaPoints.ts:20`
- **内容**: `ManaPoints.of()` が負の current 値をそのまま受け入れる
- **比較**: `HitPoints.of()` は `Math.max(0, current)` でクランプしている
- **改善案**: `ManaPoints.of()` にも同様のクランプを追加

#### 2-8. マップ生成が非決定的

- **ファイル**: `src/data/maps.ts:129`
- **内容**: `Math.random()` によるタイル生成でテスト・再現性が困難
- **改善案**: シード付き乱数、または静的マップ定義に移行

#### 2-9. 防御状態リセットのタイミング

- **ファイル**: `src/engine/BattleEngine.ts:604-612`
- **内容**: `resetAllDefend()` が状態異常処理（`processStatusEffects`）の前に実行される
- **問題**: 防御状態が状態異常ダメージ計算に反映されない可能性

---

## 3. React コンポーネントの問題

### 3-1. 画像がモジュールスコープでロード

- **ファイル**: `src/components/GameCanvas.tsx:5-8`
- **内容**: `new Image()` がモジュールスコープで実行される。ロード完了前にレンダーされる可能性がある
- **追加**: エラーハンドリング・フォールバックなし
- **改善案**: `useRef` + `onload` イベントでロード管理

### 3-2. 毎レンダーで配列ソート

- **ファイル**: `src/components/GameCanvas.tsx:59-63`
- **内容**: `[...gameObjects].sort(...)` が毎レンダーで実行される
- **改善案**: `useMemo` でメモ化

### 3-3. unsafe な型アサーション

- **ファイル**: `src/components/GameCanvas.tsx:60`
- **内容**: `as unknown as { renderer?: { zIndex: number } }` で型安全性を回避
- **改善案**: `GameObject` に `zIndex` getter を追加

### 3-4. useEffect の依存配列が広すぎ

- **ファイル**: `src/hooks/useGameEngine.ts:137-177`
- **内容**: `state` 全体を依存に含むため、毎フレームでキーボードリスナーが再生成される
- **改善案**: `useCallback` + 必要な状態のみを依存に

### 3-5. setTimeout 未クリーンアップ

- **ファイル**: `src/components/PauseMenu.tsx:42`
- **内容**: `setTimeout(() => setMessage(null), 2000)` がアンマウント時にクリアされない
- **改善案**: `useEffect` 内でクリーンアップ関数を返す

### 3-6. アクセシビリティ

- **ファイル**: `src/components/PlayerStats.tsx:44`, `src/components/PauseMenu.tsx:57-62`
- **内容**: 絵文字（⚔️, 🛡️, 🔮 等）に ARIA ラベルなし
- **改善案**: `role="img" aria-label="..."` を付与

### 3-7. CSS 変数未定義

- **ファイル**: `src/components/ui/Button.css:66`
- **内容**: `.btn-ghost` が `--text-muted` を参照するが、`:root` に定義がない
- **改善案**: `App.css` の `:root` に `--text-muted` を追加

### 3-8. レスポンシブ対応なし

- **ファイル**: `src/App.css:35-38`
- **内容**: `grid-template-columns: 280px 1fr 280px` が固定幅。モバイル対応なし
- **改善案**: メディアクエリでブレイクポイント追加

---

## 4. 未使用コード

| 項目 | ファイル |
|---|---|
| `GrassDecoration` インターフェース | `src/types/game.ts:49-52` |
| `InventoryItem` インターフェース | `src/types/battle.ts:162-165` |

---

## 5. 良い点

- **値オブジェクト**: HitPoints / ManaPoints / Gold / EquipmentStatBlock が不変設計で導入済み
- **Factory パターン**: ItemFactory, StatusEffectFactory, ConditionFactory が一貫して使われている
- **ECS 風アーキテクチャ**: GameObject + Transform + Renderer の構成が明確
- **Strategy パターン**: PassCondition による通過条件の抽象化
- **Template Method パターン**: BaseStatusEffect で共通処理を定義し、サブクラスでオーバーライド
- **型安全性**: TypeScript strict mode、型定義が充実
- **責務分離**: Engine / Models / Types / Data / Services / Components のレイヤーが明確
- **getState() パターン**: React への状態提供が全モデルで一貫
- **拡張性**: ステータス効果・アイテム・条件の追加が容易な設計

---

## 6. 推奨対応順

### 即時対応（バグ修正）

1. PartyMember の heal/restoreMp の装備ボーナス反映修正 (1-1)
2. SaveManager.leaderName のバグ修正 (1-2)
3. ManaPoints.of() に負数クランプ追加 (2-7)

### 短期対応（設計改善）

4. PartyMember の public フィールドを private + getter に変更 (2-2)
5. Observer パターンに try-catch 追加 (2-3)
6. BattleEngine の setTimeout クリーンアップ (2-4)
7. 未使用型の削除 (4)
8. CSS 変数修正 (3-7)

### 中長期対応（アーキテクチャ）

9. GameEngine の責務分割 (2-1)
10. ゲーム状態のステートマシン導入 (2-5)
11. React コンポーネントのパフォーマンス最適化 (3-1〜3-4)
12. アクセシビリティ対応 (3-6)
13. レスポンシブ対応 (3-8)
