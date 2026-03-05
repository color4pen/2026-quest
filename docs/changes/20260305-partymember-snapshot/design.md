# PartyMember.restoreState() を Snapshot 型に変更

## 種別
- [x] リファクタリング

## 概要

`PartyMember.restoreState()` の9個のプリミティブ引数を `PartyMemberSnapshot` 型にまとめる。

**理由**:
1. **内部構造への暗黙の結合**: 呼び出し側が `baseMaxHp`, `xpToNext` など内部実装を知る必要がある
2. **引数順序の脆弱性**: 9個の `number` 引数は入れ替えてもコンパイルエラーにならない
3. **概念の欠如**: 「復元に必要な状態一式」がドメイン語彙として存在しない

## 現状分析

### 現在のシグネチャ
```typescript
// PartyMember.ts:381-397
restoreState(
  hp: number,
  mp: number,
  level: number,
  xp: number,
  xpToNext: number,
  baseMaxHp: number,
  baseMaxMp: number,
  baseAttack: number,
  baseDefense: number
): void
```

### 呼び出し箇所
- `GameEngine.applyPartyRestoreData()` (GameEngine.ts:406-416)
- `PartyMember.test.ts` (テスト)

### 関連する型
- `SavedMemberData` (types/save.ts:48-61) — セーブデータの型

## 設計方針

### 1. `PartyMemberSnapshot` 型を新規定義

`SavedMemberData` から復元に必要な9フィールドを抽出した型を定義。
`types/party.ts` に配置（PartyMember関連の型が集約されている）。

```typescript
export interface PartyMemberSnapshot {
  hp: number;
  mp: number;
  level: number;
  xp: number;
  xpToNext: number;
  baseMaxHp: number;
  baseMaxMp: number;
  baseAttack: number;
  baseDefense: number;
}
```

### 2. `restoreState()` のシグネチャ変更

```typescript
restoreState(snapshot: PartyMemberSnapshot): void
```

### 3. 呼び出し側の更新

`GameEngine.applyPartyRestoreData()` で `SavedMemberData` → `PartyMemberSnapshot` への変換を行う。
フィールド名が同一なので、スプレッド構文で簡潔に記述可能。

## 実装計画

- Step 1: `types/party.ts` に `PartyMemberSnapshot` 型を追加
- Step 2: `PartyMember.restoreState()` のシグネチャを変更
- Step 3: `GameEngine.applyPartyRestoreData()` の呼び出しを更新
- Step 4: テストを更新
- Step 5: 型チェック・テスト実行

## 影響範囲

| ファイル | 変更内容 |
|---------|---------|
| `types/party.ts` | `PartyMemberSnapshot` 型追加 |
| `models/PartyMember.ts` | `restoreState()` シグネチャ変更 |
| `engine/GameEngine.ts` | 呼び出し箇所更新 |
| `models/PartyMember.test.ts` | テスト更新 |

## 承認
- [ ] 設計レビュー完了
- [ ] 実装開始
