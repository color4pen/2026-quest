import { render, screen, within } from '../test/helpers';
import userEvent from '@testing-library/user-event';
import { createSaveSlot, createEmptySaveSlot } from '../test/helpers';
import { SaveLoadModal } from './SaveLoadModal';

describe('SaveLoadModal', () => {
  const defaultSlots = [
    createSaveSlot({ slotId: 0 }),
    createEmptySaveSlot(1),
    createSaveSlot({ slotId: 2 }),
  ];

  describe('基本表示', () => {
    it('セーブモードでタイトル「セーブ」が表示される', () => {
      render(
        <SaveLoadModal
          mode="save"
          slots={defaultSlots}
          onSelectSlot={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('セーブ')).toBeInTheDocument();
    });

    it('ロードモードでタイトル「ロード」が表示される', () => {
      render(
        <SaveLoadModal
          mode="load"
          slots={defaultSlots}
          onSelectSlot={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('ロード')).toBeInTheDocument();
    });

    it('全スロットが表示される', () => {
      render(
        <SaveLoadModal
          mode="save"
          slots={defaultSlots}
          onSelectSlot={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('スロット 1')).toBeInTheDocument();
      expect(screen.getByText('スロット 2')).toBeInTheDocument();
      expect(screen.getByText('スロット 3')).toBeInTheDocument();
    });

    it('空スロットには「--- 空きスロット ---」と表示される', () => {
      render(
        <SaveLoadModal
          mode="save"
          slots={[createEmptySaveSlot(0)]}
          onSelectSlot={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('--- 空きスロット ---')).toBeInTheDocument();
    });

    it('データがあるスロットにはマップ名とレベルが表示される', () => {
      render(
        <SaveLoadModal
          mode="save"
          slots={[createSaveSlot({ mapName: 'テスト村', leaderLevel: 10 })]}
          onSelectSlot={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('テスト村')).toBeInTheDocument();
      expect(screen.getByText(/Lv\.10/)).toBeInTheDocument();
    });
  });

  describe('セーブモード', () => {
    it('空スロットをクリックすると即座にonSelectSlotが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleSelectSlot = vi.fn();
      render(
        <SaveLoadModal
          mode="save"
          slots={[createEmptySaveSlot(0)]}
          onSelectSlot={handleSelectSlot}
          onClose={vi.fn()}
        />
      );

      await user.click(screen.getByText('スロット 1'));
      expect(handleSelectSlot).toHaveBeenCalledWith(0);
    });

    it('既存データスロットをクリックすると上書き確認ダイアログが表示される', async () => {
      const user = userEvent.setup();
      render(
        <SaveLoadModal
          mode="save"
          slots={[createSaveSlot({ slotId: 0 })]}
          onSelectSlot={vi.fn()}
          onClose={vi.fn()}
        />
      );

      await user.click(screen.getByText('スロット 1'));
      expect(screen.getByText('データを上書きしますか？')).toBeInTheDocument();
    });

    it('上書き確認で「はい」を押すとonSelectSlotが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleSelectSlot = vi.fn();
      render(
        <SaveLoadModal
          mode="save"
          slots={[createSaveSlot({ slotId: 0 })]}
          onSelectSlot={handleSelectSlot}
          onClose={vi.fn()}
        />
      );

      await user.click(screen.getByText('スロット 1'));
      await user.click(screen.getByText('はい'));
      expect(handleSelectSlot).toHaveBeenCalledWith(0);
    });

    it('上書き確認で「いいえ」を押すとダイアログが閉じる', async () => {
      const user = userEvent.setup();
      render(
        <SaveLoadModal
          mode="save"
          slots={[createSaveSlot({ slotId: 0 })]}
          onSelectSlot={vi.fn()}
          onClose={vi.fn()}
        />
      );

      await user.click(screen.getByText('スロット 1'));
      await user.click(screen.getByText('いいえ'));
      expect(screen.queryByText('データを上書きしますか？')).not.toBeInTheDocument();
    });
  });

  describe('ロードモード', () => {
    it('空スロットはdisabledで選択できない', () => {
      render(
        <SaveLoadModal
          mode="load"
          slots={[createEmptySaveSlot(0)]}
          onSelectSlot={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const slotButton = screen.getByRole('button', { name: /スロット 1/ });
      expect(slotButton).toBeDisabled();
    });

    it('データがあるスロットをクリックすると確認ダイアログが表示される', async () => {
      const user = userEvent.setup();
      render(
        <SaveLoadModal
          mode="load"
          slots={[createSaveSlot({ slotId: 0 })]}
          onSelectSlot={vi.fn()}
          onClose={vi.fn()}
        />
      );

      await user.click(screen.getByText('スロット 1'));
      expect(screen.getByText(/このデータをロードしますか/)).toBeInTheDocument();
    });

    it('skipLoadConfirm=trueの場合、確認なしで即ロード', async () => {
      const user = userEvent.setup();
      const handleSelectSlot = vi.fn();
      render(
        <SaveLoadModal
          mode="load"
          slots={[createSaveSlot({ slotId: 0 })]}
          onSelectSlot={handleSelectSlot}
          onClose={vi.fn()}
          skipLoadConfirm
        />
      );

      await user.click(screen.getByText('スロット 1'));
      expect(handleSelectSlot).toHaveBeenCalledWith(0);
      expect(screen.queryByText(/このデータをロードしますか/)).not.toBeInTheDocument();
    });
  });

  describe('閉じる', () => {
    it('「もどる」ボタンでonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <SaveLoadModal
          mode="save"
          slots={defaultSlots}
          onSelectSlot={vi.fn()}
          onClose={handleClose}
        />
      );

      await user.click(screen.getByText('もどる'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('フルスクリーンモード', () => {
    it('fullscreen=trueでオーバーレイが表示される', () => {
      const { container } = render(
        <SaveLoadModal
          mode="save"
          slots={defaultSlots}
          onSelectSlot={vi.fn()}
          onClose={vi.fn()}
          fullscreen
        />
      );
      expect(container.querySelector('.save-load-fullscreen-overlay')).toBeInTheDocument();
    });

    it('fullscreen=falseでオーバーレイが表示されない', () => {
      const { container } = render(
        <SaveLoadModal
          mode="save"
          slots={defaultSlots}
          onSelectSlot={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(container.querySelector('.save-load-fullscreen-overlay')).not.toBeInTheDocument();
    });
  });
});
