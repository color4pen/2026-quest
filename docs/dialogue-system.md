# 会話システム設計ドキュメント

## 概要

ノードベースの会話システムを採用しています。各NPCは会話ツリー（DialogueData）を持ち、選択肢による分岐やアクション（ショップを開く、回復する等）をサポートします。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                         NPC                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  DialogueData                                        │   │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐         │   │
│  │  │  Node   │───▶│  Node   │───▶│  Node   │         │   │
│  │  │ (start) │    │ (shop?) │    │ (bye)   │         │   │
│  │  └────┬────┘    └─────────┘    └─────────┘         │   │
│  │       │              ▲                              │   │
│  │       └──────────────┘ (選択肢で分岐)               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DialogueEngine                            │
│  - 現在のノードを追跡                                        │
│  - 選択肢処理                                               │
│  - アクション実行コールバック                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DialogueModal (React)                     │
│  - 会話テキスト表示                                         │
│  - 選択肢ボタン                                             │
│  - NPC画像（あれば）                                        │
└─────────────────────────────────────────────────────────────┘
```

## データ構造

### DialogueData（会話ツリー）

```typescript
interface DialogueData {
  startId: string;           // 開始ノードID
  nodes: DialogueNode[];     // ノードリスト
}
```

### DialogueNode（会話ノード）

```typescript
interface DialogueNode {
  id: string;                 // ノードID
  speaker: string;            // 話者名
  text: string;               // セリフ
  choices?: DialogueChoice[]; // 選択肢（なければ自動進行）
  nextId?: string;            // 選択肢がない場合の次ノード
}
```

### DialogueChoice（選択肢）

```typescript
interface DialogueChoice {
  id: string;
  text: string;               // 選択肢テキスト
  action?: DialogueAction;    // アクション
  nextDialogueId?: string;    // 次のノードID
}
```

### DialogueAction（アクション）

```typescript
type DialogueAction =
  | { type: 'none' }                           // 何もしない
  | { type: 'close' }                          // 会話を閉じる
  | { type: 'open_shop' }                      // ショップを開く
  | { type: 'heal'; cost: number }             // 回復（宿屋）
  | { type: 'give_item'; item: ItemDefinition; quantity: number };  // アイテム付与
```

## DialogueEngine クラス

### コンストラクタ

```typescript
constructor(npc: NPC) {
  this.npc = npc;
  this.currentNode = this.findNode(npc.dialogue.startId);
  this.isComplete = false;
}
```

### コールバック設定

```typescript
setCallbacks(callbacks: {
  onDialogueEnd?: () => void;           // 会話終了時
  onOpenShop?: (npc: NPC) => void;      // ショップを開く時
  onHeal?: (cost: number) => boolean;   // 回復時（成否を返す）
}): void
```

### 選択肢処理

```typescript
selectChoice(choice: DialogueChoice): DialogueResult {
  switch (action.type) {
    case 'close':
      // 会話終了
      this.isComplete = true;
      this.onDialogueEnd?.();
      return { action, shouldClose: true };

    case 'open_shop':
      // ショップを開く
      this.onOpenShop?.(this.npc);
      return { action, shouldClose: true };

    case 'heal':
      // 回復処理（成否で分岐）
      const success = this.onHeal?.(action.cost) ?? false;
      if (success) {
        this.goToNode('healed');
      } else {
        this.goToNode('no_money');
      }
      return { action, shouldClose: false };

    case 'none':
    default:
      // 次のノードへ
      if (choice.nextDialogueId) {
        this.goToNode(choice.nextDialogueId);
      }
      return { action, shouldClose: false };
  }
}
```

### 状態取得

```typescript
interface DialogueState {
  isActive: boolean;
  npcName: string;
  npcType: NPCType;
  npcImage?: string;
  currentNode: DialogueNode | null;
  isComplete: boolean;
}
```

## 会話フロー

```
1. プレイヤーがNPCに話しかける
   │
2. GameEngine.startDialogue(npc) が呼ばれる
   │
3. DialogueEngine が生成される
   │  └─ startId のノードを初期表示
   │
4. DialogueModal が表示される
   │
5. 選択肢をクリック
   │  └─ selectChoice() が呼ばれる
   │
6. アクションに応じて処理
   ├─ close → 会話終了
   ├─ open_shop → ShopModal を開く
   ├─ heal → 成否で分岐
   └─ none → 次のノードへ
   │
7. shouldClose が true なら会話終了
```

## NPC定義例

### 基本的な村人

```typescript
{
  id: 'villager_1',
  name: '村人',
  type: 'villager',
  dialogue: {
    startId: 'start',
    nodes: [
      {
        id: 'start',
        speaker: '村人',
        text: 'こんにちは！ここは平和な村だよ。',
        choices: [
          { id: 'bye', text: 'さようなら', action: { type: 'close' } },
        ],
      },
    ],
  },
}
```

### 商人（ショップ付き）

```typescript
{
  id: 'shopkeeper_1',
  name: '商人',
  type: 'shopkeeper',
  dialogue: {
    startId: 'start',
    nodes: [
      {
        id: 'start',
        speaker: '商人',
        text: 'いらっしゃい！何かお探しかい？',
        choices: [
          { id: 'shop', text: '買い物をする', action: { type: 'open_shop' } },
          { id: 'bye', text: '見てるだけ', action: { type: 'close' } },
        ],
      },
    ],
  },
  shopItems: [
    { item: INITIAL_ITEMS[0], price: 30, stock: -1 },
  ],
}
```

### 宿屋の主人（回復付き）

```typescript
{
  id: 'innkeeper_1',
  name: '宿屋の主人',
  type: 'innkeeper',
  healCost: 20,
  dialogue: {
    startId: 'start',
    nodes: [
      {
        id: 'start',
        speaker: '宿屋の主人',
        text: '一泊20ゴールドで休めるよ。',
        choices: [
          { id: 'rest', text: '泊まる（20G）', action: { type: 'heal', cost: 20 } },
          { id: 'bye', text: 'やめておく', action: { type: 'close' } },
        ],
      },
      {
        id: 'healed',
        speaker: '宿屋の主人',
        text: 'ゆっくり休めたかい？',
        choices: [
          { id: 'bye', text: 'ありがとう', action: { type: 'close' } },
        ],
      },
      {
        id: 'no_money',
        speaker: '宿屋の主人',
        text: 'お金が足りないみたいだね。',
        choices: [
          { id: 'bye', text: '残念...', action: { type: 'close' } },
        ],
      },
    ],
  },
}
```

### 分岐会話（技術者NPC）

```typescript
{
  id: 'developer_npc',
  name: '謎の技術者',
  type: 'villager',
  dialogue: {
    startId: 'start',
    nodes: [
      {
        id: 'start',
        speaker: '謎の技術者',
        text: 'やあ、何か聞きたいことがあるかい？',
        choices: [
          { id: 'topic1', text: '話題A', nextDialogueId: 'topic1' },
          { id: 'topic2', text: '話題B', nextDialogueId: 'topic2' },
          { id: 'bye', text: '興味ない', action: { type: 'close' } },
        ],
      },
      {
        id: 'topic1',
        speaker: '謎の技術者',
        text: '話題Aについての説明...',
        choices: [
          { id: 'more', text: 'もっと詳しく', nextDialogueId: 'topic1_detail' },
          { id: 'back', text: '他の話を聞く', nextDialogueId: 'start' },
        ],
      },
      // ... 続く
    ],
  },
}
```

## 新しいNPCの追加方法

### Step 1: NPC_DEFINITIONS に追加

```typescript
// src/types/npc.ts
{
  id: 'new_npc',
  name: '新しいNPC',
  type: 'villager',
  image: '/assets/images/npcs/new_npc.png',  // オプション
  dialogue: {
    startId: 'start',
    nodes: [
      {
        id: 'start',
        speaker: '新しいNPC',
        text: 'こんにちは！',
        choices: [
          { id: 'bye', text: 'さようなら', action: { type: 'close' } },
        ],
      },
    ],
  },
}
```

### Step 2: マップに配置

```typescript
// マップ定義内
npcs: [
  { id: 'new_npc', x: 5, y: 10 },
]
```

## 新しいアクションの追加方法

### Step 1: DialogueAction に型を追加

```typescript
// src/types/npc.ts
type DialogueAction =
  | { type: 'none' }
  | { type: 'close' }
  | { type: 'open_shop' }
  | { type: 'heal'; cost: number }
  | { type: 'give_item'; item: ItemDefinition; quantity: number }
  | { type: 'recruit'; memberId: string };  // 新しいアクション
```

### Step 2: DialogueEngine で処理を追加

```typescript
// src/engine/DialogueEngine.ts
case 'recruit':
  this.onRecruit?.(action.memberId);
  return { action, shouldClose: true };
```

### Step 3: GameEngine でコールバックを設定

```typescript
// src/engine/GameEngine.ts
this.dialogueEngine.setCallbacks({
  onRecruit: (memberId) => {
    const definition = RECRUITABLE_MEMBERS.find(m => m.id === memberId);
    if (definition) {
      this.party.addMember(definition);
    }
  },
});
```

## ショップシステム

### ShopState

```typescript
interface ShopState {
  isActive: boolean;
  shopName: string;
  items: ShopItem[];
}

interface ShopItem {
  item: ItemDefinition;
  price: number;
  stock: number;  // -1 = 無限
}
```

### 購入処理（GameEngine）

```typescript
public buyItem(shopItem: ShopItem): boolean {
  if (this.party.getGold() < shopItem.price) {
    return false;
  }
  if (shopItem.stock === 0) {
    return false;
  }

  this.party.spendGold(shopItem.price);
  this.party.addItemById(shopItem.item.id);

  if (shopItem.stock > 0) {
    shopItem.stock--;
  }
  return true;
}
```

## 画像サポート

NPC定義に `image` を設定すると、会話モーダルにポートレートが表示されます。

```typescript
{
  id: 'innkeeper_1',
  name: '宿屋の主人',
  type: 'innkeeper',
  image: '/assets/images/npcs/innkeeper.png',  // ポートレート画像
  // ...
}
```

画像がない場合は、ポートレートエリアが非表示になります。

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/engine/DialogueEngine.ts` | 会話ロジック |
| `src/types/npc.ts` | 型定義・NPC定義 |
| `src/components/DialogueModal.tsx` | 会話UI |
| `src/components/ShopModal.tsx` | ショップUI |
| `src/models/NPC.ts` | NPCクラス |
| `src/engine/GameEngine.ts` | 会話開始・終了処理 |
