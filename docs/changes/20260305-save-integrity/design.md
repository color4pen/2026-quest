# セーブデータ改ざん検知（カジュアル対策）

## 概要
セーブデータにHMAC署名を付与し、DevToolsでlocalStorageを直接編集するレベルのカジュアルな改ざんを検知・無効化する。

## 現状分析

### 対象ファイル
- `src/services/SaveManager.ts` (224行) - localStorage操作
- `src/engine/SaveLoadHandler.ts` (219行) - 検証・変換

### 現状のフロー
```
save: GameEngine → SaveLoadHandler → SaveManager → localStorage
load: localStorage → SaveManager → SaveLoadHandler → GameEngine
```

### 問題点
- localStorageのJSONを直接編集すればゴールド・レベル等を改ざん可能
- シングルプレイヤーなので実害は少ないが、カジュアルなチートは防ぎたい

## 設計方針

### アプローチ
HMAC-SHA256署名をセーブデータに付与する。

```typescript
// 保存形式（SignedSaveData型、types/save.tsに追加）
{
  payload: SaveData,      // 実データ
  signature: string       // HMAC-SHA256署名（hex）
}
```

### 新規作成: integrity.ts
`src/services/integrity.ts` にHMAC計算ロジックを純粋関数としてエクスポートする。
（`calculators/` の設計思想に合わせ、クラスではなく関数）

```typescript
// HMAC-SHA256署名を生成
export function sign(data: string): string

// 署名を検証
export function verify(data: string, signature: string): boolean
```

### 変更: SaveManager
- `save()`: データをJSONシリアライズ → 署名付与 → 保存
- `load()`: 読み込み → 署名検証 → 不正なら null を返す
- `getSaveSlots()`: 署名付き新フォーマットからデータを読み取る

### 旧データマイグレーション
`load()` で `signature` フィールドがない場合:
1. 旧フォーマット（署名なし）と判定
2. データを再署名して保存し直す
3. 正常なデータとして返す

これにより既存プレイヤーのセーブデータが消失しない。

### 改ざん検知時のUX
- `SaveManager.load()` が `null` を返す
- `SaveLoadHandler` の既存エラーハンドリングに乗せる
- エラーメッセージ: 「セーブデータが破損しています」

### 鍵管理
- ソースコード内に固定鍵を埋め込む（public repoなので割り切り）
- 環境変数ではなくコード内に直接記載

### ライブラリ
js-sha256を使用（同期的、軽量、型定義内蔵）

```bash
npm install js-sha256
```

## 実装計画

### Step 1: ライブラリインストール
```bash
npm install js-sha256
```

### Step 2: 型定義追加
- `types/save.ts` に `SignedSaveData` 型を追加

### Step 3: integrity.ts作成
- `src/services/integrity.ts`
- `sign()` / `verify()` 関数

### Step 4: SaveManager改修
- `save()`: 署名付与
- `load()`: 署名検証 + 旧データマイグレーション
- `getSaveSlots()`: 新フォーマット対応

### Step 5: 型チェック・テスト
- `npx tsc --noEmit`
- 純粋関数のテスト作成

## 期待される効果

| 項目 | Before | After |
|------|--------|-------|
| DevToolsでの改ざん | 可能 | 検知・無効化 |
| ソースを読んでの改ざん | 可能 | 可能（割り切り） |
| 既存コードへの影響 | - | SaveManagerのみ |
| 旧セーブデータ | - | 自動マイグレーション |

## 制限事項
- リポジトリがpublicなので、ソースを読めば鍵を取得して再署名可能
- これは「カジュアルな改ざん防止」であり、完全な防止ではない

## 承認
- [ ] 設計レビュー完了
- [ ] 実装開始
