import { render, screen, fireEvent } from '../../test/helpers';
import userEvent from '@testing-library/user-event';
import { createMember } from '../../test/helpers';
import { MainMenu } from './MainMenu';

describe('MainMenu', () => {
  const defaultMembers = [
    createMember({ id: 'hero', name: '勇者' }),
    createMember({ id: 'mage', name: '魔法使い' }),
  ];

  const defaultProps = {
    members: defaultMembers,
    gold: 500,
    itemCount: 10,
    onResume: vi.fn(),
    onNavigate: vi.fn(),
    onQuit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示', () => {
    it('メニュー項目が表示される', () => {
      render(<MainMenu {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'とじる' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'アイテム' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'そうび' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'つよさ' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'セーブ' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ロード' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'タイトルへ' })).toBeInTheDocument();
    });

    it('所持金が表示される', () => {
      render(<MainMenu {...defaultProps} />);
      expect(screen.getByText('500 G')).toBeInTheDocument();
    });

    it('アイテム数が表示される', () => {
      render(<MainMenu {...defaultProps} />);
      expect(screen.getByText('10個')).toBeInTheDocument();
    });

    it('パーティータイトルが表示される', () => {
      render(<MainMenu {...defaultProps} />);
      expect(screen.getByText('パーティー')).toBeInTheDocument();
    });

    it('メンバー名が表示される', () => {
      render(<MainMenu {...defaultProps} />);
      expect(screen.getByText('勇者')).toBeInTheDocument();
      expect(screen.getByText('魔法使い')).toBeInTheDocument();
    });
  });

  describe('メニュー操作', () => {
    it('「とじる」をクリックするとonResumeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleResume = vi.fn();
      render(<MainMenu {...defaultProps} onResume={handleResume} />);

      await user.click(screen.getByRole('button', { name: 'とじる' }));
      expect(handleResume).toHaveBeenCalledTimes(1);
    });

    it('「アイテム」をクリックするとonNavigate("items")が呼ばれる', async () => {
      const user = userEvent.setup();
      const handleNavigate = vi.fn();
      render(<MainMenu {...defaultProps} onNavigate={handleNavigate} />);

      await user.click(screen.getByRole('button', { name: 'アイテム' }));
      expect(handleNavigate).toHaveBeenCalledWith('items');
    });

    it('「そうび」をクリックするとonNavigate("equip")が呼ばれる', async () => {
      const user = userEvent.setup();
      const handleNavigate = vi.fn();
      render(<MainMenu {...defaultProps} onNavigate={handleNavigate} />);

      await user.click(screen.getByRole('button', { name: 'そうび' }));
      expect(handleNavigate).toHaveBeenCalledWith('equip');
    });

    it('「つよさ」をクリックするとonNavigate("status")が呼ばれる', async () => {
      const user = userEvent.setup();
      const handleNavigate = vi.fn();
      render(<MainMenu {...defaultProps} onNavigate={handleNavigate} />);

      await user.click(screen.getByRole('button', { name: 'つよさ' }));
      expect(handleNavigate).toHaveBeenCalledWith('status');
    });

    it('「セーブ」をクリックするとonNavigate("save")が呼ばれる', async () => {
      const user = userEvent.setup();
      const handleNavigate = vi.fn();
      render(<MainMenu {...defaultProps} onNavigate={handleNavigate} />);

      await user.click(screen.getByRole('button', { name: 'セーブ' }));
      expect(handleNavigate).toHaveBeenCalledWith('save');
    });

    it('「ロード」をクリックするとonNavigate("load")が呼ばれる', async () => {
      const user = userEvent.setup();
      const handleNavigate = vi.fn();
      render(<MainMenu {...defaultProps} onNavigate={handleNavigate} />);

      await user.click(screen.getByRole('button', { name: 'ロード' }));
      expect(handleNavigate).toHaveBeenCalledWith('load');
    });

    it('「タイトルへ」をクリックするとonQuitが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleQuit = vi.fn();
      render(<MainMenu {...defaultProps} onQuit={handleQuit} />);

      await user.click(screen.getByRole('button', { name: 'タイトルへ' }));
      expect(handleQuit).toHaveBeenCalledTimes(1);
    });
  });

  describe('ホバー説明', () => {
    it('メニュー項目にホバーすると説明が表示される', () => {
      render(<MainMenu {...defaultProps} />);

      const itemsButton = screen.getByRole('button', { name: 'アイテム' });
      fireEvent.mouseEnter(itemsButton);

      expect(screen.getByText('所持アイテムの確認・使用')).toBeInTheDocument();
    });

    it('ホバーを外すと説明が消える', () => {
      render(<MainMenu {...defaultProps} />);

      const itemsButton = screen.getByRole('button', { name: 'アイテム' });
      fireEvent.mouseEnter(itemsButton);
      expect(screen.getByText('所持アイテムの確認・使用')).toBeInTheDocument();

      fireEvent.mouseLeave(itemsButton);
      expect(screen.queryByText('所持アイテムの確認・使用')).not.toBeInTheDocument();
    });
  });
});
