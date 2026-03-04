import { render, screen } from '../test/helpers';
import userEvent from '@testing-library/user-event';
import { createBattleState, createPartyState, createMember, createInventoryItem } from '../test/helpers';
import { BattleModal } from './BattleModal';

describe('BattleModal', () => {
  const defaultProps = {
    battle: createBattleState(),
    party: createPartyState(),
    onSelectCommand: vi.fn(),
    onUseSkill: vi.fn(),
    onUseItem: vi.fn(),
    onSelectTarget: vi.fn(),
    onCancel: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('敵表示', () => {
    it('敵の名前が表示される', () => {
      render(<BattleModal {...defaultProps} />);
      expect(screen.getByText('スライム')).toBeInTheDocument();
    });

    it('敵のHPが表示される', () => {
      render(<BattleModal {...defaultProps} />);
      expect(screen.getByText('30/30')).toBeInTheDocument();
    });

    it('倒された敵には「DEAD」と表示される', () => {
      const battle = createBattleState({
        enemies: [
          {
            id: 'enemy-1',
            name: 'スライム',
            hp: 0,
            maxHp: 30,
            attack: 5,
            defense: 2,
            xpReward: 10,
            goldMin: 5,
            goldMax: 10,
            skills: [],
            isDefending: false,
            isDead: true,
          },
        ],
      });
      const { container } = render(<BattleModal {...defaultProps} battle={battle} />);
      // 敵カード内のDEAD表示を確認
      const enemyHpText = container.querySelector('.battle-enemy-card .battle-hp-text');
      expect(enemyHpText).toHaveTextContent('DEAD');
    });
  });

  describe('コマンド選択フェーズ', () => {
    it('現在のメンバー名が表示される', () => {
      render(<BattleModal {...defaultProps} />);
      expect(screen.getByText('勇者のターン')).toBeInTheDocument();
    });

    it('コマンドボタンが表示される', () => {
      render(<BattleModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'こうげき' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'スキル' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'アイテム' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ぼうぎょ' })).toBeInTheDocument();
    });

    it('「こうげき」をクリックするとonSelectCommandが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleSelectCommand = vi.fn();
      render(<BattleModal {...defaultProps} onSelectCommand={handleSelectCommand} />);

      await user.click(screen.getByRole('button', { name: 'こうげき' }));
      expect(handleSelectCommand).toHaveBeenCalledWith('attack');
    });

    it('「スキル」をクリックするとonSelectCommandが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleSelectCommand = vi.fn();
      render(<BattleModal {...defaultProps} onSelectCommand={handleSelectCommand} />);

      await user.click(screen.getByRole('button', { name: 'スキル' }));
      expect(handleSelectCommand).toHaveBeenCalledWith('skill');
    });

    it('「ぼうぎょ」をクリックするとonSelectCommandが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleSelectCommand = vi.fn();
      render(<BattleModal {...defaultProps} onSelectCommand={handleSelectCommand} />);

      await user.click(screen.getByRole('button', { name: 'ぼうぎょ' }));
      expect(handleSelectCommand).toHaveBeenCalledWith('defend');
    });
  });

  describe('ターゲット選択フェーズ', () => {
    it('「ターゲットを選択」と表示される', () => {
      const battle = createBattleState({ phase: 'target_select' });
      render(<BattleModal {...defaultProps} battle={battle} />);
      expect(screen.getByText('ターゲットを選択')).toBeInTheDocument();
    });

    it('敵をクリックするとonSelectTargetが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleSelectTarget = vi.fn();
      const battle = createBattleState({ phase: 'target_select' });
      render(<BattleModal {...defaultProps} battle={battle} onSelectTarget={handleSelectTarget} />);

      // 敵カードをクリック
      const enemyCard = screen.getByText('スライム').closest('.battle-enemy-card');
      await user.click(enemyCard!);
      expect(handleSelectTarget).toHaveBeenCalledWith(0);
    });

    it('「もどる」をクリックするとonCancelが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleCancel = vi.fn();
      const battle = createBattleState({ phase: 'target_select' });
      render(<BattleModal {...defaultProps} battle={battle} onCancel={handleCancel} />);

      await user.click(screen.getByRole('button', { name: 'もどる' }));
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('スキル選択フェーズ', () => {
    it('スキル一覧が表示される', () => {
      const battle = createBattleState({ phase: 'skill_select' });
      const party = createPartyState({
        members: [
          createMember({
            skills: [
              { id: 'fire', name: 'ファイア', mpCost: 5, power: 20, type: 'attack', target: 'single_enemy', description: '火属性攻撃' },
            ],
          }),
        ],
      });
      render(<BattleModal {...defaultProps} battle={battle} party={party} />);
      expect(screen.getByText('ファイア')).toBeInTheDocument();
      expect(screen.getByText('MP 5')).toBeInTheDocument();
    });

    it('MP不足のスキルは無効', () => {
      const battle = createBattleState({
        phase: 'skill_select',
        partyMembers: [
          {
            id: 'hero',
            name: '勇者',
            hp: 50,
            maxHp: 100,
            mp: 3, // MP不足
            maxMp: 30,
            attack: 15,
            defense: 10,
            isDefending: false,
            statusEffects: [],
          },
        ],
      });
      const party = createPartyState({
        members: [
          createMember({
            mp: 3,
            skills: [
              { id: 'fire', name: 'ファイア', mpCost: 5, power: 20, type: 'attack', target: 'single_enemy', description: '火属性攻撃' },
            ],
          }),
        ],
      });
      render(<BattleModal {...defaultProps} battle={battle} party={party} />);

      const skillButton = screen.getByRole('button', { name: /ファイア/ });
      expect(skillButton).toBeDisabled();
    });
  });

  describe('アイテム選択フェーズ', () => {
    it('使用可能アイテムが表示される', () => {
      const battle = createBattleState({ phase: 'item_select' });
      const party = createPartyState({
        inventory: [createInventoryItem({ canUseInBattle: true })],
      });
      render(<BattleModal {...defaultProps} battle={battle} party={party} />);
      expect(screen.getByText('やくそう')).toBeInTheDocument();
    });

    it('使用可能アイテムがない場合メッセージが表示される', () => {
      const battle = createBattleState({ phase: 'item_select' });
      const party = createPartyState({
        inventory: [createInventoryItem({ canUseInBattle: false })],
      });
      render(<BattleModal {...defaultProps} battle={battle} party={party} />);
      expect(screen.getByText('使えるアイテムがない')).toBeInTheDocument();
    });

    it('アイテムをクリックするとonUseItemが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleUseItem = vi.fn();
      const battle = createBattleState({ phase: 'item_select' });
      const party = createPartyState({
        inventory: [createInventoryItem({ item: { id: 'potion', name: 'やくそう', description: 'HP回復', type: 'heal' } })],
      });
      render(<BattleModal {...defaultProps} battle={battle} party={party} onUseItem={handleUseItem} />);

      await user.click(screen.getByRole('button', { name: /やくそう/ }));
      expect(handleUseItem).toHaveBeenCalledWith('potion');
    });
  });

  describe('戦闘終了フェーズ', () => {
    it('勝利時に「勝利！」と表示される', () => {
      const battle = createBattleState({ phase: 'battle_end', result: 'victory' });
      render(<BattleModal {...defaultProps} battle={battle} />);
      expect(screen.getByText('勝利！')).toBeInTheDocument();
    });

    it('敗北時に「敗北...」と表示される', () => {
      const battle = createBattleState({ phase: 'battle_end', result: 'defeat' });
      render(<BattleModal {...defaultProps} battle={battle} />);
      expect(screen.getByText('敗北...')).toBeInTheDocument();
    });

    it('「閉じる」をクリックするとonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      const battle = createBattleState({ phase: 'battle_end', result: 'victory' });
      render(<BattleModal {...defaultProps} battle={battle} onClose={handleClose} />);

      await user.click(screen.getByRole('button', { name: '閉じる' }));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('バトルログ', () => {
    it('ログエントリーが表示される', () => {
      const battle = createBattleState({
        logs: [
          { id: 1, text: '勇者の攻撃！', type: 'action' },
          { id: 2, text: 'スライムに10ダメージ！', type: 'damage' },
        ],
      });
      render(<BattleModal {...defaultProps} battle={battle} />);
      expect(screen.getByText('勇者の攻撃！')).toBeInTheDocument();
      expect(screen.getByText('スライムに10ダメージ！')).toBeInTheDocument();
    });
  });
});
