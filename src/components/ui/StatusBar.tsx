import './StatusBar.css';

export type StatusBarType = 'hp' | 'mp' | 'xp';

interface StatusBarProps {
  current: number;
  max: number;
  type?: StatusBarType;
  showText?: boolean;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const TYPE_LABELS: Record<StatusBarType, string> = {
  hp: 'HP',
  mp: 'MP',
  xp: 'XP',
};

export function StatusBar({
  current,
  max,
  type = 'hp',
  showText = true,
  showLabel = false,
  size = 'medium',
  className = '',
}: StatusBarProps) {
  const percent = max > 0 ? (current / max) * 100 : 0;

  return (
    <div className={`status-bar status-bar-${type} status-bar-${size} ${showLabel ? 'with-label' : ''} ${className}`}>
      {showLabel && (
        <span className="status-bar-label">{TYPE_LABELS[type]}</span>
      )}
      <div className="status-bar-track">
        <div
          className="status-bar-fill"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      {showText && (
        <span className="status-bar-text">
          {current}/{max}
        </span>
      )}
    </div>
  );
}
