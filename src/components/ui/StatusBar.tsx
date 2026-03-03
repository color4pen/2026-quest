import './StatusBar.css';

export type StatusBarType = 'hp' | 'mp' | 'xp';

interface StatusBarProps {
  current: number;
  max: number;
  type?: StatusBarType;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function StatusBar({
  current,
  max,
  type = 'hp',
  showText = true,
  size = 'medium',
  className = '',
}: StatusBarProps) {
  const percent = max > 0 ? (current / max) * 100 : 0;

  return (
    <div className={`status-bar status-bar-${type} status-bar-${size} ${className}`}>
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
