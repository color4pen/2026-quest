import { useState } from 'react';
import { PartyMemberState } from '../../types/game';
import { MemberCard } from '../ui';

type MenuView = 'items' | 'equip' | 'status' | 'save' | 'load';

interface MainMenuProps {
  members: PartyMemberState[];
  gold: number;
  itemCount: number;
  onResume: () => void;
  onNavigate: (view: MenuView) => void;
  onQuit: () => void;
}

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
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              variant="pause"
              className="pause-member-card"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
