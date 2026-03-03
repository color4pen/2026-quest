# 値オブジェクト設計ドキュメント

## 概要

HP/MP/Gold/装備ステータスをプリミティブ型ではなく不変の値オブジェクト（Value Object）で管理しています。ダメージ・回復・消費時のクランプ処理（`Math.max(0, ...)` / `Math.min(max, ...)`）を各クラスに一元化し、外部からの不正な値代入を防ぎます。

## アーキテクチャ

```
src/models/values/
├── index.ts              # エクスポート
├── HitPoints.ts          # HP値オブジェクト
├── ManaPoints.ts         # MP値オブジェクト
├── Gold.ts               # ゴールド値オブジェクト
└── EquipmentStatBlock.ts # 装備ステータスブロック
```

## 設計原則

- **不変（Immutable）**: 全メソッドが新しいインスタンスを返す。既存オブジェクトを変更しない
- **クランプ一元化**: `Math.max(0, ...)` 等のガード処理が値オブジェクト内に閉じる
- **失敗を型で表現**: 残量不足時は `null` を返す（例: `ManaPoints.use()`, `Gold.spend()`）
- **後方互換性**: 利用側は getter で `number` を受け取るため、React の State 型は変更不要

## クラス図

```
┌───────────────────────┐  ┌───────────────────────┐
│      HitPoints        │  │      ManaPoints        │
├───────────────────────┤  ├───────────────────────┤
│ +current: number      │  │ +current: number      │
│ +max: number          │  │ +max: number          │
├───────────────────────┤  ├───────────────────────┤
│ +create(max)          │  │ +create(max)          │
│ +of(current, max)     │  │ +of(current, max)     │
│ +damage(amount)       │  │ +use(amount): T|null  │
│ +heal(amount)         │  │ +restore(amount)      │
│ +withMax(newMax)      │  │ +withMax(newMax)      │
│ +fullRestore()        │  │ +fullRestore()        │
│ +isDead: boolean      │  │ +canUse(amount)       │
│ +isAlive: boolean     │  └───────────────────────┘
│ +isFull: boolean      │
└───────────────────────┘

┌───────────────────────┐  ┌───────────────────────────┐
│        Gold           │  │    EquipmentStatBlock      │
├───────────────────────┤  ├───────────────────────────┤
│ +amount: number       │  │ +attack: number           │
├───────────────────────┤  │ +defense: number          │
│ +of(amount)           │  │ +maxHp: number            │
│ +add(value)           │  │ +maxMp: number            │
│ +spend(value): T|null │  ├───────────────────────────┤
│ +canAfford(price)     │  │ +ZERO: EquipmentStatBlock │
└───────────────────────┘  │ +fromEquipmentStats(s)    │
                           │ +add(other)               │
                           │ +sum(...blocks)            │
                           └───────────────────────────┘
```

## HitPoints

HP（現在値と最大値）を管理する値オブジェクト。

```typescript
class HitPoints {
  readonly current: number;
  readonly max: number;

  /** max HP で満タン状態を生成 */
  static create(max: number): HitPoints;

  /** 指定 current/max で生成（current は 0 以上にクランプ） */
  static of(current: number, max: number): HitPoints;

  /** ダメージを受けた新しい HitPoints を返す（0 以上にクランプ） */
  damage(amount: number): HitPoints;

  /** 回復した新しい HitPoints を返す（max 以下にクランプ） */
  heal(amount: number): HitPoints;

  /** max を変更した新しい HitPoints を返す（レベルアップ時等） */
  withMax(newMax: number): HitPoints;

  /** 全回復した新しい HitPoints を返す（current = max） */
  fullRestore(): HitPoints;

  get isDead(): boolean;   // current <= 0
  get isAlive(): boolean;  // current > 0
  get isFull(): boolean;   // current >= max
}
```

### 使用箇所

- `PartyMember`: `private _hp: HitPoints` として保持。getter `hp` / `maxHp` で number を返す
- `Enemy`: `private _hp: HitPoints` として保持。`takeDamage()` / `isDead()` に利用

## ManaPoints

MP（現在値と最大値）を管理する値オブジェクト。

```typescript
class ManaPoints {
  readonly current: number;
  readonly max: number;

  /** max MP で満タン状態を生成 */
  static create(max: number): ManaPoints;

  /** 指定 current/max で生成（current は 0 以上にクランプ） */
  static of(current: number, max: number): ManaPoints;

  /** MP を消費した新しい ManaPoints を返す。足りなければ null */
  use(amount: number): ManaPoints | null;

  /** MP を回復した新しい ManaPoints を返す（max 以下にクランプ） */
  restore(amount: number): ManaPoints;

  /** max を変更した新しい ManaPoints を返す */
  withMax(newMax: number): ManaPoints;

  /** 全回復した新しい ManaPoints を返す */
  fullRestore(): ManaPoints;

  /** 指定量を消費可能か */
  canUse(amount: number): boolean;
}
```

### 使用箇所

- `PartyMember`: `private _mp: ManaPoints` として保持。getter `mp` / `maxMp` で number を返す

## Gold

所持金を管理する値オブジェクト。

```typescript
class Gold {
  readonly amount: number;

  /** 指定額で生成（0 以上にクランプ） */
  static of(amount: number): Gold;

  /** ゴールドを加算した新しい Gold を返す */
  add(value: number): Gold;

  /** ゴールドを消費した新しい Gold を返す。足りなければ null */
  spend(value: number): Gold | null;

  /** 指定額を払えるか */
  canAfford(price: number): boolean;
}
```

### 使用箇所

- `Party`: `private _gold: Gold` として保持。`getGold()` で `_gold.amount` を返す

## EquipmentStatBlock

装備品のステータスボーナスを集約する値オブジェクト。

```typescript
class EquipmentStatBlock {
  readonly attack: number;
  readonly defense: number;
  readonly maxHp: number;
  readonly maxMp: number;

  /** ゼロ値 */
  static readonly ZERO: EquipmentStatBlock;

  /** EquipmentStats インターフェースから変換 */
  static fromEquipmentStats(stats: EquipmentStats): EquipmentStatBlock;

  /** 2つのブロックを加算した新しいブロックを返す */
  add(other: EquipmentStatBlock): EquipmentStatBlock;

  /** 複数ブロックを合算（null は無視） */
  static sum(...blocks: (EquipmentStatBlock | null)[]): EquipmentStatBlock;
}
```

### 使用箇所

- `PartyMember.getEquipmentBonus()`: 装備中の全アイテムのステータスを合算
- `PartyMember.getEffectiveMaxHp()` / `getEffectiveMaxMp()` / `getEffectiveAttack()` / `getEffectiveDefense()`: 基礎値 + 装備ボーナスの計算

### 計算例

```typescript
// PartyMember 内部
private getEquipmentBonus(): EquipmentStatBlock {
  return EquipmentStatBlock.sum(
    this.weapon?.toStatBlock() ?? null,
    this.armor?.toStatBlock() ?? null,
    this.accessory?.toStatBlock() ?? null,
  );
}

public getEffectiveMaxHp(): number {
  return this._hp.max + this.getEquipmentBonus().maxHp;
}
```

## 利用パターン

### ダメージ処理

```typescript
// PartyMember
public takeDamage(rawDamage: number): { damage: number; isDead: boolean } {
  const defense = this.getEffectiveDefense();
  const multiplier = this._isDefending ? 0.5 : 1.0;
  const damage = Math.max(1, Math.floor((rawDamage - defense) * multiplier));
  this._hp = this._hp.damage(damage);
  return { damage, isDead: this._hp.isDead };
}

// 状態異常からの直接ダメージ（防御計算なし）
public takeDamageRaw(amount: number): void {
  const multiplier = this._isDefending ? 0.5 : 1.0;
  const actualDamage = Math.max(1, Math.floor(amount * multiplier));
  this._hp = this._hp.damage(actualDamage);
}
```

### MP 消費

```typescript
public useMp(amount: number): boolean {
  const newMp = this._mp.use(amount);
  if (newMp === null) return false;
  this._mp = newMp;
  return true;
}
```

### ゴールド消費

```typescript
public spendGold(amount: number): boolean {
  const newGold = this._gold.spend(amount);
  if (newGold === null) return false;
  this._gold = newGold;
  return true;
}
```

### セーブ/ロード

値オブジェクトは内部実装の詳細であり、セーブデータは従来通り number で保存・復元する。

```typescript
// 保存時（PartyMember.getState()）
{ hp: this.hp, maxHp: this.maxHp, mp: this.mp, maxMp: this.maxMp }

// 復元時（PartyMember.restoreState()）
this._hp = HitPoints.of(data.hp, data.maxHp);
this._mp = ManaPoints.of(data.mp, data.maxMp);
```

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/models/values/HitPoints.ts` | HP値オブジェクト |
| `src/models/values/ManaPoints.ts` | MP値オブジェクト |
| `src/models/values/Gold.ts` | ゴールド値オブジェクト |
| `src/models/values/EquipmentStatBlock.ts` | 装備ステータスブロック |
| `src/models/PartyMember.ts` | HitPoints / ManaPoints / EquipmentStatBlock を利用 |
| `src/models/Enemy.ts` | HitPoints を利用 |
| `src/models/Party.ts` | Gold を利用 |
| `src/types/party.ts` | EquipmentStats インターフェース（EquipmentStatBlock の入力元） |
