import './TitleScreen.css';

interface TitleScreenProps {
  hasSaveData: boolean;
  onNewGame: () => void;
  onContinue: () => void;
}

export function TitleScreen({ hasSaveData, onNewGame, onContinue }: TitleScreenProps) {
  return (
    <div className="title-screen">
      <div className="title-content">
        <h1 className="game-title">2026年クエスト</h1>
        <p className="game-subtitle">2026 Quest</p>

        <div className="title-menu">
          <button className="title-button" onClick={onNewGame}>
            はじめから
          </button>
          <button
            className={`title-button ${!hasSaveData ? 'disabled' : ''}`}
            onClick={onContinue}
            disabled={!hasSaveData}
          >
            つづきから
          </button>
        </div>
      </div>
    </div>
  );
}
