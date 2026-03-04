import { render, screen } from '../../test/helpers';
import userEvent from '@testing-library/user-event';
import { createMember } from '../../test/helpers';
import { StatusPanel } from './StatusPanel';

describe('StatusPanel', () => {
  const defaultMembers = [
    createMember({
      id: 'hero',
      name: '勇者',
      level: 5,
      xp: 80,
      xpToNext: 100,
      hp: 80,
      maxHp: 100,
      mp: 20,
      maxMp: 30,
      attack: 25,
      defense: 15,
      class: 'warrior',
      skills: [
        { id: 'slash', name: '斬撃', mpCost: 5, power: 20, type: 'attack', target: 'single_enemy', description: '強力な斬撃' },
      ],
      equipment: {
        weapon: { id: 'sword', name: '鉄の剣', description: '攻撃力+10', type: 'equipment', equipSlot: 'weapon' },
        armor: null,
        accessory: null,
      },
      statusEffects: [],
    }),
    createMember({
      id: 'mage',
      name: '魔法使い',
      class: 'mage',
    }),
  ];

  const defaultProps = {
    members: defaultMembers,
    selectedMemberIndex: 0,
    onSelectMember: vi.fn(),
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示', () => {
    it('「メンバー」タイトルが表示される', () => {
      render(<StatusPanel {...defaultProps} />);
      expect(screen.getByText('メンバー')).toBeInTheDocument();
    });

    it('メンバー名がメンバーリストに表示される', () => {
      const { container } = render(<StatusPanel {...defaultProps} />);
      // メンバーリスト内のボタンを確認
      const memberButtons = container.querySelectorAll('.status-member-btn');
      expect(memberButtons.length).toBe(2);
    });

    it('選択メンバーの名前がステータス詳細に表示される', () => {
      const { container } = render(<StatusPanel {...defaultProps} />);
      // 詳細表示部分に勇者の名前がある
      const statusName = container.querySelector('.status-name');
      expect(statusName?.textContent).toBe('勇者');
    });
  });

  describe('ステータス詳細', () => {
    it('レベルが表示される', () => {
      render(<StatusPanel {...defaultProps} />);
      expect(screen.getByText('レベル')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('経験値が表示される', () => {
      const { container } = render(<StatusPanel {...defaultProps} />);
      expect(screen.getByText('経験値')).toBeInTheDocument();
      // 経験値は 80 / 100 だが HP も同じ値なので、ラベルと値のペアで確認
      const statRows = container.querySelectorAll('.stat-row');
      const xpRow = Array.from(statRows).find(row => row.textContent?.includes('経験値'));
      expect(xpRow?.textContent).toContain('80 / 100');
    });

    it('HP/MPが表示される', () => {
      const { container } = render(<StatusPanel {...defaultProps} />);
      expect(screen.getByText('HP')).toBeInTheDocument();
      expect(screen.getByText('MP')).toBeInTheDocument();
      // HP/MPの値をstat-rowから確認
      const statRows = container.querySelectorAll('.stat-row');
      const hpRow = Array.from(statRows).find(row => row.querySelector('.stat-label-new')?.textContent === 'HP');
      const mpRow = Array.from(statRows).find(row => row.querySelector('.stat-label-new')?.textContent === 'MP');
      expect(hpRow?.textContent).toContain('80 / 100');
      expect(mpRow?.textContent).toContain('20 / 30');
    });

    it('攻撃力/防御力が表示される', () => {
      render(<StatusPanel {...defaultProps} />);
      expect(screen.getByText('攻撃力')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('防御力')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  describe('装備表示', () => {
    it('装備中の武器名が表示される', () => {
      render(<StatusPanel {...defaultProps} />);
      expect(screen.getByText('武器')).toBeInTheDocument();
      expect(screen.getByText('鉄の剣')).toBeInTheDocument();
    });

    it('未装備スロットには「---」が表示される', () => {
      render(<StatusPanel {...defaultProps} />);
      expect(screen.getByText('防具')).toBeInTheDocument();
      expect(screen.getByText('装飾品')).toBeInTheDocument();
      // 未装備の防具と装飾品
      const emptySlots = screen.getAllByText('---');
      expect(emptySlots.length).toBe(2);
    });
  });

  describe('スキル表示', () => {
    it('スキル名とコストが表示される', () => {
      render(<StatusPanel {...defaultProps} />);
      expect(screen.getByText('斬撃')).toBeInTheDocument();
      expect(screen.getByText('MP 5')).toBeInTheDocument();
    });

    it('スキルがない場合は「スキルがありません」と表示される', () => {
      const members = [createMember({ skills: [] })];
      render(<StatusPanel {...defaultProps} members={members} />);
      expect(screen.getByText('スキルがありません')).toBeInTheDocument();
    });
  });

  describe('状態異常表示', () => {
    it('状態異常がない場合は「状態異常はありません」と表示される', () => {
      render(<StatusPanel {...defaultProps} />);
      expect(screen.getByText('状態異常はありません')).toBeInTheDocument();
    });

    it('状態異常がある場合は表示される', () => {
      const members = [
        createMember({
          statusEffects: [
            { type: 'poison', name: '毒', shortName: '毒', color: '#9933ff' },
          ],
        }),
      ];
      const { container } = render(<StatusPanel {...defaultProps} members={members} />);
      // 状態異常バッジを確認
      expect(container.querySelector('.status-effect-badge')).toBeInTheDocument();
      expect(container.querySelector('.status-effect-name')).toHaveTextContent('毒');
    });
  });

  describe('メンバー選択', () => {
    it('メンバーをクリックするとonSelectMemberが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleSelectMember = vi.fn();
      render(<StatusPanel {...defaultProps} onSelectMember={handleSelectMember} />);

      await user.click(screen.getByRole('button', { name: /魔法使い/ }));
      expect(handleSelectMember).toHaveBeenCalledWith(1);
    });
  });

  describe('戻る', () => {
    it('「もどる」をクリックするとonBackが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleBack = vi.fn();
      render(<StatusPanel {...defaultProps} onBack={handleBack} />);

      await user.click(screen.getByRole('button', { name: 'もどる' }));
      expect(handleBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('戦闘不能メンバー', () => {
    it('戦闘不能メンバーには dead クラスが付く', () => {
      const members = [createMember({ id: 'hero', name: '勇者', isAlive: false })];
      const { container } = render(<StatusPanel {...defaultProps} members={members} />);
      expect(container.querySelector('.status-member-btn.dead')).toBeInTheDocument();
    });
  });
});
