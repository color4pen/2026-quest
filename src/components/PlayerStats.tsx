import { PartyState } from '../types/game';

interface PlayerStatsProps {
  player: PartyState;
  mapName?: string;
}

export function PlayerStats({ player: party, mapName }: PlayerStatsProps) {
  return (
    <div className="left-panel minimal">
      <div className="stat-box">
        <div className="stat-label">所持金</div>
        <div className="stat-value">{party.gold} G</div>
      </div>

      {mapName && (
        <div className="stat-box">
          <div className="stat-label">現在地</div>
          <div className="stat-value-small">{mapName}</div>
        </div>
      )}

      <div className="stat-box">
        <div className="stat-label">操作方法</div>
        <div className="controls-list">
          <div className="control-item">
            <span className="control-key">↑↓←→</span>
            <span className="control-desc">移動</span>
          </div>
          <div className="control-item">
            <span className="control-key">M / ESC</span>
            <span className="control-desc">メニュー</span>
          </div>
          <div className="control-item">
            <span className="control-key">Space</span>
            <span className="control-desc">決定/話す</span>
          </div>
        </div>
      </div>

      <div className="stat-box">
        <div className="stat-label">ゲーム情報</div>
        <div className="game-tips">
          <div className="tip-item"><span role="img" aria-label="ターゲット">🎯</span> モンスターを倒してレベルアップ</div>
          <div className="tip-item"><span role="img" aria-label="宝石">💎</span> 宝箱を探そう</div>
          <div className="tip-item"><span role="img" aria-label="木">🌳</span> 木と水は通行不可</div>
        </div>
      </div>
    </div>
  );
}
