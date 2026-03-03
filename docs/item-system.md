# アイテムシステム設計ドキュメント

## 概要

本ゲームのアイテムシステムはオブジェクト指向設計を採用しており、各アイテムが自身の使用条件・効果を内包しています。これにより、アイテム追加時のコード変更箇所を最小限に抑え、拡張性を確保しています。

## アーキテクチャ

```
src/models/items/
├── index.ts          # エクスポート
├── Item.ts           # 抽象基底クラス
├── HealItem.ts       # HP回復アイテム
├── CureItem.ts       # 状態異常治療アイテム
├── DamageItem.ts     # ダメージアイテム
├── ValuableItem.ts   # 貴重品
└── ItemFactory.ts    # アイテム生成ファクトリー
```

## クラス図

```
                    ┌─────────────────┐
                    │   Item (抽象)    │
                    ├─────────────────┤
                    │ id: string      │
                    │ name: string    │
                    │ description     │
                    │ type: ItemType  │
                    ├─────────────────┤
                    │ canUseInMenu()  │
                    │ canUseInBattle()│
                    │ canUse(context) │
                    │ use(context)    │
                    │ isTargetEnemy() │
                    │ isTargetAlly()  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   HealItem    │  │   CureItem    │  │  DamageItem   │
├───────────────┤  ├───────────────┤  ├───────────────┤
│ healAmount    │  │ cureEffect    │  │ damage        │
└───────────────┘  └───────────────┘  └───────────────┘
                            │
                            ▼
                   ┌───────────────┐
                   │ ValuableItem  │
                   ├───────────────┤
                   │ (使用不可)     │
                   └───────────────┘
```

## 基底クラス: Item

### インターフェース

```typescript
// アイテム使用時のコンテキスト情報
interface ItemUseContext {
  targetHp: number;           // 対象の現在HP
  targetMaxHp: number;        // 対象の最大HP
  targetStatusEffects: string[]; // 対象の状態異常リスト
  isInBattle: boolean;        // 戦闘中かどうか
}

// アイテム使用結果
interface ItemUseResult {
  success: boolean;
  message: string;
  healedAmount?: number;      // 回復量（HealItem用）
  damageDealt?: number;       // ダメージ量（DamageItem用）
  curedEffect?: string;       // 治療した状態異常（CureItem用）
}

// アイテムタイプ
type ItemType = 'heal' | 'cure' | 'damage' | 'buff' | 'valuable';
```

### 抽象メソッド

| メソッド | 説明 |
|---------|------|
| `canUseInMenu()` | メニュー画面で使用可能か |
| `canUseInBattle()` | 戦闘中に使用可能か |
| `canUse(context)` | 特定の対象に使用可能か |
| `use(context)` | アイテムを使用し結果を返す |
| `getCannotUseReason(context)` | 使用不可の理由メッセージ |

### デフォルト実装メソッド

| メソッド | デフォルト値 | 説明 |
|---------|-------------|------|
| `isTargetEnemy()` | `false` | 敵に使用するアイテムか |
| `isTargetAlly()` | `false` | 味方に使用するアイテムか |
| `getInfo()` | - | シリアライズ用情報を取得 |

## 具象クラス

### HealItem（HP回復）

```typescript
class HealItem extends Item {
  readonly type = 'heal';
  readonly healAmount: number;

  canUseInMenu() { return true; }
  canUseInBattle() { return true; }

  canUse(context) {
    return context.targetHp < context.targetMaxHp;
  }

  use(context) {
    const healed = Math.min(this.healAmount, context.targetMaxHp - context.targetHp);
    return { success: true, message: `HPが${healed}回復した！`, healedAmount: healed };
  }
}
```

**使用例**: ポーション（HP30回復）

### CureItem（状態異常治療）

```typescript
class CureItem extends Item {
  readonly type = 'cure';
  readonly cureEffect: string;  // 'poison' | 'influenza' など

  canUseInMenu() { return true; }
  canUseInBattle() { return true; }

  canUse(context) {
    return context.targetStatusEffects.includes(this.cureEffect);
  }

  use(context) {
    return { success: true, message: `${effectName}が治った！`, curedEffect: this.cureEffect };
  }
}
```

**使用例**: 解毒剤（毒を治療）、カロナール（インフルエンザを治療）

### DamageItem（敵へダメージ）

```typescript
class DamageItem extends Item {
  readonly type = 'damage';
  readonly damage: number;

  canUseInMenu() { return false; }  // メニューでは使用不可
  canUseInBattle() { return true; }

  isTargetEnemy() { return true; }  // 敵が対象

  use(context) {
    return { success: true, message: `${this.damage}のダメージ！`, damageDealt: this.damage };
  }
}
```

**使用例**: ばくだん（敵に50ダメージ）

### ValuableItem（貴重品）

```typescript
class ValuableItem extends Item {
  readonly type = 'valuable';

  canUseInMenu() { return false; }
  canUseInBattle() { return false; }

  canUse() { return false; }

  use() {
    return { success: false, message: 'このアイテムは使用できません' };
  }
}
```

**使用例**: カメラ（コレクション用）

## ItemFactory

アイテムIDからアイテムインスタンスを生成するファクトリークラス。

```typescript
class ItemFactory {
  private static cache: Map<string, Item> = new Map();

  static create(id: string): Item {
    // キャッシュがあれば返す
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    // IDに対応するアイテムを生成
    const definition = ITEM_DEFINITIONS.find(d => d.id === id);
    const item = this.createFromDefinition(definition);

    this.cache.set(id, item);
    return item;
  }
}
```

### 登録済みアイテム一覧

| ID | 名前 | タイプ | 効果 |
|----|------|--------|------|
| `potion` | ポーション | heal | HP 30回復 |
| `antidote` | 解毒剤 | cure | 毒を治療 |
| `calonal` | カロナール | cure | インフルエンザを治療 |
| `tamiflu` | タミフル | cure | インフルエンザを治療 |
| `bomb` | ばくだん | damage | 敵に50ダメージ |
| `camera` | カメラ | valuable | 使用不可 |

## 新しいアイテムの追加方法

### 1. 既存タイプのアイテム追加

`ItemFactory.ts` の `ITEM_DEFINITIONS` に定義を追加するだけ：

```typescript
const ITEM_DEFINITIONS = [
  // ... 既存のアイテム

  // 新しい回復アイテム
  {
    id: 'super_potion',
    name: 'スーパーポーション',
    description: 'HPを100回復する',
    type: 'heal',
    value: 100,
  },

  // 新しいダメージアイテム
  {
    id: 'mega_bomb',
    name: 'メガばくだん',
    description: '敵に200のダメージ',
    type: 'damage',
    value: 200,
  },
];
```

### 2. 新しいアイテムタイプの追加

#### Step 1: 新しいクラスを作成

```typescript
// src/models/items/BuffItem.ts
import { Item, ItemType, ItemUseContext, ItemUseResult } from './Item';

export class BuffItem extends Item {
  public readonly type: ItemType = 'buff';
  public readonly buffType: string;
  public readonly duration: number;

  constructor(id: string, name: string, description: string, buffType: string, duration: number) {
    super(id, name, description);
    this.buffType = buffType;
    this.duration = duration;
  }

  canUseInMenu(): boolean {
    return false;  // 戦闘中のみ
  }

  canUseInBattle(): boolean {
    return true;
  }

  canUse(_context: ItemUseContext): boolean {
    return true;
  }

  use(_context: ItemUseContext): ItemUseResult {
    return {
      success: true,
      message: `${this.buffType}がアップした！`,
    };
  }

  getCannotUseReason(_context: ItemUseContext): string {
    return '';
  }

  isTargetAlly(): boolean {
    return true;
  }
}
```

#### Step 2: エクスポートに追加

```typescript
// src/models/items/index.ts
export { BuffItem } from './BuffItem';
```

#### Step 3: ファクトリーに登録

```typescript
// src/models/items/ItemFactory.ts
import { BuffItem } from './BuffItem';

// ITEM_DEFINITIONS に追加
{
  id: 'attack_up',
  name: '攻撃の薬',
  description: '攻撃力を一時的にアップ',
  type: 'buff',
  buffType: 'attack',
  duration: 3,
},

// createFromDefinition メソッドに分岐を追加
case 'buff':
  return new BuffItem(def.id, def.name, def.description, def.buffType!, def.duration!);
```

#### Step 4: BattleEngine で効果を適用

```typescript
// src/engine/BattleEngine.ts の executeItem メソッド
case 'buff':
  if (item instanceof BuffItem) {
    // バフ効果を適用するロジック
    targetMember.applyBuff(item.buffType, item.duration);
    this.addLog(`${targetMember.name}の${item.buffType}がアップした！`, 'player');
  }
  break;
```

## Partyクラスとの連携

### インベントリ構造

```typescript
interface InventoryEntry {
  item: Item;      // アイテムインスタンス
  quantity: number; // 所持数
}
```

### 主要メソッド

```typescript
class Party {
  // アイテム追加
  addItemById(itemId: string, quantity?: number): void;
  addItem(item: Item, quantity?: number): void;

  // アイテム取得
  getItem(itemId: string): Item | null;
  getItemCount(itemId: string): number;

  // アイテム使用（メニュー用）
  useItemOnMember(itemId: string, target: PartyMember, isInBattle?: boolean): ItemUseResult;

  // アイテム消費（戦闘用）
  consumeItem(itemId: string): Item | null;
}
```

### React用状態

```typescript
interface InventoryItemState {
  item: {
    id: string;
    name: string;
    description: string;
    type: ItemType;
  };
  quantity: number;
  canUseInMenu: boolean;
  canUseInBattle: boolean;
}
```

## 設計の利点

1. **単一責任の原則**: 各アイテムクラスが自身の使用ロジックを持つ
2. **開放閉鎖の原則**: 新しいアイテムタイプの追加が容易
3. **型安全性**: TypeScriptのinstanceofで型を判定可能
4. **テスト容易性**: 各アイテムクラスを個別にテスト可能
5. **コード重複の削減**: 共通ロジックは基底クラスに集約

## 関連ファイル

- `src/models/Party.ts` - インベントリ管理
- `src/engine/BattleEngine.ts` - 戦闘中のアイテム使用
- `src/engine/GameEngine.ts` - フィールドでのアイテム使用
- `src/components/PauseMenu.tsx` - メニューUI
- `src/components/BattleModal.tsx` - 戦闘UI
- `src/types/party.ts` - React用型定義
