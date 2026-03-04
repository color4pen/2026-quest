import { useState } from 'react';
import { PartyMemberState, CLASS_NAMES } from '../../types/game';

type MenuView = 'items' | 'equip' | 'status' | 'save' | 'load';

interface MainMenuProps {
  members: PartyMemberState[];
  gold: number;
  itemCount: number;
  onResume: () => void;
  onNavigate: (view: MenuView) => void;
  onQuit: () => void;
}

const CLASS_ICONS: Record<string, { emoji: string; label: string }> = {
  hero: { emoji: '⚔️', label: '剣' },
  warrior: { emoji: '🛡️', label: '盾' },
  mage: { emoji: '🔮', label: '水晶玉' },
  healer: { emoji: '✨', label: '輝き' },
};

export function MainMenu({ members, gold, itemCount, onResume, onNavigate, onQuit }: MainMenuProps) {
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

  const menuItems = [
    { id: 'resume', label: 'とじる', action: onResume, description: 'メニューを閉じてゲームに戻る' },
    { id: 'items', label: 'アイテム', action: () => onNavigate('items'), description: '所持アイテムの確認・使用' },
    { id: 'equip', label: 'そうび', action: () => onNavigate('equip'), description: '武器・防具・装飾品の装備' },
    { id: 'status', label: 'つよさ', action: () => onNavigate('status'), description: 'キャラクターの詳細ステータス' },
    { id: 'save', label: 'セーブ', action: () => onNavigate('save'), description: '冒険の記録を保存' },
    { id: 'load', label: 'ロード', action: () => onNavigate('load'), description: '保存した記録を読み込む' },
    { id: 'quit', label: 'タイトルへ', action: onQuit, description: 'タイトル画面に戻る', isQuit: true },
  ];

  return (
    <div className="pause-split-layout">
      <div className="pause-left-panel">
        <div className="pause-menu-list">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`pause-menu-item ${item.isQuit ? 'quit' : ''}`}
              onClick={item.action}
              onMouseEnter={() => setHoveredMenu(item.id)}
              onMouseLeave={() => setHoveredMenu(null)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="pause-menu-description">
          {hoveredMenu && menuItems.find(m => m.id === hoveredMenu)?.description}
        </div>

        <div className="pause-resources">
          <div className="resource-item">
            <span className="resource-label">所持金</span>
            <span className="resource-value">{gold} G</span>
          </div>
          <div className="resource-item">
            <span className="resource-label">アイテム</span>
            <span className="resource-value">{itemCount}個</span>
          </div>
        </div>
      </div>

      <div className="pause-right-panel">
        <h3 className="panel-title">パーティー</h3>
        <div className="pause-party-grid">
          {members.map((member) => {
            const hpPercent = (member.hp / member.maxHp) * 100;
            const mpPercent = (member.mp / member.maxMp) * 100;

            return (
              <div
                key={member.id}
                className={`pause-member-card ${!member.isAlive ? 'dead' : ''}`}
              >
                <div className="member-card-layout">
                  <div className="member-card-avatar">
                    {member.image ? (
                      <img src={member.image} alt={member.name} className="member-card-image" />
                    ) : (
                      <span className={`member-card-icon ${member.class}`} role="img" aria-label={CLASS_ICONS[member.class]?.label}>{CLASS_ICONS[member.class]?.emoji}</span>
                    )}
                  </div>
                  <div className="member-card-info">
                    <div className="member-card-header">
                      <span className="member-card-name">{member.name}</span>
                      <span className="member-card-class">{CLASS_NAMES[member.class]}</span>
                    </div>
                    <div className="member-card-level">Lv.{member.level}</div>
                    <div className="member-card-bars">
                      <div className="member-bar-row">
                        <span className="bar-label">HP</span>
                        <div className="member-bar hp">
                          <div className="member-bar-fill" style={{ width: `${hpPercent}%` }} />
                        </div>
                        <span className="bar-value">{member.hp}/{member.maxHp}</span>
                      </div>
                      <div className="member-bar-row">
                        <span className="bar-label">MP</span>
                        <div className="member-bar mp">
                          <div className="member-bar-fill mp" style={{ width: `${mpPercent}%` }} />
                        </div>
                        <span className="bar-value">{member.mp}/{member.maxMp}</span>
                      </div>
                    </div>
                    {member.statusEffects.length > 0 && (
                      <div className="member-status-effects">
                        {member.statusEffects.map((effect) => (
                          <span
                            key={effect.type}
                            className="member-status-badge"
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
          })}
        </div>
      </div>
    </div>
  );
}
