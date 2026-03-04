import { render, screen } from '../../test/helpers';
import { createMember } from '../../test/helpers';
import { MemberSidebar } from './MemberSidebar';

describe('MemberSidebar', () => {
  const defaultMembers = [
    createMember({ id: 'hero', name: '勇者', hp: 80, maxHp: 100, class: 'warrior' }),
    createMember({ id: 'mage', name: '魔法使い', hp: 30, maxHp: 60, class: 'mage' }),
  ];

  const defaultProps = {
    members: defaultMembers,
    selectedIndex: 0,
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示', () => {
    it('メンバー名が表示される', () => {
      render(<MemberSidebar {...defaultProps} />);
      expect(screen.getByText('勇者')).toBeInTheDocument();
      expect(screen.getByText('魔法使い')).toBeInTheDocument();
    });
  });

  describe('HP表示モード', () => {
    it('display="hp"のときHP表示', () => {
      render(<MemberSidebar {...defaultProps} display="hp" />);
      expect(screen.getByText('HP 80/100')).toBeInTheDocument();
      expect(screen.getByText('HP 30/60')).toBeInTheDocument();
    });

    it('デフォルトはHP表示', () => {
      render(<MemberSidebar {...defaultProps} />);
      expect(screen.getByText('HP 80/100')).toBeInTheDocument();
    });
  });

  describe('クラス表示モード', () => {
    it('display="class"のときクラス名表示', () => {
      const { container } = render(<MemberSidebar {...defaultProps} display="class" />);
      // 戦士クラス名を確認
      expect(screen.getByText('戦士')).toBeInTheDocument();
      // 魔法使いのクラス名は名前と同じなので、target-hp要素で確認
      const mageCard = container.querySelectorAll('.target-member-card')[1];
      const mageClassDisplay = mageCard.querySelector('.target-hp');
      expect(mageClassDisplay?.textContent).toBe('魔法使い');
    });
  });

  describe('選択状態', () => {
    it('selectedIndexのメンバーにselectedクラスが付く', () => {
      const { container } = render(<MemberSidebar {...defaultProps} selectedIndex={0} />);
      const cards = container.querySelectorAll('.target-member-card');
      expect(cards[0]).toHaveClass('selected');
      expect(cards[1]).not.toHaveClass('selected');
    });
  });

  describe('戦闘不能メンバー', () => {
    it('isAlive=falseのメンバーにdeadクラスが付く', () => {
      const members = [
        createMember({ id: 'hero', name: '勇者', isAlive: false }),
        createMember({ id: 'mage', name: '魔法使い' }),
      ];
      const { container } = render(<MemberSidebar {...defaultProps} members={members} />);
      const cards = container.querySelectorAll('.target-member-card');
      expect(cards[0]).toHaveClass('dead');
      expect(cards[1]).not.toHaveClass('dead');
    });

    it('戦闘不能メンバーをクリックしてもonSelectは呼ばれない', () => {
      const handleSelect = vi.fn();
      const members = [
        createMember({ id: 'hero', name: '勇者', isAlive: false }),
        createMember({ id: 'mage', name: '魔法使い' }),
      ];
      const { container } = render(
        <MemberSidebar {...defaultProps} members={members} onSelect={handleSelect} />
      );

      const deadCard = container.querySelectorAll('.target-member-card')[0];
      deadCard.click();
      expect(handleSelect).not.toHaveBeenCalled();
    });
  });

  describe('メンバー選択', () => {
    it('生存メンバーをクリックするとonSelectが呼ばれる', () => {
      const handleSelect = vi.fn();
      const { container } = render(
        <MemberSidebar {...defaultProps} onSelect={handleSelect} />
      );

      const mageCard = container.querySelectorAll('.target-member-card')[1];
      mageCard.click();
      expect(handleSelect).toHaveBeenCalledWith(1);
    });
  });
});
