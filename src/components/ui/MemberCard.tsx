import { StatusBar } from './StatusBar';
import './MemberCard.css';

interface StatusEffectInfo {
  type: string;
  name: string;
  shortName: string;
  color: string;
}

interface MemberData {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  isAlive: boolean;
  isDefending?: boolean;
  statusEffects?: StatusEffectInfo[];
}

export type MemberCardVariant = 'battle' | 'compact' | 'full' | 'select';

interface MemberCardProps {
  member: MemberData;
  variant?: MemberCardVariant;
  isActive?: boolean;
  isActing?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MemberCard({
  member,
  variant = 'battle',
  isActive = false,
  isActing = false,
  isSelected = false,
  onClick,
  className = '',
}: MemberCardProps) {
  const classes = [
    'member-card',
    `member-card-${variant}`,
    !member.isAlive ? 'dead' : '',
    isActive ? 'active' : '',
    isActing ? 'acting' : '',
    isSelected ? 'selected' : '',
    member.isDefending ? 'defending' : '',
    member.statusEffects && member.statusEffects.length > 0 ? 'has-status' : '',
    onClick ? 'clickable' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick}>
      <div className="member-card-name">{member.name}</div>

      <div className="member-card-bars">
        <StatusBar
          current={member.hp}
          max={member.maxHp}
          type="hp"
          size={variant === 'compact' ? 'small' : 'medium'}
        />
        <StatusBar
          current={member.mp}
          max={member.maxMp}
          type="mp"
          size={variant === 'compact' ? 'small' : 'medium'}
        />
      </div>

      {/* Badges */}
      <div className="member-card-badges">
        {member.isDefending && (
          <span className="member-badge badge-defend">DEF</span>
        )}
        {!member.isAlive && (
          <span className="member-badge badge-dead">DEAD</span>
        )}
        {member.statusEffects?.map((effect) => (
          <span
            key={effect.type}
            className="member-badge badge-status"
            style={{ backgroundColor: effect.color }}
          >
            {effect.shortName}
          </span>
        ))}
      </div>
    </div>
  );
}

interface MemberCardListProps {
  members: MemberData[];
  variant?: MemberCardVariant;
  currentIndex?: number;
  actingIndex?: number;
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}

export function MemberCardList({
  members,
  variant = 'battle',
  currentIndex,
  actingIndex,
  selectedIndex,
  onSelect,
}: MemberCardListProps) {
  return (
    <div className={`member-card-list member-card-list-${variant}`}>
      {members.map((member, index) => (
        <MemberCard
          key={member.id}
          member={member}
          variant={variant}
          isActive={currentIndex === index}
          isActing={actingIndex === index}
          isSelected={selectedIndex === index}
          onClick={onSelect ? () => onSelect(index) : undefined}
        />
      ))}
    </div>
  );
}
