# 設計書: NPC_DEFINITIONS を data/ に移動

## 現状の問題

`types/npc.ts` が型定義（90行）とゲームデータ（300行）を同居させている。
型ファイルを import するだけで全 NPC のセリフデータが読み込まれる。

## 方針

`NPC_DEFINITIONS` を `data/npcDefinitions.ts` に移動。型定義は `types/npc.ts` に残す。

## 変更ファイル

### 1. `src/data/npcDefinitions.ts`（新規）

`NPC_DEFINITIONS` 配列と関連 import を移動:

```typescript
import { NPCDefinition } from '../types/npc';
import { ItemFactory } from '../models/items/ItemFactory';
import { ITEM_IDS } from './itemIds';

export const NPC_DEFINITIONS: NPCDefinition[] = [ ... ];
```

### 2. `src/types/npc.ts`

- `NPC_DEFINITIONS` 定数と `ItemFactory`/`ITEM_IDS` の import を削除
- 型定義のみ残す（~90行）

### 3. `src/models/NPC.ts`

import 元を変更:
```typescript
// Before
import { NPC_DEFINITIONS } from '../types/game';
// After
import { NPC_DEFINITIONS } from '../data/npcDefinitions';
```

### 4. `src/engine/MapManager.ts`

同様に import 元を変更。

## テスト

既存の DialogueEngine.test.ts, GameEngine.test.ts, MapManager.test.ts で検証。
NPC_DEFINITIONS の中身は変わらないため新規テスト不要。
