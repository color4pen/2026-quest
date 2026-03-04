import { render, screen } from '../test/helpers';
import { GameInfo } from './GameInfo';
import { Message } from '../types/game';

describe('GameInfo', () => {
  describe('基本表示', () => {
    it('right-panel log-only クラスを持つコンテナが表示される', () => {
      const { container } = render(<GameInfo messages={[]} />);
      expect(container.querySelector('.right-panel.log-only')).toBeInTheDocument();
    });

    it('メッセージが表示される', () => {
      const messages: Message[] = [
        { id: '1', text: '勇者は攻撃した！', type: 'battle' },
        { id: '2', text: '10のダメージ', type: 'battle' },
      ];
      render(<GameInfo messages={messages} />);
      expect(screen.getByText('勇者は攻撃した！')).toBeInTheDocument();
      expect(screen.getByText('10のダメージ')).toBeInTheDocument();
    });

    it('メッセージが空の場合も正常に表示される', () => {
      const { container } = render(<GameInfo messages={[]} />);
      expect(container.querySelector('.right-panel')).toBeInTheDocument();
    });
  });
});
