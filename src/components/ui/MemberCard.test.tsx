import { render, screen } from '../../test/helpers';
import userEvent from '@testing-library/user-event';
import { MemberCard, MemberCardList } from './MemberCard';

function createMemberData(overrides = {}) {
  return {
    id: 'hero',
    name: '勇者',
    hp: 80,
    maxHp: 100,
    mp: 20,
    maxMp: 30,
    isAlive: true,
    isDefending: false,
    statusEffects: [],
    ...overrides,
  };
}

describe('MemberCard', () => {
  describe('基本表示 (battle variant)', () => {
    it('メンバー名が表示される', () => {
      render(<MemberCard member={createMemberData()} />);
      expect(screen.getByText('勇者')).toBeInTheDocument();
    });

    it('HPバーが表示される', () => {
      const { container } = render(<MemberCard member={createMemberData()} />);
      expect(container.querySelector('.status-bar-hp')).toBeInTheDocument();
    });

    it('MPバーが表示される', () => {
      const { container } = render(<MemberCard member={createMemberData()} />);
      expect(container.querySelector('.status-bar-mp')).toBeInTheDocument();
    });
  });

  describe('戦闘不能', () => {
    it('isAlive=falseのときDEADバッジが表示される', () => {
      render(<MemberCard member={createMemberData({ isAlive: false })} />);
      expect(screen.getByText('DEAD')).toBeInTheDocument();
    });

    it('isAlive=falseのときdeadクラスが付く', () => {
      const { container } = render(<MemberCard member={createMemberData({ isAlive: false })} />);
      expect(container.querySelector('.member-card.dead')).toBeInTheDocument();
    });
  });

  describe('防御状態', () => {
    it('isDefending=trueのときDEFバッジが表示される', () => {
      render(<MemberCard member={createMemberData({ isDefending: true })} />);
      expect(screen.getByText('DEF')).toBeInTheDocument();
    });

    it('isDefending=trueのときdefendingクラスが付く', () => {
      const { container } = render(<MemberCard member={createMemberData({ isDefending: true })} />);
      expect(container.querySelector('.member-card.defending')).toBeInTheDocument();
    });
  });

  describe('状態異常', () => {
    it('状態異常バッジが表示される', () => {
      const member = createMemberData({
        statusEffects: [
          { type: 'poison', name: '毒', shortName: '毒', color: '#9933ff' },
        ],
      });
      render(<MemberCard member={member} />);
      expect(screen.getByText('毒')).toBeInTheDocument();
    });

    it('状態異常があるときhas-statusクラスが付く', () => {
      const member = createMemberData({
        statusEffects: [
          { type: 'poison', name: '毒', shortName: '毒', color: '#9933ff' },
        ],
      });
      const { container } = render(<MemberCard member={member} />);
      expect(container.querySelector('.member-card.has-status')).toBeInTheDocument();
    });
  });

  describe('アクティブ状態', () => {
    it('isActive=trueのときactiveクラスが付く', () => {
      const { container } = render(<MemberCard member={createMemberData()} isActive={true} />);
      expect(container.querySelector('.member-card.active')).toBeInTheDocument();
    });

    it('isActing=trueのときactingクラスが付く', () => {
      const { container } = render(<MemberCard member={createMemberData()} isActing={true} />);
      expect(container.querySelector('.member-card.acting')).toBeInTheDocument();
    });

    it('isSelected=trueのときselectedクラスが付く', () => {
      const { container } = render(<MemberCard member={createMemberData()} isSelected={true} />);
      expect(container.querySelector('.member-card.selected')).toBeInTheDocument();
    });
  });

  describe('クリック', () => {
    it('onClickが渡されるとclickableクラスが付く', () => {
      const { container } = render(<MemberCard member={createMemberData()} onClick={vi.fn()} />);
      expect(container.querySelector('.member-card.clickable')).toBeInTheDocument();
    });

    it('クリックするとonClickが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<MemberCard member={createMemberData()} onClick={handleClick} />);

      await user.click(screen.getByText('勇者'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('pause variant', () => {
    it('レベルが表示される', () => {
      const member = createMemberData({ level: 5, class: 'warrior' });
      render(<MemberCard member={member} variant="pause" />);
      expect(screen.getByText('Lv.5')).toBeInTheDocument();
    });

    it('クラス名が表示される', () => {
      const member = createMemberData({ class: 'warrior' });
      render(<MemberCard member={member} variant="pause" />);
      expect(screen.getByText('戦士')).toBeInTheDocument();
    });

    it('戦闘不能のとき「戦闘不能」オーバーレイが表示される', () => {
      const member = createMemberData({ isAlive: false, class: 'warrior' });
      render(<MemberCard member={member} variant="pause" />);
      expect(screen.getByText('戦闘不能')).toBeInTheDocument();
    });
  });

  describe('variant クラス', () => {
    it('battle variantのときmember-card-battleクラスが付く', () => {
      const { container } = render(<MemberCard member={createMemberData()} variant="battle" />);
      expect(container.querySelector('.member-card-battle')).toBeInTheDocument();
    });

    it('compact variantのときmember-card-compactクラスが付く', () => {
      const { container } = render(<MemberCard member={createMemberData()} variant="compact" />);
      expect(container.querySelector('.member-card-compact')).toBeInTheDocument();
    });

    it('pause variantのときmember-card-pauseクラスが付く', () => {
      const member = createMemberData({ class: 'warrior' });
      const { container } = render(<MemberCard member={member} variant="pause" />);
      expect(container.querySelector('.member-card-pause')).toBeInTheDocument();
    });
  });
});

describe('MemberCardList', () => {
  const members = [
    createMemberData({ id: 'hero', name: '勇者' }),
    createMemberData({ id: 'mage', name: '魔法使い' }),
  ];

  it('全メンバーが表示される', () => {
    render(<MemberCardList members={members} />);
    expect(screen.getByText('勇者')).toBeInTheDocument();
    expect(screen.getByText('魔法使い')).toBeInTheDocument();
  });

  it('currentIndexのメンバーにactiveクラスが付く', () => {
    const { container } = render(<MemberCardList members={members} currentIndex={0} />);
    const cards = container.querySelectorAll('.member-card');
    expect(cards[0]).toHaveClass('active');
    expect(cards[1]).not.toHaveClass('active');
  });

  it('actingIndexのメンバーにactingクラスが付く', () => {
    const { container } = render(<MemberCardList members={members} actingIndex={1} />);
    const cards = container.querySelectorAll('.member-card');
    expect(cards[0]).not.toHaveClass('acting');
    expect(cards[1]).toHaveClass('acting');
  });

  it('selectedIndexのメンバーにselectedクラスが付く', () => {
    const { container } = render(<MemberCardList members={members} selectedIndex={0} />);
    const cards = container.querySelectorAll('.member-card');
    expect(cards[0]).toHaveClass('selected');
    expect(cards[1]).not.toHaveClass('selected');
  });

  it('onSelectが渡されるとメンバークリックで呼ばれる', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<MemberCardList members={members} onSelect={handleSelect} />);

    await user.click(screen.getByText('魔法使い'));
    expect(handleSelect).toHaveBeenCalledWith(1);
  });
});
