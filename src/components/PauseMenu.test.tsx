import { render, screen } from '../test/helpers';
import userEvent from '@testing-library/user-event';
import { createPartyState, createMember, createInventoryItem, createSaveSlot, createEmptySaveSlot } from '../test/helpers';
import { PauseMenu } from './PauseMenu';

describe('PauseMenu', () => {
  const defaultParty = createPartyState({
    members: [
      createMember({ id: 'hero', name: '勇者' }),
      createMember({ id: 'mage', name: '魔法使い' }),
    ],
    gold: 500,
    inventory: [
      createInventoryItem({ item: { id: 'potion', name: 'やくそう', description: 'HP回復', type: 'heal' }, quantity: 3 }),
    ],
  });

  const defaultSaveSlots = [
    createSaveSlot({ slotId: 0 }),
    createEmptySaveSlot(1),
    createEmptySaveSlot(2),
  ];

  const defaultProps = {
    party: defaultParty,
    saveSlots: defaultSaveSlots,
    onResume: vi.fn(),
    onSaveToSlot: vi.fn(),
    onLoadFromSlot: vi.fn(),
    onQuit: vi.fn(),
    onUseItem: vi.fn().mockReturnValue({ success: true, message: '回復した' }),
    onEquipItem: vi.fn().mockReturnValue({ success: true, message: '装備した' }),
    onUnequipItem: vi.fn().mockReturnValue({ success: true, message: '外した' }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示', () => {
    it('メニュータイトルが表示される', () => {
      render(<PauseMenu {...defaultProps} />);
      expect(screen.getByText('メニュー')).toBeInTheDocument();
    });

    it('ヒントテキストが表示される', () => {
      render(<PauseMenu {...defaultProps} />);
      expect(screen.getByText('ESC / Mキーで開閉')).toBeInTheDocument();
    });

    it('pause-overlay クラスを持つ要素が表示される', () => {
      const { container } = render(<PauseMenu {...defaultProps} />);
      expect(container.querySelector('.pause-overlay')).toBeInTheDocument();
    });
  });

  describe('メインメニュー', () => {
    it('初期表示でメインメニューが表示される', () => {
      render(<PauseMenu {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'アイテム' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'そうび' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'つよさ' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'セーブ' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ロード' })).toBeInTheDocument();
    });

    it('「とじる」をクリックするとonResumeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleResume = vi.fn();
      render(<PauseMenu {...defaultProps} onResume={handleResume} />);

      await user.click(screen.getByRole('button', { name: 'とじる' }));
      expect(handleResume).toHaveBeenCalledTimes(1);
    });
  });

  describe('アイテム画面', () => {
    it('「アイテム」クリックでアイテム画面に遷移する', async () => {
      const user = userEvent.setup();
      const { container } = render(<PauseMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'アイテム' }));
      // ItemsPanel のパネルタイトル「アイテム」と「使用対象」を確認
      const titles = container.querySelectorAll('.panel-title');
      const titleTexts = Array.from(titles).map(t => t.textContent);
      expect(titleTexts).toContain('アイテム');
    });

    it('アイテム画面から「もどる」でメインメニューに戻る', async () => {
      const user = userEvent.setup();
      render(<PauseMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'アイテム' }));
      await user.click(screen.getByRole('button', { name: 'もどる' }));

      // メインメニューに戻っていることを確認
      expect(screen.getByRole('button', { name: 'アイテム' })).toBeInTheDocument();
    });
  });

  describe('装備画面', () => {
    it('「そうび」クリックで装備画面に遷移する', async () => {
      const user = userEvent.setup();
      const { container } = render(<PauseMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'そうび' }));
      // EquipmentPanel のパネルタイトル「そうび」と「装備者」を確認
      const titles = container.querySelectorAll('.panel-title');
      const titleTexts = Array.from(titles).map(t => t.textContent);
      expect(titleTexts).toContain('そうび');
    });

    it('装備画面から「もどる」でメインメニューに戻る', async () => {
      const user = userEvent.setup();
      render(<PauseMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'そうび' }));
      await user.click(screen.getByRole('button', { name: 'もどる' }));

      expect(screen.getByRole('button', { name: 'そうび' })).toBeInTheDocument();
    });
  });

  describe('ステータス画面', () => {
    it('「つよさ」クリックでステータス画面に遷移する', async () => {
      const user = userEvent.setup();
      render(<PauseMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'つよさ' }));
      // StatusPanel のタイトルを確認
      expect(screen.getByText('メンバー')).toBeInTheDocument();
    });

    it('ステータス画面から「もどる」でメインメニューに戻る', async () => {
      const user = userEvent.setup();
      render(<PauseMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'つよさ' }));
      await user.click(screen.getByRole('button', { name: 'もどる' }));

      expect(screen.getByRole('button', { name: 'つよさ' })).toBeInTheDocument();
    });
  });

  describe('セーブ画面', () => {
    it('「セーブ」クリックでセーブ画面に遷移する', async () => {
      const user = userEvent.setup();
      render(<PauseMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'セーブ' }));
      // SaveLoadModal のタイトルを確認
      expect(screen.getByText('セーブ')).toBeInTheDocument();
    });

    it('セーブスロット選択後、onSaveToSlotが呼ばれメインメニューに戻る', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn();
      render(<PauseMenu {...defaultProps} onSaveToSlot={handleSave} />);

      await user.click(screen.getByRole('button', { name: 'セーブ' }));
      // 空きスロットをクリック
      await user.click(screen.getByText('スロット 2'));
      expect(handleSave).toHaveBeenCalledWith(1);
      // メインメニューに戻る
      expect(screen.getByRole('button', { name: 'アイテム' })).toBeInTheDocument();
    });
  });

  describe('ロード画面', () => {
    it('「ロード」クリックでロード画面に遷移する', async () => {
      const user = userEvent.setup();
      render(<PauseMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'ロード' }));
      // SaveLoadModal のタイトルを確認
      expect(screen.getByText('ロード')).toBeInTheDocument();
    });

    it('ロードスロット選択と確認でonLoadFromSlotが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleLoad = vi.fn();
      render(<PauseMenu {...defaultProps} onLoadFromSlot={handleLoad} />);

      await user.click(screen.getByRole('button', { name: 'ロード' }));
      // データのあるスロットをクリック
      await user.click(screen.getByText('スロット 1'));
      // 確認ダイアログで「はい」をクリック
      await user.click(screen.getByRole('button', { name: 'はい' }));
      expect(handleLoad).toHaveBeenCalledWith(0);
    });
  });

  describe('メンバー選択の状態維持', () => {
    it('アイテム画面でメンバー選択後、装備画面でも同じメンバーが選択されている', async () => {
      const user = userEvent.setup();
      const { container } = render(<PauseMenu {...defaultProps} />);

      // アイテム画面でメンバー選択
      await user.click(screen.getByRole('button', { name: 'アイテム' }));
      // 2人目のメンバーを選択
      const memberCards = container.querySelectorAll('.target-member-card');
      await user.click(memberCards[1]);

      // メインメニューに戻る
      await user.click(screen.getByRole('button', { name: 'もどる' }));

      // 装備画面に移動
      await user.click(screen.getByRole('button', { name: 'そうび' }));

      // 2人目が選択されていることを確認（MemberSidebarを使用）
      const equipCards = container.querySelectorAll('.target-member-card');
      expect(equipCards[1]).toHaveClass('selected');
    });
  });
});
