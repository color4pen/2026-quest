# 設計書: GameEngine 責務分割 (レビュー 2-1)

## 現状の問題

`GameEngine.ts` が約990行で以下の全責務を担当:
- プレイヤー移動・インタラクション
- マップ読み込み・NPC/宝箱/固定敵の配置
- カメラ追従
- エンカウント判定・敵生成
- バトル/会話/ショップの委譲とコールバック
- 宝箱状態キャッシュ
- セーブ/ロード復元
- パーティー管理
- メッセージログ
- Observer パターンの通知

単一責任原則に違反しており、テストが困難。

## 前提条件

- **2-5（ステートマシン導入）を先に実装すること**。フェーズ管理が整理されていないと分割が複雑になる。

## 分割方針

GameEngine をファサードとして残し、内部サブマネージャーに委譲する。React 側（`useGameEngine`）のインターフェースは変更しない。

### 分割後のアーキテクチャ

```
src/engine/
├── GameEngine.ts          # ファサード（委譲のみ、~200行目標）
├── BattleEngine.ts        # 既存（変更なし）
├── DialogueEngine.ts      # 既存（変更なし）
├── CombatCalculator.ts    # 既存（変更なし）
├── MapManager.ts          # 新規: マップ読み込み・宝箱キャッシュ
├── EncounterManager.ts    # 新規: エンカウント判定・敵生成
├── InteractionHandler.ts  # 新規: インタラクション振り分け
└── CameraManager.ts       # 新規: カメラ追従
```

## 各マネージャーの責務

### MapManager

```typescript
class MapManager {
  private currentMapId: string;
  private currentMapDefinition: MapDefinition | null;
  private gameMap: GameMap;
  private npcs: NPC[];
  private treasures: Treasure[];
  private fixedEnemies: Enemy[];
  private treasureStatesCache: Record<string, SavedTreasureData[]>;

  loadMap(mapId, playerX?, playerY?, skipCache?): void;
  cacheTreasureStates(): void;
  applyTreasureStates(): void;
  spawnFixedEnemies(mapDef, leaderLevel, gameStateManager): Enemy[];

  // Getter
  getGameMap(): GameMap;
  getNpcs(): NPC[];
  getTreasures(): Treasure[];
  getFixedEnemies(): Enemy[];
  getCurrentMapId(): string;
  getMapName(): string;
}
```

**移行元**: `loadMap`, `cacheTreasureStates`, `applyTreasureStates`, `spawnFixedEnemies`, `checkSpawnCondition`

### EncounterManager

```typescript
class EncounterManager {
  private debugMode: boolean;

  checkEncounter(gameMap: GameMap, leaderLevel: number): Enemy[] | null;
  isDebugMode(): boolean;

  // private
  createRandomEnemies(enemyIds: string[], leaderLevel: number): Enemy[];
}
```

**移行元**: `checkEncounter`, `isDebugMode`, `createRandomEnemies`

### InteractionHandler

```typescript
class InteractionHandler {
  handleInteraction(
    objects: GameObject[],
    nextPosition: Position,
    callbacks: {
      onDialogue: (npc: NPC) => void;
      onTreasure: (gold: number) => void;
      onBattle: (enemy: Enemy) => void;
    }
  ): { blocked: boolean };
}
```

**移行元**: `move()` 内のインタラクション検出ループ、`getAllInteractableObjects`

### CameraManager

```typescript
class CameraManager {
  private camera: CameraState;

  update(playerX: number, playerY: number, mapWidth: number, mapHeight: number): void;
  getState(): CameraState;
}
```

**移行元**: `updateCamera`

## GameEngine ファサード（分割後）

```typescript
class GameEngine {
  // サブマネージャー
  private mapManager: MapManager;
  private encounterManager: EncounterManager;
  private interactionHandler: InteractionHandler;
  private cameraManager: CameraManager;

  // 既存（そのまま保持）
  private player: Player;
  private party: Party;
  private gameStateManager: GameStateManager;
  private phase: GamePhase;  // 2-5 のステートマシン
  private messages: Message[];
  private listeners: Set<GameEventListener>;

  // 公開メソッド（変更なし）
  move(direction): void;
  selectBattleCommand(cmd): void;
  // ... 他の公開メソッドは全て維持

  // 内部は委譲
  private startBattle(enemies): void;       // BattleEngine 生成 + transitionTo
  private startDialogue(npc): void;         // DialogueEngine 生成 + transitionTo
  private openShop(npc): void;              // ShopState 生成 + transitionTo
}
```

## 影響範囲

### 変更ファイル

| ファイル | 変更内容 |
|---------|----------|
| `src/engine/GameEngine.ts` | 内部ロジックをサブマネージャーに委譲 |
| `src/engine/MapManager.ts` | 新規作成 |
| `src/engine/EncounterManager.ts` | 新規作成 |
| `src/engine/InteractionHandler.ts` | 新規作成 |
| `src/engine/CameraManager.ts` | 新規作成 |

### 変更不要

- `GameEngineState` — 型は維持
- `useGameEngine.ts` — `GameEngine` の公開インターフェースは変更なし
- React コンポーネント — 全て `GameEngineState` 経由
- `BattleEngine`, `DialogueEngine`, `CombatCalculator` — 変更なし
- `SaveManager` — `GameEngine.save/load` の公開APIは維持

## 移行量の見積もり

| マネージャー | 移行行数(概算) | 難易度 |
|-------------|-------------|--------|
| MapManager | ~150行 | 中（宝箱キャッシュの結合が複雑） |
| EncounterManager | ~50行 | 低 |
| InteractionHandler | ~40行 | 低 |
| CameraManager | ~30行 | 低 |
| GameEngine 残り | ~200行（ファサード）+ ~500行（バトル/会話/ショップ委譲） | — |

## 実装順序

1. **CameraManager** を抽出（最も独立性が高い）
2. **EncounterManager** を抽出
3. **InteractionHandler** を抽出
4. **MapManager** を抽出（依存関係が最も複雑）
5. GameEngine を整理、不要な private メソッドを削除
6. `tsc --noEmit` + `npm run build` で検証

## リスク

- セーブ/ロードの `restoreFromSaveData` が MapManager と密結合。復元フローの整理が必要
- `move()` 内で MapManager, InteractionHandler, EncounterManager, CameraManager を順に呼ぶため、依存の受け渡しが煩雑になる可能性
- 分割しすぎるとファイル間の行き来が増え、可読性が下がるリスク。バトル/会話/ショップの委譲コードは GameEngine に残す判断もあり
