import { render, screen } from '../test/helpers';
import userEvent from '@testing-library/user-event';
import { TitleScreen } from './TitleScreen';

describe('TitleScreen', () => {
  const defaultProps = {
    hasSaveData: false,
    onNewGame: vi.fn(),
    onContinue: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示', () => {
    it('ゲームタイトルが表示される', () => {
      render(<TitleScreen {...defaultProps} />);
      expect(screen.getByText('2026年クエスト')).toBeInTheDocument();
    });

    it('サブタイトルが表示される', () => {
      render(<TitleScreen {...defaultProps} />);
      expect(screen.getByText('2026 Quest')).toBeInTheDocument();
    });

    it('「はじめから」ボタンが表示される', () => {
      render(<TitleScreen {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'はじめから' })).toBeInTheDocument();
    });

    it('「つづきから」ボタンが表示される', () => {
      render(<TitleScreen {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'つづきから' })).toBeInTheDocument();
    });
  });

  describe('はじめから', () => {
    it('「はじめから」をクリックするとonNewGameが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleNewGame = vi.fn();
      render(<TitleScreen {...defaultProps} onNewGame={handleNewGame} />);

      await user.click(screen.getByRole('button', { name: 'はじめから' }));
      expect(handleNewGame).toHaveBeenCalledTimes(1);
    });
  });

  describe('つづきから', () => {
    it('セーブデータがない場合「つづきから」は無効', () => {
      render(<TitleScreen {...defaultProps} hasSaveData={false} />);
      expect(screen.getByRole('button', { name: 'つづきから' })).toBeDisabled();
    });

    it('セーブデータがある場合「つづきから」は有効', () => {
      render(<TitleScreen {...defaultProps} hasSaveData={true} />);
      expect(screen.getByRole('button', { name: 'つづきから' })).not.toBeDisabled();
    });

    it('セーブデータがある場合「つづきから」をクリックするとonContinueが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleContinue = vi.fn();
      render(<TitleScreen {...defaultProps} hasSaveData={true} onContinue={handleContinue} />);

      await user.click(screen.getByRole('button', { name: 'つづきから' }));
      expect(handleContinue).toHaveBeenCalledTimes(1);
    });

    it('セーブデータがない場合「つづきから」をクリックしてもonContinueは呼ばれない', async () => {
      const user = userEvent.setup();
      const handleContinue = vi.fn();
      render(<TitleScreen {...defaultProps} hasSaveData={false} onContinue={handleContinue} />);

      await user.click(screen.getByRole('button', { name: 'つづきから' }));
      expect(handleContinue).not.toHaveBeenCalled();
    });
  });
});
