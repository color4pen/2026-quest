# GameEngine パブリックAPI整理

## 概要

GameEngineクラスの公開APIを整理し、内部実装の詳細を隠蔽する。
現在、外部から呼ばれないメソッドも`public`になっており、APIの意図が不明確。

## 現状分析

### GameEngine.ts（549行）

**現在のパブリックメソッド（27個）:**

| メソッド | 外部使用 | 用途 |
|---------|---------|------|
| `initialize()` | ❌ | 内部初期化 |
| `reset()` | ✅ | ExplorationAPI.reset |
| `loadMap()` | ❌ | 内部でのみ使用 |
| `move()` | ✅ | ExplorationAPI.move |
| `getGameObjects()` | ✅ | gameObjects取得 |
| `selectBattleCommand()` | ✅ | BattleAPI |
| `useBattleSkill()` | ✅ | BattleAPI |
| `useBattleItem()` | ✅ | BattleAPI |
| `cancelBattleSelection()` | ✅ | BattleAPI |
| `selectBattleTarget()` | ✅ | BattleAPI |
| `closeBattle()` | ✅ | BattleAPI |
| `selectDialogueChoice()` | ✅ | DialogueAPI |
| `advanceDialogue()` | ✅ | DialogueAPI |
| `closeDialogue()` | ✅ | DialogueAPI |
| `buyItem()` | ✅ | ShopAPI |
| `closeShop()` | ✅ | ShopAPI |
| `useFieldItem()` | ✅ | PartyAPI |
| `equipItem()` | ✅ | PartyAPI |
| `unequipItem()` | ✅ | PartyAPI |
| `recruitMember()` | ✅ | PartyAPI |
| `getParty()` | ❌ | 未使用 |
| `getCurrentMapId()` | ❌ | 未使用（save内で内部使用） |
| `getGameState()` | ❌ | 未使用 |
| `setGameState()` | ❌ | 未使用 |
| `isGameStateSet()` | ❌ | 未使用 |
| `getSaveSlots()` | ✅ | SaveAPI |
| `save()` | ✅ | SaveAPI |
| `load()` | ✅ | SaveAPI |
| `getState()` | ✅ | 状態取得 |
| `subscribe()` | ✅ | リスナー登録 |

### 問題点

1. **外部未使用メソッドがpublic**: `initialize()`, `loadMap()`, `getParty()`, `getCurrentMapId()` など
2. **ゲーム状態操作の露出**: `getGameState()`, `setGameState()` は内部用途のみ
3. **APIの意図が不明確**: どれが外部向けAPIか分かりにくい

## 設計方針

### 1. アクセス修飾子の適正化

**public → private に変更:**
- `initialize()` → private（constructorから呼ばれるのみ）
- `loadMap()` → private（内部でのみ使用）
- `getParty()` → 削除（未使用）
- `getCurrentMapId()` → private（save内部で使用）
- `getGameState()` → private（未使用）
- `setGameState()` → private（未使用）
- `isGameStateSet()` → private（未使用）

### 2. 最終的なパブリックAPI（20個）

```typescript
// 探索
move(direction: Direction): void
reset(): void
getGameObjects(): GameObject[]

// バトル
selectBattleCommand(command: BattleCommand): void
useBattleSkill(skill: SkillDefinition): void
useBattleItem(itemId: string): void
cancelBattleSelection(): void
selectBattleTarget(targetIndex: number): void
closeBattle(): void

// 会話
selectDialogueChoice(choice: DialogueChoice): void
advanceDialogue(): void
closeDialogue(): void

// ショップ
buyItem(shopItem: ShopItem): boolean
closeShop(): void

// パーティー
useFieldItem(itemId: string, targetMemberId?: string): Result
equipItem(memberId: string, itemId: string): Result
unequipItem(memberId: string, slot: EquipmentSlot): Result
recruitMember(definition: PartyMemberDefinition): boolean

// セーブ・ロード
getSaveSlots(): SaveSlotInfo[]
save(slotId: number): boolean
load(slotId: number): boolean

// 状態
getState(): GameEngineState
subscribe(listener: GameEventListener): () => void
```

## 実装計画

- Step 1: `initialize()` を private に変更
- Step 2: `loadMap()` を private に変更
- Step 3: `getParty()` を削除
- Step 4: `getCurrentMapId()` を private に変更
- Step 5: `getGameState()`, `setGameState()`, `isGameStateSet()` を private に変更
- Step 6: テスト実行して確認

## 実施結果

| 指標 | Before | After |
|-----|--------|-------|
| パブリックメソッド数 | 30 | 24 |
| 削除/private化 | - | 6 |
| API明確性 | 低 | 高 |

### 変更内容

| メソッド | 変更 |
|---------|------|
| `initialize()` | public → private |
| `loadMap()` | public → private |
| `getParty()` | 削除 |
| `getGameState()` | 削除（コールバック経由で内部使用） |
| `setGameState()` | 削除（コールバック経由で内部使用） |
| `isGameStateSet()` | 削除（コールバック経由で内部使用） |
| `getCurrentMapId()` | public維持（読み取り専用で安全） |

## 承認

- [x] 設計レビュー完了
- [x] 実装完了
