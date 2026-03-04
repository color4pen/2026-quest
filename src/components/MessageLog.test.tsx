import { render, screen } from '../test/helpers';
import { createMessage } from '../test/helpers';
import { MessageLog } from './MessageLog';

describe('MessageLog', () => {
  describe('基本表示', () => {
    it('ログタイトルが表示される', () => {
      render(<MessageLog messages={[]} />);
      expect(screen.getByText('ログ')).toBeInTheDocument();
    });

    it('メッセージが表示される', () => {
      const messages = [createMessage({ id: 1, text: 'テストメッセージ' })];
      render(<MessageLog messages={messages} />);
      expect(screen.getByText('テストメッセージ')).toBeInTheDocument();
    });

    it('複数メッセージが全て表示される', () => {
      const messages = [
        createMessage({ id: 1, text: 'メッセージ1' }),
        createMessage({ id: 2, text: 'メッセージ2' }),
        createMessage({ id: 3, text: 'メッセージ3' }),
      ];
      render(<MessageLog messages={messages} />);
      expect(screen.getByText('メッセージ1')).toBeInTheDocument();
      expect(screen.getByText('メッセージ2')).toBeInTheDocument();
      expect(screen.getByText('メッセージ3')).toBeInTheDocument();
    });

    it('空配列のときメッセージがない', () => {
      const { container } = render(<MessageLog messages={[]} />);
      const messages = container.querySelectorAll('.message');
      expect(messages).toHaveLength(0);
    });
  });

  describe('メッセージ順序', () => {
    it('新しいメッセージが上に表示される（逆順）', () => {
      const messages = [
        createMessage({ id: 1, text: '古いメッセージ' }),
        createMessage({ id: 2, text: '新しいメッセージ' }),
      ];
      const { container } = render(<MessageLog messages={messages} />);
      const messageElements = container.querySelectorAll('.message');

      expect(messageElements[0]).toHaveTextContent('新しいメッセージ');
      expect(messageElements[1]).toHaveTextContent('古いメッセージ');
    });
  });

  describe('メッセージタイプ', () => {
    it('type="normal" のメッセージにnormalクラスが適用される', () => {
      const messages = [createMessage({ id: 1, text: '通常', type: 'normal' })];
      const { container } = render(<MessageLog messages={messages} />);
      const message = container.querySelector('.message');
      expect(message).toHaveClass('normal');
    });

    it('type="combat" のメッセージにcombatクラスが適用される', () => {
      const messages = [createMessage({ id: 1, text: '戦闘', type: 'combat' })];
      const { container } = render(<MessageLog messages={messages} />);
      const message = container.querySelector('.message');
      expect(message).toHaveClass('combat');
    });

    it('type="loot" のメッセージにlootクラスが適用される', () => {
      const messages = [createMessage({ id: 1, text: '宝箱', type: 'loot' })];
      const { container } = render(<MessageLog messages={messages} />);
      const message = container.querySelector('.message');
      expect(message).toHaveClass('loot');
    });

    it('type="level-up" のメッセージにlevel-upクラスが適用される', () => {
      const messages = [createMessage({ id: 1, text: 'レベルアップ', type: 'level-up' })];
      const { container } = render(<MessageLog messages={messages} />);
      const message = container.querySelector('.message');
      expect(message).toHaveClass('level-up');
    });
  });
});
