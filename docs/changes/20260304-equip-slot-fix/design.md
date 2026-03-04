# 設計書: getEquippableItems の equipSlot 化

## 現状の問題

`getEquippableItems` がアイテムIDの文字列パターンで装備スロットを判定している:

```typescript
if (slot === 'weapon') {
  return id.includes('sword') || id.includes('staff');
} else if (slot === 'armor') {
  return id.includes('armor') || id.includes('robe');
}
```

新しい装備品（例: `battle_axe`）を追加するたびにこの関数を修正する必要があり、脆い。

## 既存の仕組み

- `EquipmentItem` クラスは `public readonly slot: EquipmentSlot` を持つ
- `ItemDefinitionData` は `slot?: EquipmentSlot` を持つ
- `Party.getEquippableItemsForSlot()` はモデル層で `item.slot` を使っている

**問題は `InventoryItemState`（React 用の状態型）に `slot` が含まれていないこと。**

## 方針

`InventoryItemState.item` に `equipSlot?: EquipmentSlot` を追加し、`Inventory.getState()` で値を設定する。

## 変更ファイル

### 1. `src/types/party.ts` — 型定義追加

```typescript
export interface InventoryItemState {
  item: {
    id: string;
    name: string;
    description: string;
    type: ItemType;
    equipSlot?: EquipmentSlot;  // 追加
  };
  quantity: number;
  canUseInMenu: boolean;
  canUseInBattle: boolean;
}
```

### 2. `src/models/Inventory.ts` — getState() で slot を含める

```typescript
getState(): InventoryState[] {
  return this.getAll().map(entry => ({
    item: {
      ...entry.item.getInfo(),
      equipSlot: entry.item instanceof EquipmentItem ? entry.item.slot : undefined,
    },
    quantity: entry.quantity,
    canUseInMenu: entry.item.canUseInMenu(),
    canUseInBattle: entry.item.canUseInBattle(),
  }));
}
```

### 3. `src/components/pause/EquipmentPanel.tsx` — パターンマッチ廃止

```typescript
export function getEquippableItems(
  slot: EquipmentSlot,
  inventory: InventoryItemState[],
): InventoryItemState[] {
  return inventory.filter(inv => inv.item.equipSlot === slot);
}
```

### 4. `src/components/pause/EquipmentPanel.test.ts` — テスト更新

ファクトリ関数に `equipSlot` を追加し、IDではなくスロットで判定されることを検証。

## 影響範囲

- `BattleModal.tsx` — `InventoryItemState` を参照するが `equipSlot` は使わない。影響なし
- `ItemsPanel.tsx` — 同上
- `PauseMenu.tsx` — 同上

## テスト

既存の `EquipmentPanel.test.ts` を更新。テスト内容は変わらず、ファクトリに `equipSlot` を追加するのみ。
