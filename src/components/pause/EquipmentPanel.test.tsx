import { render, screen } from '../../test/helpers';
import userEvent from '@testing-library/user-event';
import { createMember, createEquipmentInventoryItem } from '../../test/helpers';
import { EquipmentPanel, getEquippableItems } from './EquipmentPanel';
import { InventoryItemState } from '../../types/party';

describe('EquipmentPanel', () => {
  const defaultMembers = [
    createMember({
      id: 'hero',
      name: '勇者',
      attack: 20,
      defense: 10,
      equipment: {
        weapon: { id: 'sword', name: '鉄の剣', description: '攻撃力+10', type: 'equipment', equipSlot: 'weapon' },
        armor: null,
        accessory: null,
      },
    }),
    createMember({ id: 'mage', name: '魔法使い' }),
  ];

  const defaultInventory: InventoryItemState[] = [
    createEquipmentInventoryItem({
      item: { id: 'steel_sword', name: '鋼の剣', description: '攻撃力+15', type: 'equipment', equipSlot: 'weapon' },
    }),
    createEquipmentInventoryItem({
      item: { id: 'leather_armor', name: '皮の鎧', description: '防御力+5', type: 'equipment', equipSlot: 'armor' },
    }),
  ];

  const defaultProps = {
    inventory: defaultInventory,
    members: defaultMembers,
    selectedMemberIndex: 0,
    onSelectMember: vi.fn(),
    onEquipItem: vi.fn().mockReturnValue({ success: true, message: '装備した！' }),
    onUnequipItem: vi.fn().mockReturnValue({ success: true, message: '外した！' }),
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEquippableItems', () => {
    it('指定スロットに装備可能なアイテムのみを返す', () => {
      const result = getEquippableItems('weapon', defaultInventory);
      expect(result).toHaveLength(1);
      expect(result[0].item.name).toBe('鋼の剣');
    });

    it('該当アイテムがない場合は空配列を返す', () => {
      const result = getEquippableItems('accessory', defaultInventory);
      expect(result).toHaveLength(0);
    });
  });

  describe('基本表示', () => {
    it('「そうび」タイトルが表示される', () => {
      render(<EquipmentPanel {...defaultProps} />);
      expect(screen.getByText('そうび')).toBeInTheDocument();
    });

    it('スロット名が表示される', () => {
      render(<EquipmentPanel {...defaultProps} />);
      expect(screen.getByText('武器')).toBeInTheDocument();
      expect(screen.getByText('防具')).toBeInTheDocument();
      expect(screen.getByText('装飾品')).toBeInTheDocument();
    });

    it('装備中アイテム名が表示される', () => {
      render(<EquipmentPanel {...defaultProps} />);
      expect(screen.getByText('鉄の剣')).toBeInTheDocument();
    });

    it('未装備スロットには「---」が表示される', () => {
      render(<EquipmentPanel {...defaultProps} />);
      const emptySlots = screen.getAllByText('---');
      expect(emptySlots.length).toBe(2); // armor, accessory
    });

    it('ステータスが表示される', () => {
      render(<EquipmentPanel {...defaultProps} />);
      expect(screen.getByText('ステータス')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument(); // attack
      expect(screen.getByText('10')).toBeInTheDocument(); // defense
    });
  });

  describe('装備変更', () => {
    it('「変更」ボタンが表示される', () => {
      render(<EquipmentPanel {...defaultProps} />);
      expect(screen.getByRole('button', { name: '変更' })).toBeInTheDocument();
    });

    it('「変更」をクリックすると装備選択ビューに切り替わる', async () => {
      const user = userEvent.setup();
      render(<EquipmentPanel {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: '変更' }));
      expect(screen.getByText('武器を選択')).toBeInTheDocument();
    });

    it('装備可能アイテムが表示される', async () => {
      const user = userEvent.setup();
      render(<EquipmentPanel {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: '変更' }));
      expect(screen.getByText('鋼の剣')).toBeInTheDocument();
    });

    it('装備可能アイテムがない場合メッセージが表示される', async () => {
      const user = userEvent.setup();
      render(<EquipmentPanel {...defaultProps} inventory={[]} />);

      await user.click(screen.getByRole('button', { name: '変更' }));
      expect(screen.getByText('装備できるアイテムがありません')).toBeInTheDocument();
    });

    it('アイテムを選択するとonEquipItemが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleEquipItem = vi.fn().mockReturnValue({ success: true, message: '装備した！' });
      render(<EquipmentPanel {...defaultProps} onEquipItem={handleEquipItem} />);

      await user.click(screen.getByRole('button', { name: '変更' }));
      await user.click(screen.getByRole('button', { name: '装備' }));
      expect(handleEquipItem).toHaveBeenCalledWith('hero', 'steel_sword');
    });

    it('装備成功後にスロットビューに戻る', async () => {
      const user = userEvent.setup();
      render(<EquipmentPanel {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: '変更' }));
      await user.click(screen.getByRole('button', { name: '装備' }));
      expect(screen.queryByText('武器を選択')).not.toBeInTheDocument();
    });

    it('装備選択で「もどる」をクリックするとスロットビューに戻る', async () => {
      const user = userEvent.setup();
      render(<EquipmentPanel {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: '変更' }));
      expect(screen.getByText('武器を選択')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'もどる' }));
      expect(screen.queryByText('武器を選択')).not.toBeInTheDocument();
    });
  });

  describe('装備解除', () => {
    it('「外す」ボタンが表示される', () => {
      render(<EquipmentPanel {...defaultProps} />);
      expect(screen.getByRole('button', { name: '外す' })).toBeInTheDocument();
    });

    it('「外す」をクリックするとonUnequipItemが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleUnequipItem = vi.fn().mockReturnValue({ success: true, message: '外した！' });
      render(<EquipmentPanel {...defaultProps} onUnequipItem={handleUnequipItem} />);

      await user.click(screen.getByRole('button', { name: '外す' }));
      expect(handleUnequipItem).toHaveBeenCalledWith('hero', 'weapon');
    });
  });

  describe('未装備スロット', () => {
    it('未装備スロットには「装備」ボタンが表示される', () => {
      const members = [
        createMember({
          equipment: { weapon: null, armor: null, accessory: null },
        }),
      ];
      render(<EquipmentPanel {...defaultProps} members={members} />);
      // 3つのスロット全てに「装備」ボタン
      const equipButtons = screen.getAllByRole('button', { name: '装備' });
      expect(equipButtons.length).toBe(3);
    });
  });

  describe('メンバー選択', () => {
    it('「装備者」タイトルが表示される', () => {
      render(<EquipmentPanel {...defaultProps} />);
      expect(screen.getByText('装備者')).toBeInTheDocument();
    });

    it('メンバー名が表示される', () => {
      render(<EquipmentPanel {...defaultProps} />);
      expect(screen.getByText('勇者')).toBeInTheDocument();
      expect(screen.getByText('魔法使い')).toBeInTheDocument();
    });
  });

  describe('メッセージ表示', () => {
    it('装備成功時にメッセージが表示される', async () => {
      const user = userEvent.setup();
      render(<EquipmentPanel {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: '変更' }));
      await user.click(screen.getByRole('button', { name: '装備' }));
      expect(screen.getByText('装備した！')).toBeInTheDocument();
    });
  });

  describe('戻る', () => {
    it('スロットビューで「もどる」をクリックするとonBackが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleBack = vi.fn();
      render(<EquipmentPanel {...defaultProps} onBack={handleBack} />);

      // 一番下の「もどる」ボタン（パネル全体を戻る）
      const backButtons = screen.getAllByRole('button', { name: 'もどる' });
      await user.click(backButtons[backButtons.length - 1]);
      expect(handleBack).toHaveBeenCalledTimes(1);
    });
  });
});
