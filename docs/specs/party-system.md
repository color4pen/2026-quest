# パーティーシステム設計ドキュメント

## 概要

パーティーは最大4人のメンバーで構成され、共有リソース（ゴールド・インベントリ）を管理する。各メンバーは独立したHP/MP/レベル/装備/状態異常を持つ。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                        Party                             │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ members[]   │  │  _gold   │  │    inventory     │   │
│  │ PartyMember │  │  Gold    │  │    Inventory     │   │
│  └──────┬──────┘  └──────────┘  └──────────────────┘   │
│         │                                                │
│  ┌──────┴──────────────────────────────────────────┐    │
│  │ PartyMember                                      │    │
│  │  _hp: HitPoints  _mp: ManaPoints               │    │
│  │  _level  _xp  _attack  _baseDefense             │    │
│  │  _skills[]  _isDefending                        │    │
│  │  equipment: { weapon, armor, accessory }        │    │
│  │  statusEffects[]                                │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Party クラス

### メンバー管理

```typescript
class Party {
  addMember(definition: PartyMemberDefinition): boolean;  // 最大4人、重複不可
  removeMember(memberId: string): PartyMember | null;
  getMember(index: number): PartyMember | null;
  getMemberById(id: string): PartyMember | null;
  getMembers(): PartyMember[];
  getAliveMembers(): PartyMember[];
  getLeader(): PartyMember | null;  // 先頭メンバー
  isFull(): boolean;
  isAllDead(): boolean;
}
```

### 共有リソース

```typescript
class Party {
  // ゴールド（Gold値オブジェクト）
  getGold(): number;
  addGold(amount: number): void;
  spendGold(amount: number): boolean;

  // インベントリ（Inventoryクラスに委譲）
  getItem(itemId: string): Item | null;
  addItemById(itemId: string, quantity?: number): void;
  addItem(item: Item, quantity?: number): void;
  getItemCount(itemId: string): number;

  // アイテム使用
  useItemOnMember(itemId: string, target: PartyMember, isInBattle?: boolean): ItemUseResult;
  consumeItem(itemId: string): Item | null;
}
```

### 装備管理

```typescript
class Party {
  equipItem(memberId: string, itemId: string): { success: boolean; message: string };
  unequipItem(memberId: string, slot: EquipmentSlot): { success: boolean; message: string };
  getEquippableItems(): EquipmentItem[];
  getEquippableItemsForSlot(slot: EquipmentSlot): EquipmentItem[];
}
```

装備フロー:
1. インベントリから装備品を取り出す
2. メンバーに装備（`member.equip(item)`）
3. 以前の装備があればインベントリに戻す

### パーティー全体操作

```typescript
class Party {
  recoverAllAfterBattle(): void;  // 全員のMP少し回復 + 防御解除
  fullHealAll(): void;            // 全員全回復（宿屋用）
  resetAllDefend(): void;         // 全員の防御状態リセット
  reset(): void;                  // ゲームリセット
}
```

## PartyMember クラス

### 読み取り専用プロパティ

```typescript
readonly id: string;
readonly name: string;
readonly memberClass: PartyMemberClass;  // 'engineer' | 'warrior' | 'mage' | 'healer'
readonly image?: string;
```

### プライベートフィールド + getter

```typescript
private _hp: HitPoints;       // get hp / get maxHp
private _mp: ManaPoints;      // get mp / get maxMp
private _level: number;       // get level
private _xp: number;          // get xp
private _xpToNext: number;    // get xpToNext
private _attack: number;      // get attack
private _isDefending: boolean; // get isDefending
private _baseDefense: number;  // get baseDefense
private _skills: SkillDefinition[]; // get skills（コピーを返す）
```

### 戦闘関連

```typescript
calculateAttackDamage(): number;           // 通常攻撃ダメージ（装備込み）
calculateSkillDamage(skill): number;       // スキルダメージ（装備込み）
takeDamage(amount: number): number;        // 防御力・防御状態を考慮
takeDamageRaw(amount: number): void;       // 直接ダメージ（状態異常用）
heal(amount: number): number;              // 装備込み最大HP上限
useMp(amount: number): boolean;            // MP消費（不足時false）
restoreMp(amount: number): number;         // 装備込み最大MP上限
canUseSkill(skill): boolean;
defend(): void;
resetDefend(): void;
isDead(): boolean;
isAlive(): boolean;
```

### レベルアップ

```typescript
gainXp(amount: number): boolean;  // XP獲得、レベルアップ時true
```

レベルアップ時:
- レベル+1
- 余剰XPを繰り越し
- 次レベルXP = 前回 × 1.5（`DEFAULT_LEVEL_UP_BONUS.xpMultiplier`）
- maxHp / maxMp / attack が `levelUpBonus` 分増加
- HP/MP 全回復

### 装備による実効ステータス

```typescript
getEffectiveAttack(): number;   // 基礎攻撃力 + 装備ボーナス
getEffectiveDefense(): number;  // 基礎防御力 + 装備ボーナス
getEffectiveMaxHp(): number;    // 基礎maxHP + 装備ボーナス
getEffectiveMaxMp(): number;    // 基礎maxMP + 装備ボーナス
```

内部で `EquipmentStatBlock.sum()` により全装備スロットのボーナスを合算。

### セーブ/ロード

```typescript
restoreState(hp, mp, level, xp, xpToNext, baseMaxHp, baseMaxMp, baseAttack, baseDefense): void;
```

number を受け取り、内部で値オブジェクトに変換する。

## Inventory クラス

### データ構造

```typescript
interface InventoryEntry {
  item: Item;       // アイテムインスタンス
  quantity: number;  // 所持数
}

// 内部: Map<string, InventoryEntry> （キー = アイテムID）
```

### 主要メソッド

| メソッド | 説明 |
|---------|------|
| `addById(itemId, quantity)` | IDで追加（ItemFactoryで生成） |
| `add(item, quantity)` | Itemオブジェクトで追加 |
| `consume(itemId)` | 1つ消費、0になったらエントリ削除 |
| `remove(itemId, quantity)` | 数量指定で削除 |
| `getItem(itemId)` | アイテム取得 |
| `getQuantity(itemId)` | 所持数 |
| `has(itemId)` | 所持しているか |
| `getEquipmentItems()` | 装備品一覧 |
| `getEquipmentForSlot(slot)` | 指定スロットの装備品一覧 |
| `getBattleItems()` | 戦闘で使えるアイテム一覧 |
| `getMenuItems()` | メニューで使えるアイテム一覧 |

## React用状態

### PartyState

```typescript
interface PartyState {
  members: PartyMemberState[];
  gold: number;
  inventory: InventoryItemState[];
}
```

### PartyMemberState

```typescript
interface PartyMemberState {
  id: string;
  name: string;
  class: PartyMemberClass;
  image?: string;
  hp: number;
  maxHp: number;           // 装備込み
  mp: number;
  maxMp: number;           // 装備込み
  level: number;
  xp: number;
  xpToNext: number;
  attack: number;          // 装備込み
  defense: number;         // 装備込み
  skills: SkillDefinition[];
  isAlive: boolean;
  isDefending: boolean;
  isPoisoned: boolean;     // 後方互換性用
  statusEffects: StatusEffectInfo[];
  equipment: EquipmentSlotState;
}
```

## 定数

```typescript
const MAX_PARTY_SIZE = 4;
const DEFAULT_LEVEL_UP_BONUS = {
  hp: 20, mp: 10, attack: 5, xpMultiplier: 1.5,
};
```

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/models/Party.ts` | パーティー管理 |
| `src/models/PartyMember.ts` | 個別メンバー |
| `src/models/Inventory.ts` | インベントリ管理 |
| `src/types/party.ts` | 型定義・定数 |
| `src/data/partyMembers.ts` | メンバー定義データ |
| `src/data/gameConfig.ts` | 初期インベントリ・ゴールド |
