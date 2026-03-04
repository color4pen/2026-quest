import { PartyMemberState, CLASS_NAMES } from '../../types/game';

type DisplayMode = 'hp' | 'class';

interface MemberSidebarProps {
  members: PartyMemberState[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  display?: DisplayMode;
}

export function MemberSidebar({
  members,
  selectedIndex,
  onSelect,
  display = 'hp',
}: MemberSidebarProps) {
  return (
    <div className="target-member-list">
      {members.map((member, index) => (
        <div
          key={member.id}
          className={`target-member-card ${index === selectedIndex ? 'selected' : ''} ${!member.isAlive ? 'dead' : ''}`}
          onClick={() => member.isAlive && onSelect(index)}
        >
          <span className="target-name">{member.name}</span>
          <span className="target-hp">
            {display === 'hp'
              ? `HP ${member.hp}/${member.maxHp}`
              : CLASS_NAMES[member.class]}
          </span>
        </div>
      ))}
    </div>
  );
}
