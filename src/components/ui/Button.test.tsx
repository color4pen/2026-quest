import { render, screen } from '../../test/helpers';
import userEvent from '@testing-library/user-event';
import { Button, ListButton } from './Button';

describe('Button', () => {
  describe('基本動作', () => {
    it('子要素がレンダリングされる', () => {
      render(<Button>テストボタン</Button>);
      expect(screen.getByRole('button', { name: 'テストボタン' })).toBeInTheDocument();
    });

    it('クリックするとonClickが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>クリック</Button>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disabled=true のときクリックしても何も起きない', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>無効</Button>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('disabled=true のときdisabled属性がつく', () => {
      render(<Button disabled>無効</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('バリアント', () => {
    it('variant="primary" のクラスが適用される（デフォルト）', () => {
      render(<Button>プライマリ</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });

    it('variant="secondary" のクラスが適用される', () => {
      render(<Button variant="secondary">セカンダリ</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    });

    it('variant="danger" のクラスが適用される', () => {
      render(<Button variant="danger">危険</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-danger');
    });

    it('variant="ghost" のクラスが適用される', () => {
      render(<Button variant="ghost">ゴースト</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-ghost');
    });
  });

  describe('サイズ', () => {
    it('size="small" のクラスが適用される', () => {
      render(<Button size="small">小</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-small');
    });

    it('size="medium" のクラスが適用される（デフォルト）', () => {
      render(<Button>中</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-medium');
    });

    it('size="large" のクラスが適用される', () => {
      render(<Button size="large">大</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-large');
    });
  });

  describe('フルワイド', () => {
    it('fullWidth=true のクラスが適用される', () => {
      render(<Button fullWidth>フルワイド</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-full');
    });

    it('fullWidth=false のときクラスが適用されない（デフォルト）', () => {
      render(<Button>通常幅</Button>);
      expect(screen.getByRole('button')).not.toHaveClass('btn-full');
    });
  });
});

describe('ListButton', () => {
  describe('基本動作', () => {
    it('ラベルがレンダリングされる', () => {
      render(<ListButton label="アイテム名" />);
      expect(screen.getByText('アイテム名')).toBeInTheDocument();
    });

    it('ラベルと値が両方レンダリングされる', () => {
      render(<ListButton label="やくそう" value="x3" />);
      expect(screen.getByText('やくそう')).toBeInTheDocument();
      expect(screen.getByText('x3')).toBeInTheDocument();
    });

    it('value=undefined のとき値が表示されない', () => {
      render(<ListButton label="ラベルのみ" />);
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });

    it('クリックするとonClickが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<ListButton label="クリック" onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disabled=true のときクリックしても何も起きない', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<ListButton label="無効" onClick={handleClick} disabled />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('バリアント', () => {
    it('variant="secondary" のクラスが適用される', () => {
      render(<ListButton label="セカンダリ" variant="secondary" />);
      expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    });
  });
});
