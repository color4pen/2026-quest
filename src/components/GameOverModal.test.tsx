import { render, screen } from '../test/helpers';
import userEvent from '@testing-library/user-event';
import { GameOverModal } from './GameOverModal';

describe('GameOverModal', () => {
  describe('基本表示', () => {
    it('「ゲームオーバー」と表示される', () => {
      render(<GameOverModal onReturnToTitle={vi.fn()} />);
      expect(screen.getByText('ゲームオーバー')).toBeInTheDocument();
    });

    it('「全滅してしまった...」と表示される', () => {
      render(<GameOverModal onReturnToTitle={vi.fn()} />);
      expect(screen.getByText('全滅してしまった...')).toBeInTheDocument();
    });

    it('「タイトルに戻る」ボタンが表示される', () => {
      render(<GameOverModal onReturnToTitle={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'タイトルに戻る' })).toBeInTheDocument();
    });
  });

  describe('タイトルに戻る', () => {
    it('「タイトルに戻る」をクリックするとonReturnToTitleが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleReturnToTitle = vi.fn();
      render(<GameOverModal onReturnToTitle={handleReturnToTitle} />);

      await user.click(screen.getByRole('button', { name: 'タイトルに戻る' }));
      expect(handleReturnToTitle).toHaveBeenCalledTimes(1);
    });
  });
});
