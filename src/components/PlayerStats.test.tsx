import { render, screen } from '../test/helpers';
import { createPartyState } from '../test/helpers';
import { PlayerStats } from './PlayerStats';

describe('PlayerStats', () => {
  describe('基本表示', () => {
    it('所持金が表示される', () => {
      const party = createPartyState({ gold: 500 });
      render(<PlayerStats player={party} />);
      expect(screen.getByText('500 G')).toBeInTheDocument();
    });

    it('「所持金」ラベルが表示される', () => {
      render(<PlayerStats player={createPartyState()} />);
      expect(screen.getByText('所持金')).toBeInTheDocument();
    });

    it('操作方法が表示される', () => {
      render(<PlayerStats player={createPartyState()} />);
      expect(screen.getByText('操作方法')).toBeInTheDocument();
      expect(screen.getByText('移動')).toBeInTheDocument();
      expect(screen.getByText('メニュー')).toBeInTheDocument();
      expect(screen.getByText('決定/話す')).toBeInTheDocument();
    });

    it('ゲーム情報が表示される', () => {
      render(<PlayerStats player={createPartyState()} />);
      expect(screen.getByText('ゲーム情報')).toBeInTheDocument();
    });
  });

  describe('現在地表示', () => {
    it('mapNameがある場合は現在地が表示される', () => {
      render(<PlayerStats player={createPartyState()} mapName="はじまりの村" />);
      expect(screen.getByText('現在地')).toBeInTheDocument();
      expect(screen.getByText('はじまりの村')).toBeInTheDocument();
    });

    it('mapNameがない場合は現在地が表示されない', () => {
      render(<PlayerStats player={createPartyState()} />);
      expect(screen.queryByText('現在地')).not.toBeInTheDocument();
    });
  });
});
