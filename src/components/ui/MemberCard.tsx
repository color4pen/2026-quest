import { StatusBar } from './StatusBar';
import { CLASS_NAMES } from '../../types/game';
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
  // pause variant用の追加フィールド
  level?: number;
  class?: string;
  image?: string;
}

export type MemberCardVariant = 'battle' | 'compact' | 'full' | 'select' | 'pause';

const CLASS_ICONS: Record<string, { emoji: string; label: string }> = {
  hero: { emoji: '⚔️', label: '剣' },
  warrior: { emoji: '🛡️', label: '盾' },
  mage: { emoji: '🔮', label: '水晶玉' },
  healer: { emoji: '✨', label: '輝き' },
};

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

  // pause variant: アバター付きの詳細表示
  if (variant === 'pause') {
    return (
      <div className={classes} onClick={onClick}>
        <div className="member-card-layout">
          <div className="member-card-avatar">
            {member.image ? (
              <img src={member.image} alt={member.name} className="member-card-image" />
            ) : member.class ? (
              <span
                className={`member-card-icon ${member.class}`}
                role="img"
                aria-label={CLASS_ICONS[member.class]?.label}
              >
                {CLASS_ICONS[member.class]?.emoji}
              </span>
            ) : null}
          </div>
          <div className="member-card-info">
            <div className="member-card-header">
              <span className="member-card-name">{member.name}</span>
              {member.class && member.class in CLASS_NAMES && (
                <span className="member-card-class">{CLASS_NAMES[member.class as keyof typeof CLASS_NAMES]}</span>
              )}
            </div>
            {member.level !== undefined && (
              <div className="member-card-level">Lv.{member.level}</div>
            )}
            <div className="member-card-bars">
              <StatusBar current={member.hp} max={member.maxHp} type="hp" size="medium" showLabel />
              <StatusBar current={member.mp} max={member.maxMp} type="mp" size="medium" showLabel />
            </div>
            {member.statusEffects && member.statusEffects.length > 0 && (
              <div className="member-card-badges">
                {member.statusEffects.map((effect) => (
                  <span
                    key={effect.type}
                    className="member-badge badge-status"
                    style={{ backgroundColor: effect.color }}
                    title={effect.name}
                  >
                    {effect.shortName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {!member.isAlive && <div className="member-dead-overlay">戦闘不能</div>}
      </div>
    );
  }

  // 他のvariant: コンパクト表示
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
