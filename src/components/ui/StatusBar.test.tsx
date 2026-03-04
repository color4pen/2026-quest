import { render, screen } from '../../test/helpers';
import { StatusBar } from './StatusBar';

describe('StatusBar', () => {
  describe('表示', () => {
    it('current/max の形式でテキストが表示される', () => {
      render(<StatusBar current={30} max={100} />);
      expect(screen.getByText('30/100')).toBeInTheDocument();
    });

    it('showText=false のときテキストが非表示', () => {
      render(<StatusBar current={30} max={100} showText={false} />);
      expect(screen.queryByText('30/100')).not.toBeInTheDocument();
    });

    it('showLabel=true のときラベルが表示される', () => {
      render(<StatusBar current={30} max={100} type="hp" showLabel />);
      expect(screen.getByText('HP')).toBeInTheDocument();
    });

    it('showLabel=false のときラベルが非表示（デフォルト）', () => {
      render(<StatusBar current={30} max={100} type="hp" />);
      expect(screen.queryByText('HP')).not.toBeInTheDocument();
    });
  });

  describe('ラベルタイプ', () => {
    it('type="hp" のとき "HP" ラベル', () => {
      render(<StatusBar current={50} max={100} type="hp" showLabel />);
      expect(screen.getByText('HP')).toBeInTheDocument();
    });

    it('type="mp" のとき "MP" ラベル', () => {
      render(<StatusBar current={20} max={30} type="mp" showLabel />);
      expect(screen.getByText('MP')).toBeInTheDocument();
    });

    it('type="xp" のとき "XP" ラベル', () => {
      render(<StatusBar current={50} max={100} type="xp" showLabel />);
      expect(screen.getByText('XP')).toBeInTheDocument();
    });
  });

  describe('バーの幅', () => {
    it('current=50, max=100 のとき幅50%', () => {
      const { container } = render(<StatusBar current={50} max={100} />);
      const fill = container.querySelector('.status-bar-fill');
      expect(fill).toHaveStyle({ width: '50%' });
    });

    it('current=0 のとき幅0%', () => {
      const { container } = render(<StatusBar current={0} max={100} />);
      const fill = container.querySelector('.status-bar-fill');
      expect(fill).toHaveStyle({ width: '0%' });
    });

    it('current > max のとき幅100%に制限', () => {
      const { container } = render(<StatusBar current={150} max={100} />);
      const fill = container.querySelector('.status-bar-fill');
      expect(fill).toHaveStyle({ width: '100%' });
    });

    it('max=0 のとき幅0%（ゼロ除算対策）', () => {
      const { container } = render(<StatusBar current={50} max={0} />);
      const fill = container.querySelector('.status-bar-fill');
      expect(fill).toHaveStyle({ width: '0%' });
    });
  });

  describe('サイズバリアント', () => {
    it('size="small" のクラスが適用される', () => {
      const { container } = render(<StatusBar current={50} max={100} size="small" />);
      expect(container.querySelector('.status-bar-small')).toBeInTheDocument();
    });

    it('size="large" のクラスが適用される', () => {
      const { container } = render(<StatusBar current={50} max={100} size="large" />);
      expect(container.querySelector('.status-bar-large')).toBeInTheDocument();
    });
  });
});
