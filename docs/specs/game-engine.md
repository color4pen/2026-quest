# ゲームエンジン設計ドキュメント

## 概要

GameEngine はゲーム全体のオーケストレーター。プレイヤー移動・マップ管理・インタラクション振り分け・バトル/会話/ショップの委譲・カメラ追従・エンカウント・セーブ/ロードの復元を一元管理する。各サブシステム（BattleEngine, DialogueEngine, Party 等）を保持し、状態変更時に Observer パターンで React 側に通知する。

## アーキテクチャ

```
┌───────────────────────────────────────────────────────────────┐
│                        GameEngine                             │
│                                                               │
│  ┌─────────┐  ┌───────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Player  │  │ Party │  │GameStateMgr  │  │  GameMap     │  │
│  │(移動用) │  │(戦闘用)│  │(フラグ管理)  │  │(タイル/ワープ)│  │
│  └─────────┘  └───────┘  └──────────────┘  └─────────────┘  │
│                                                               │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────┐     │
│  │BattleEngine  │  │DialogueEngine  │  │  ShopState    │     │
│  │(戦闘委譲)    │  │(会話委譲)      │  │(ショップ状態) │     │
│  └──────────────┘  └────────────────┘  └───────────────┘     │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐               │
│  │  NPCs[]  │  │Treasures[]│  │FixedEnemies[]│               │
│  └──────────┘  └──────────┘  └──────────────┘               │
│                                                               │
│  Observer: Set<GameEventListener>                             │
└───────────────────────┬───────────────────────────────────────┘
                        │ subscribe / notifyListeners
                        ▼
                ┌───────────────┐
                │  React UI     │
                │ (useGameEngine)│
                └───────────────┘
```

## GameEngineState

GameEngine が公開する状態スナップショット。React 側はこの型を購読する。

```typescript
interface GameEngineState {
  player: PlayerState;          // { id, x, y, active }
  party: PartyState;            // メンバー・インベントリ・ゴールド
  treasures: TreasureState[];
  npcs: NPCState[];
  map: GameMapState;
  camera: CameraState;
  messages: Message[];
  isGameOver: boolean;
  battle: BattleState | null;
  dialogue: DialogueState | null;
  shop: ShopState | null;
  mapName: string;
}
```

## 初期化

```typescript
constructor() → initialize()
```

1. Player をリセット（位置のみ管理）
2. Party をリセットし、`INITIAL_PARTY_MEMBER`（エンジニア）を追加
3. 初期状態異常（インフルエンザ）を付与
4. `loadMap(INITIAL_MAP_ID)` で初期マップを読み込み
5. 開始メッセージを追加

## マップ読み込み

```typescript
loadMap(mapId: string, playerX?: number, playerY?: number, skipCache?: boolean): void
```

### 処理フロー

```
1. MapDefinition を MAPS[mapId] から取得
2. skipCache でなければ現在マップの宝箱状態をキャッシュ
3. currentMapId を更新
4. GameMap.loadFromDefinition(mapDef)
5. プレイヤー位置を設定（引数 or mapDef.playerStart）
6. NPC を NPC_DEFINITIONS から生成・配置
7. 宝箱を MapDefinition.treasures から生成・配置
8. キャッシュされた宝箱状態を適用（applyTreasureStates）
9. 固定敵をスポーン条件付きで生成（spawnFixedEnemies）
10. 到着メッセージを追加
11. カメラをプレイヤー位置に追従
```

### skipCache パラメータ

セーブデータからのロード時に `true` を渡す。キャッシュは既に `restoreFromSaveData` で復元済みのため、現在マップの空の状態で上書きしない。

## プレイヤー移動

```typescript
move(direction: Direction): void
```

### 移動ブロック条件

バトル中・会話中・ショップ中・ゲームオーバー・全滅時は移動を無視。

### 処理フロー

```
1. ブロック条件チェック（バトル/会話/ショップ/ゲームオーバー/全滅）
2. 次の位置を計算（player.getNextPosition）
3. マップ通行チェック（壁・範囲外）
4. 条件付き扉の通過チェック（door.canPass(party)）
5. インタラクション対象の検索
   ├─ NPC → 会話開始（return）
   ├─ 宝箱 → ゴールド獲得
   ├─ 固定敵 → バトル開始（return）
   └─ blockMovement なら return
6. 移動実行（player.moveTo）
7. カメラ追従
8. ワープポイントチェック → 該当すれば loadMap
9. エンカウント判定
```

## インタラクションシステム

### 対象オブジェクト収集

```typescript
private getAllInteractableObjects(): GameObject[] {
  return [
    ...this.npcs,
    ...this.treasures.filter(t => !t.isOpened()),
    ...this.fixedEnemies.filter(e => !e.isDead()),
  ];
}
```

### InteractionResult のハンドリング

| type | 処理 |
|------|------|
| `dialogue` | `startDialogue(npc)` — DialogueEngine を起動 |
| `treasure` | `party.addGold(gold)` — ゴールド加算＋メッセージ |
| `battle` | `startBattle([enemy])` — BattleEngine を起動 |

`blockMovement: true` の場合、移動をキャンセルして即 return。

## バトル委譲

### 開始

```typescript
private startBattle(enemies: Enemy[]): void
```

1. `BattleEngine` を生成（Party と敵配列を渡す）
2. `onBattleEnd` コールバックを設定
3. BattleEngine の状態変更を購読

### 公開メソッド

| メソッド | 役割 |
|---------|------|
| `selectBattleCommand(command)` | コマンド選択（攻撃/スキル/アイテム/防御） |
| `useBattleSkill(skill)` | スキル使用 |
| `useBattleItem(itemId)` | アイテム使用 |
| `selectBattleTarget(index)` | ターゲット選択 |
| `cancelBattleSelection()` | 選択キャンセル |
| `closeBattle()` | バトル終了（battle_end フェーズのみ） |

### バトル終了処理（handleBattleEnd）

**勝利時:**
1. 全敵の XP/Gold を合算
2. Party にゴールド追加
3. 生存メンバーに XP を均等分配
4. レベルアップ判定・メッセージ
5. 敵の `onDefeat` で GameStateManager のフラグ設定（ボス撃破等）
6. Party 全員の戦闘後回復

**敗北時:**
- `isGameOver = true`

## 会話委譲

### 開始

```typescript
private startDialogue(npc: NPC): void
```

1. `DialogueEngine` を生成（NPC と `getGameState` コールバックを渡す）
2. コールバック設定:

| コールバック | 処理 |
|-------------|------|
| `onDialogueEnd` | DialogueEngine を null に |
| `onOpenShop` | DialogueEngine を null に → `openShop(npc)` |
| `onHeal` | `handleHeal(cost)` — ゴールド消費＋全回復 |
| `onSetState` | `gameStateManager.set(key, value)` |
| `onGiveItem` | `party.addItemById()` + メッセージ |

### 公開メソッド

| メソッド | 役割 |
|---------|------|
| `selectDialogueChoice(choice)` | 選択肢を選ぶ |
| `closeDialogue()` | 会話を閉じる |
| `advanceDialogue()` | 次のセリフへ進む |

## ショップ

### 開店

```typescript
private openShop(npc: NPC): void
```

NPC の `shopItems` から `ShopState` を構築。

### 購入

```typescript
public buyItem(shopItem: ShopItem): boolean
```

1. ゴールド不足チェック
2. 在庫切れチェック
3. `party.spendGold()` + `party.addItemById()`
4. 在庫デクリメント

## カメラシステム

```typescript
private updateCamera(): void
```

プレイヤー位置を中心に、マップ端でクランプ。マップがビューポートより小さい場合は中央に固定。

```
cameraX = clamp(halfW, playerX, mapWidth - halfW)
cameraY = clamp(halfH, playerY, mapHeight - halfH)
```

## エンカウントシステム

```typescript
private checkEncounter(position): void
```

1. デバッグモードなら skip
2. `gameMap.getEncounter()` でエンカウント設定を取得
3. `Math.random() > rate` なら skip
4. 1〜3体のランダム敵を生成（パーティーリーダーのレベル基準）
5. バトル開始

### デバッグモード

```typescript
private isDebugMode(): boolean
```

`?mode=debug` URL パラメータでエンカウントを無効化。

## 固定敵スポーン

```typescript
private spawnFixedEnemies(mapDef: MapDefinition): Enemy[]
```

`mapDef.fixedEnemies` の各配置を `checkSpawnCondition` でフィルタリングし、条件を満たすもののみ生成。

### スポーン条件評価

```typescript
private checkSpawnCondition(cond?: { key, op, value }): boolean
```

| op | 意味 |
|----|------|
| `<` | gameState(key) < value |
| `<=` | gameState(key) <= value |
| `==` | gameState(key) === value |
| `!=` | gameState(key) !== value |
| `>=` | gameState(key) >= value |
| `>` | gameState(key) > value |

条件なし（`undefined`）の場合は常に `true`。

## 宝箱状態キャッシュ

マップ間移動で宝箱の開封状態を保持する仕組み。

```typescript
private treasureStatesCache: Record<string, SavedTreasureData[]> = {};
```

### cacheTreasureStates

現在マップの全宝箱の `{ x, y, opened }` をマップID をキーにキャッシュ。`loadMap` 時（マップ切り替え前）と `save` 時に呼ばれる。

### applyTreasureStates

`loadMap` でマップ読み込み後、キャッシュから該当マップの宝箱状態を復元。位置 `(x, y)` でマッチングし、開封済みなら `treasure.open()` を呼ぶ。

## 状態キャッシュ（パフォーマンス最適化）

```typescript
private stateCache: GameEngineState | null = null;
private stateDirty: boolean = true;
```

### markDirty

状態が変更されたことをマーク。次回 `getState()` 時に再構築される。

### getState

`stateDirty` が `true` の場合のみ新しい `GameEngineState` を構築。`false` ならキャッシュを返す。

### notifyListeners

1. `markDirty()` で再構築をトリガー
2. `getState()` で最新状態を取得
3. 全リスナーに通知（try-catch でエラーを隔離）

## Observer パターン

```typescript
subscribe(listener: GameEventListener): () => void
```

リスナーを追加し、解除関数を返す。`useGameEngine` フックが `useEffect` 内で購読・解除する。

## フィールド操作

### アイテム使用

```typescript
public useFieldItem(itemId: string, targetMemberId?: string): { success, message }
```

ポーズメニューからのアイテム使用。対象メンバーを指定可能（未指定ならリーダー）。ロジックは `Party.useItemOnMember()` に委譲。

### 装備変更

```typescript
public equipItem(memberId, itemId): { success, message }
public unequipItem(memberId, slot): { success, message }
```

`Party.equipItem()` / `Party.unequipItem()` に委譲。

## 宿屋（回復）

```typescript
private handleHeal(cost: number): boolean
```

1. `party.spendGold(cost)` — 失敗なら `false`
2. `party.fullHealAll()` — 全員のHP/MP全回復
3. メッセージ追加

## パーティー管理

```typescript
public recruitMember(definition: PartyMemberDefinition): boolean
```

パーティー満員（4人）チェック後、`party.addMember()` で追加。

## セーブ/ロード

### セーブ

```typescript
public save(slotId: number): boolean
```

1. `cacheTreasureStates()` で最新の宝箱状態を保存
2. `SaveManager.save()` に状態一式を渡す

### ロード

```typescript
public load(slotId: number): boolean
```

1. `SaveManager.load()` でセーブデータ取得
2. `restoreFromSaveData()` で全状態を復元

### restoreFromSaveData

```
1. 状態リセット（messages, battleEngine, dialogueEngine, shopState）
2. treasureStatesCache を復元
3. gameStateManager を復元
4. restorePartyFromSaveData で Party を復元
5. loadMap(mapId, x, y, skipCache=true)
```

### restorePartyFromSaveData

```
1. Party リセット + インベントリクリア
2. ゴールド設定
3. インベントリ復元（itemId + quantity）
4. 各メンバー復元:
   a. definition を取得
   b. party.addMember(definition)
   c. member.restoreState(hp, mp, level, xp, ...)
   d. 装備復元（weapon, armor, accessory）
   e. 状態異常復元
```

## メッセージシステム

```typescript
private addMessage(text: string, type: MessageType): void
```

メッセージを追加し、`MAX_MESSAGES` を超えたら古いものを切り捨て。`messageId` は単調増加の連番。

## 描画用オブジェクト取得

```typescript
public getGameObjects(): GameObject[]
```

描画順序: 宝箱 → NPC → 生存固定敵 → Player（Player が最前面）。`GameCanvas` が `zIndex` でソートして描画する。

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/engine/GameEngine.ts` | ゲームエンジン本体 |
| `src/engine/BattleEngine.ts` | バトル委譲先（→ battle-system.md） |
| `src/engine/DialogueEngine.ts` | 会話委譲先（→ dialogue-system.md） |
| `src/engine/CombatCalculator.ts` | 戦闘計算（→ combat-calculator.md） |
| `src/models/Player.ts` | プレイヤー（→ game-object-system.md） |
| `src/models/Party.ts` | パーティー（→ party-system.md） |
| `src/models/GameStateManager.ts` | フラグ管理（→ game-state-system.md） |
| `src/services/SaveManager.ts` | セーブ永続化（→ save-system.md） |
| `src/hooks/useGameEngine.ts` | React統合フック（→ ui-components.md） |
| `src/data/maps.ts` | マップ定義（→ map-system.md） |
| `src/data/partyMembers.ts` | メンバー定義（→ game-data.md） |
