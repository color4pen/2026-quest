# ゲームデータ定義ドキュメント

## 概要

ゲーム開始時の初期状態・キャラクター定義・スキル定義・アイテムID定数をデータファイルとして管理する。ロジックとデータを分離し、バランス調整やコンテンツ追加をデータ変更のみで行えるようにしている。

## アーキテクチャ

```
src/data/
├── gameConfig.ts      # 初期インベントリ・ゴールド
├── itemIds.ts         # アイテムID定数
├── partyMembers.ts    # パーティーメンバー定義
├── skills.ts          # スキル定義
├── stateKeys.ts       # ゲーム状態キー（→ game-state-system.md）
└── maps.ts            # マップ定義（→ map-system.md）
```

## 初期設定（gameConfig.ts）

### 初期インベントリ

```typescript
const INITIAL_INVENTORY = [
  { itemId: 'potion',        quantity: 3 },
  { itemId: 'bomb',          quantity: 2 },
  { itemId: 'calonal',       quantity: 10 },
  { itemId: 'tamiflu',       quantity: 10 },
  { itemId: 'antidote',      quantity: 3 },
  { itemId: 'wooden_sword',  quantity: 1 },
  { itemId: 'leather_armor', quantity: 1 },
  { itemId: 'camera',        quantity: 1 },
];
```

### 初期ゴールド

```typescript
const INITIAL_GOLD = 100;
```

## アイテムID（itemIds.ts）

マジックストリングを避けるための定数定義。

```typescript
const ITEM_IDS = {
  // 回復アイテム
  POTION: 'potion',
  HI_POTION: 'hi_potion',
  CALONAL: 'calonal',
  ELIXIR: 'elixir',

  // ダメージアイテム
  BOMB: 'bomb',

  // 治療アイテム
  TAMIFLU: 'tamiflu',
  ANTIDOTE: 'antidote',

  // 貴重品
  CAMERA: 'camera',

  // 武器
  WOODEN_SWORD: 'wooden_sword',
  IRON_SWORD: 'iron_sword',
  STEEL_SWORD: 'steel_sword',
  MAGIC_STAFF: 'magic_staff',

  // 防具
  LEATHER_ARMOR: 'leather_armor',
  IRON_ARMOR: 'iron_armor',
  STEEL_ARMOR: 'steel_armor',
  MAGE_ROBE: 'mage_robe',

  // 装飾品
  POWER_RING: 'power_ring',
  GUARD_RING: 'guard_ring',
  LIFE_PENDANT: 'life_pendant',
  MANA_PENDANT: 'mana_pendant',
} as const;

type ItemId = typeof ITEM_IDS[keyof typeof ITEM_IDS];
```

## パーティーメンバー定義（partyMembers.ts）

### 初期メンバー

```typescript
const INITIAL_PARTY_MEMBER: PartyMemberDefinition = {
  id: 'engineer',
  name: 'せきくん',
  class: 'engineer',
  image: '/assets/images/characters/engineer.jpg',
  baseStats: { hp: 100, maxHp: 100, mp: 30, maxMp: 30, attack: 10 },
  skills: ENGINEER_SKILLS,
  levelUpBonus: { hp: 20, mp: 10, attack: 5 },
};
```

### 仲間キャラクター

| ID | 名前 | クラス | HP | MP | 攻撃 | 特徴 |
|----|------|--------|-----|-----|------|------|
| `warrior` | ガルド | 戦士 | 130 | 10 | 15 | HP・攻撃力特化 |
| `mage` | ミーナ | 魔法使い | 60 | 50 | 5 | MP・魔法特化 |
| `healer` | リリア | 僧侶 | 70 | 60 | 6 | MP・回復特化 |

### ヘルパー関数

```typescript
function getAllPartyMemberDefinitions(): PartyMemberDefinition[];
function getPartyMemberDefinition(id: string): PartyMemberDefinition | null;
```

## スキル定義（skills.ts）

### 全スキル一覧

| ID | 名前 | MP | 倍率 | タイプ | 対象 |
|----|------|-----|------|--------|------|
| `power_strike` | 強打 | 5 | 1.5x | attack | enemy |
| `war_cry` | 雄叫び | 8 | 1.8x | attack | enemy |
| `flame_slash` | 炎斬り | 12 | 2.0x | attack | enemy |
| `fire` | ファイア | 6 | 1.8x | attack | enemy |
| `blizzard` | ブリザド | 10 | 2.2x | attack | enemy |
| `thunder` | サンダー | 15 | 2.5x | attack | enemy |
| `holy` | ホーリー | 8 | 1.6x | attack | enemy |
| `heal` | ヒール | 5 | 30 | heal | self |
| `cure` | キュア | 12 | 60 | heal | self |

### クラス別スキルセット

| クラス | スキル |
|--------|--------|
| エンジニア | 強打、ヒール、炎斬り |
| 戦士 | 強打、雄叫び |
| 魔法使い | ファイア、ブリザド、サンダー |
| 僧侶 | ヒール、キュア、ホーリー |

### SkillDefinition

```typescript
interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  power: number;           // 攻撃スキル: ダメージ倍率、回復スキル: 回復量
  type: 'attack' | 'heal';
  target: 'enemy' | 'self';
}
```

## 新しいデータの追加方法

### 新アイテム追加

1. `itemIds.ts` に ID 追加
2. `ItemFactory.ts` の `ITEM_DEFINITIONS` に定義追加
3. 必要に応じて `gameConfig.ts` や NPC の `shopItems` に追加

### 新キャラクター追加

1. `skills.ts` にスキルセット追加（必要に応じて新スキルも）
2. `partyMembers.ts` の `RECRUITABLE_MEMBERS` に定義追加

### 新スキル追加

1. `skills.ts` の `SKILL_IDS` と `ALL_SKILLS` に定義追加
2. 該当クラスのスキルセット配列に追加

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/data/gameConfig.ts` | 初期インベントリ・ゴールド |
| `src/data/itemIds.ts` | アイテムID定数 |
| `src/data/partyMembers.ts` | メンバー定義 |
| `src/data/skills.ts` | スキル定義 |
| `src/data/stateKeys.ts` | ゲーム状態キー |
| `src/data/maps.ts` | マップ定義 |
| `src/types/battle.ts` | SkillDefinition 型 |
| `src/types/party.ts` | PartyMemberDefinition 型 |
