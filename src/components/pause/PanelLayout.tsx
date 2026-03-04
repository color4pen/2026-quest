import type { ReactNode } from 'react';

interface PanelSide {
  title: string;
  wide?: boolean;
  narrow?: boolean;
  children: ReactNode;
}

interface PanelLayoutProps {
  left: PanelSide;
  right: PanelSide;
  message?: string | null;
  onBack?: () => void;
  backLabel?: string;
}

export function PanelLayout({ left, right, message, onBack, backLabel = 'もどる' }: PanelLayoutProps) {
  return (
    <div className="pause-split-layout">
      <div className={`pause-left-panel ${left.wide ? 'wide' : ''} ${left.narrow ? 'narrow' : ''}`}>
        <h3 className="panel-title">{left.title}</h3>
        {message && <div className="pause-message">{message}</div>}
        {left.children}
        {onBack && (
          <button className="pause-back-btn" onClick={onBack}>
            {backLabel}
          </button>
        )}
      </div>
      <div className={`pause-right-panel ${right.wide ? 'wide' : ''} ${right.narrow ? 'narrow' : ''}`}>
        <h3 className="panel-title">{right.title}</h3>
        {right.children}
      </div>
    </div>
  );
}
