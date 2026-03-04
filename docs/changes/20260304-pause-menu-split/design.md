# 設計書: PauseMenu コンポーネント分割

## 現状の問題

`PauseMenu.tsx` が 585 行で以下の全責務を担当:
- メインメニュー画面
- アイテム画面
- 装備画面（slots / select の2サブビュー）
- ステータス詳細画面
- セーブ/ロード画面への遷移
- メンバーカード描画（`renderMemberCard` — 既存 `ui/MemberCard` との重複）
- 装備可能アイテムのフィルタリング（`getEquippableItems` — IDの文字列パターンマッチ）
- メッセージタイマー管理

### 具体的な問題点

1. **コンポーネント重複**: `renderMemberCard` (73-145行) が独自に HP/MP バー・状態異常バッジを描画しているが、`ui/MemberCard` + `ui/StatusBar` が既に同等の機能を持つ
2. **ロジックの埋め込み**: `getEquippableItems` (253-269行) がアイテムIDの文字列パターン (`id.includes('sword')`) でスロット判定。脆く、テストもできない
3. **1ファイルに5画面**: メインメニュー・アイテム・装備・ステータス・セーブ/ロードが全て同一コンポーネント内の render 関数

## 方針

PauseMenu をビュー切替のルーターとして残し、各画面をサブコンポーネントに分割する。テスト対象のロジックは各コンポーネントファイル内で export する。

## 分割後の構成

```
src/components/
  PauseMenu.tsx              # ルーター（view 切替 + 共通 state）~60行
  pause/
    MainMenu.tsx             # メインメニュー画面 ~50行
    ItemsPanel.tsx           # アイテム使用画面 ~60行
    EquipmentPanel.tsx       # 装備画面（slots + select）~100行
    StatusPanel.tsx          # ステータス詳細画面 ~80行
    PanelLayout.tsx          # 左右分割レイアウト共通枠
    MemberSidebar.tsx        # メンバー選択サイドバー（3画面で共有）
    index.ts                 # re-export
```

### パネル間の共通コンポーネント

#### PanelLayout — 左右分割レイアウト

全画面（main, items, equip, status）で繰り返されている左右分割構造を共通化:

```tsx
<PanelLayout
  left={{ title: 'アイテム', wide: true, children: <ItemList /> }}
  right={{ title: '使用対象', children: <MemberSidebar /> }}
  onBack={onBack}
  message={message}
/>
```

- `pause-split-layout` + `pause-left-panel` + `pause-right-panel` の組み立て
- `panel-title` の描画
- `pause-message` の表示（オプション）
- `pause-back-btn` の配置（オプション）

#### MemberSidebar — メンバー選択

items（使用対象）、equip（装備者）、status（メンバー）の3画面で同じパターン:

```tsx
<MemberSidebar
  members={party.members}
  selectedIndex={selectedMemberIndex}
  onSelect={setSelectedMemberIndex}
  display="hp"      // "hp" → "HP 80/100", "class" → "戦士"
/>
```

- `target-member-card` / `status-member-btn` を統一
- `display` prop で表示形式を切り替え

### 既存コンポーネントの活用

- `renderMemberCard` → `ui/MemberCard` に統一（削除）
- HP/MP バー → `ui/StatusBar` を利用（既に MemberCard 内で使用中）

### ロジックの export

各パネル内で使うロジックは同一ファイルから named export する:

```typescript
// EquipmentPanel.tsx
export function getEquippableItems(
  slot: EquipmentSlot,
  inventory: InventoryItemState[]
): InventoryItemState[] { ... }

// テストは EquipmentPanel.test.ts から import
```

共有ロジックが必要になった時点で `pause/helpers.ts` を追加する（先行して作らない）。

## 各ファイルの責務

### PauseMenu.tsx（ルーター）

```typescript
type MenuView = 'main' | 'items' | 'equip' | 'status' | 'save' | 'load';

export function PauseMenu(props: PauseMenuProps) {
  const [view, setView] = useState<MenuView>('main');
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0);

  switch (view) {
    case 'main':    return <MainMenu ... onNavigate={setView} />;
    case 'items':   return <ItemsPanel ... onBack={() => setView('main')} />;
    case 'equip':   return <EquipmentPanel ... onBack={() => setView('main')} />;
    case 'status':  return <StatusPanel ... onBack={() => setView('main')} />;
    case 'save':    return <SaveLoadModal mode="save" ... />;
    case 'load':    return <SaveLoadModal mode="load" ... />;
  }
}
```

- `view` と `selectedMemberIndex` の state を持ち、子に渡す
- 各画面固有の state は各パネル内で管理

### MainMenu.tsx

- メニューボタン一覧（とじる / アイテム / そうび / つよさ / セーブ / ロード / タイトルへ）
- ホバー時の説明文表示
- 所持金・アイテム数の表示
- パーティーメンバー一覧（`ui/MemberCard` を使用）

### ItemsPanel.tsx

- アイテム一覧表示
- 使用対象メンバー選択
- アイテム使用 → メッセージ表示（タイマー付き）

### EquipmentPanel.tsx

- 装備スロット表示 (slots サブビュー)
- 装備可能アイテム選択 (select サブビュー)
- 装備/解除ハンドラ
- `getEquippableItems` ロジック（export）

### StatusPanel.tsx

- メンバー選択
- 基本情報・ステータス・装備・スキル・状態異常の詳細表示

## getEquippableItems の改善

現状はアイテムIDの文字列パターンで装備スロットを判定している:

```typescript
// 現状（脆い）
if (slot === 'weapon') {
  return id.includes('sword') || id.includes('staff');
}
```

EquipmentItem が `slot` プロパティを持つべきだが、型定義の変更が必要。今回のスコープでは:

1. **最低限**: 関数を export してテスト可能にする
2. **推奨**: EquipmentItem / ItemDefinitionData に `equipSlot: EquipmentSlot` を追加し、パターンマッチを廃止

推奨案まで対応するかは実装時に判断。

## テスト方針

| ファイル | テスト内容 | 数 |
|---------|-----------|---|
| `EquipmentPanel.test.ts` | `getEquippableItems` のスロットフィルタリング | 3-4 |

他のパネルは props を受けて表示するだけなので、ロジック層のテストで十分カバーされている。

## 影響範囲

- `PauseMenu.tsx` — 分割（大幅変更）
- `PauseMenu.css` — 変更なし（class 名は維持）
- `App.tsx` — 変更なし（PauseMenu の props インターフェースは維持）
- `useGameEngine.ts` — 変更なし

## 実装順序

1. `pause/` ディレクトリ作成、各パネルコンポーネントを切り出し
2. `renderMemberCard` を `ui/MemberCard` に置き換え
3. `PauseMenu.tsx` をルーターに書き換え
4. `getEquippableItems` を export + テスト追加
5. 動作確認（ブラウザで各画面遷移・アイテム使用・装備変更）
