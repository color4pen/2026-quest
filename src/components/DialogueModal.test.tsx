import { render, screen } from '../test/helpers';
import userEvent from '@testing-library/user-event';
import { DialogueModal } from './DialogueModal';
import { DialogueState, DialogueChoice } from '../types/game';

function createDialogueState(overrides: Partial<DialogueState> = {}): DialogueState {
  return {
    isActive: true,
    npcName: 'テスト村人',
    npcType: 'villager',
    currentNode: {
      id: 'node1',
      speaker: 'テスト村人',
      text: 'こんにちは！',
    },
    isComplete: false,
    ...overrides,
  };
}

describe('DialogueModal', () => {
  const defaultProps = {
    dialogue: createDialogueState(),
    onSelectChoice: vi.fn(),
    onAdvance: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示', () => {
    it('話者名が表示される', () => {
      render(<DialogueModal {...defaultProps} />);
      expect(screen.getByText('テスト村人')).toBeInTheDocument();
    });

    it('会話テキストが表示される', () => {
      render(<DialogueModal {...defaultProps} />);
      expect(screen.getByText('こんにちは！')).toBeInTheDocument();
    });

    it('currentNodeがnullの場合は何も表示しない', () => {
      const dialogue = createDialogueState({ currentNode: null });
      const { container } = render(<DialogueModal {...defaultProps} dialogue={dialogue} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('NPC画像', () => {
    it('npcImageがある場合は画像が表示される', () => {
      const dialogue = createDialogueState({ npcImage: '/assets/npc.png' });
      render(<DialogueModal {...defaultProps} dialogue={dialogue} />);
      const img = screen.getByRole('img', { name: 'テスト村人' });
      expect(img).toBeInTheDocument();
    });

    it('npcImageがない場合はno-portraitクラスが付く', () => {
      const { container } = render(<DialogueModal {...defaultProps} />);
      expect(container.querySelector('.no-portrait')).toBeInTheDocument();
    });
  });

  describe('続けるボタン', () => {
    it('nextIdがある場合「続ける」ボタンが表示される', () => {
      const dialogue = createDialogueState({
        currentNode: {
          id: 'node1',
          speaker: 'テスト村人',
          text: 'こんにちは！',
          nextId: 'node2',
        },
      });
      render(<DialogueModal {...defaultProps} dialogue={dialogue} />);
      expect(screen.getByRole('button', { name: '続ける' })).toBeInTheDocument();
    });

    it('「続ける」をクリックするとonAdvanceが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleAdvance = vi.fn();
      const dialogue = createDialogueState({
        currentNode: {
          id: 'node1',
          speaker: 'テスト村人',
          text: 'こんにちは！',
          nextId: 'node2',
        },
      });
      render(<DialogueModal {...defaultProps} dialogue={dialogue} onAdvance={handleAdvance} />);

      await user.click(screen.getByRole('button', { name: '続ける' }));
      expect(handleAdvance).toHaveBeenCalledTimes(1);
    });
  });

  describe('閉じるボタン', () => {
    it('nextIdも選択肢もない場合「閉じる」ボタンが表示される', () => {
      render(<DialogueModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
    });

    it('「閉じる」をクリックするとonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(<DialogueModal {...defaultProps} onClose={handleClose} />);

      await user.click(screen.getByRole('button', { name: '閉じる' }));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('選択肢', () => {
    it('選択肢がある場合はボタンとして表示される', () => {
      const dialogue = createDialogueState({
        currentNode: {
          id: 'node1',
          speaker: 'テスト村人',
          text: 'どうしますか？',
          choices: [
            { id: 'yes', text: 'はい' },
            { id: 'no', text: 'いいえ' },
          ],
        },
      });
      render(<DialogueModal {...defaultProps} dialogue={dialogue} />);

      expect(screen.getByRole('button', { name: 'はい' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'いいえ' })).toBeInTheDocument();
    });

    it('選択肢をクリックするとonSelectChoiceが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleSelectChoice = vi.fn();
      const choice: DialogueChoice = { id: 'yes', text: 'はい' };
      const dialogue = createDialogueState({
        currentNode: {
          id: 'node1',
          speaker: 'テスト村人',
          text: 'どうしますか？',
          choices: [choice, { id: 'no', text: 'いいえ' }],
        },
      });
      render(<DialogueModal {...defaultProps} dialogue={dialogue} onSelectChoice={handleSelectChoice} />);

      await user.click(screen.getByRole('button', { name: 'はい' }));
      expect(handleSelectChoice).toHaveBeenCalledWith(choice);
    });

    it('選択肢がある場合は「続ける」「閉じる」ボタンは表示されない', () => {
      const dialogue = createDialogueState({
        currentNode: {
          id: 'node1',
          speaker: 'テスト村人',
          text: 'どうしますか？',
          choices: [{ id: 'yes', text: 'はい' }],
        },
      });
      render(<DialogueModal {...defaultProps} dialogue={dialogue} />);

      expect(screen.queryByRole('button', { name: '続ける' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '閉じる' })).not.toBeInTheDocument();
    });
  });
});
