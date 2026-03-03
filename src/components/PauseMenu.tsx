import { useState, useRef, useEffect } from 'react';
import { PartyState, InventoryItemState, PartyMemberState, CLASS_NAMES, SLOT_NAMES, EquipmentSlot } from '../types/game';
import { SaveSlotInfo } from '../types/save';
import { SaveLoadModal } from './SaveLoadModal';
import './PauseMenu.css';

type MenuView = 'main' | 'items' | 'equip' | 'status' | 'save' | 'load';
type EquipmentSubView = 'slots' | 'select';

interface PauseMenuProps {
  party: PartyState;
  saveSlots: SaveSlotInfo[];
  onResume: () => void;
  onSaveToSlot: (slotId: number) => void;
  onLoadFromSlot: (slotId: number) => void;
  onQuit: () => void;
  onUseItem: (itemId: string, targetMemberId?: string) => { success: boolean; message: string };
  onEquipItem: (memberId: string, itemId: string) => { success: boolean; message: string };
  onUnequipItem: (memberId: string, slot: EquipmentSlot) => { success: boolean; message: string };
}

export function PauseMenu({ party, saveSlots, onResume, onSaveToSlot, onLoadFromSlot, onQuit, onUseItem, onEquipItem, onUnequipItem }: PauseMenuProps) {
  const [view, setView] = useState<MenuView>('main');
  const [message, setMessage] = useState<string | null>(null);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  // 装備メニュー用
  const [equipSubView, setEquipSubView] = useState<EquipmentSubView>('slots');
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);

  const selectedMember = party.members[selectedMemberIndex];
  const messageTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

  const handleUseItem = (inv: InventoryItemState) => {
    if (!selectedMember) return;

    // アイテム使用（ロジックはParty側で処理）
    const result = onUseItem(inv.item.id, selectedMember.id);
    setMessage(result.success
      ? `${selectedMember.name}に${inv.item.name}を使った！`
      : result.message
    );
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMessage(null), 2000);
  };

  // メニュー項目定義（優先順位順）
  const menuItems = [
    { id: 'resume', label: 'とじる', action: onResume, description: 'メニューを閉じてゲームに戻る' },
    { id: 'items', label: 'アイテム', action: () => setView('items'), description: '所持アイテムの確認・使用' },
    { id: 'equip', label: 'そうび', action: () => { setView('equip'); setEquipSubView('slots'); }, description: '武器・防具・装飾品の装備' },
    { id: 'status', label: 'つよさ', action: () => setView('status'), description: 'キャラクターの詳細ステータス' },
    { id: 'save', label: 'セーブ', action: () => setView('save'), description: '冒険の記録を保存' },
    { id: 'load', label: 'ロード', action: () => setView('load'), description: '保存した記録を読み込む' },
    { id: 'quit', label: 'タイトルへ', action: onQuit, description: 'タイトル画面に戻る', isQuit: true },
  ];

  // 職業アイコン
  const CLASS_ICONS: Record<string, { emoji: string; label: string }> = {
    hero: { emoji: '⚔️', label: '剣' },
    warrior: { emoji: '🛡️', label: '盾' },
    mage: { emoji: '🔮', label: '水晶玉' },
    healer: { emoji: '✨', label: '輝き' },
  };

  // パーティーメンバーカード
  const renderMemberCard = (member: PartyMemberState, index: number, compact = false) => {
    const hpPercent = (member.hp / member.maxHp) * 100;
    const mpPercent = (member.mp / member.maxMp) * 100;

    return (
      <div
        key={member.id}
        className={`pause-member-card ${index === selectedMemberIndex ? 'selected' : ''} ${!member.isAlive ? 'dead' : ''} ${compact ? 'compact' : ''}`}
        onClick={() => setSelectedMemberIndex(index)}
      >
        <div className="member-card-layout">
          {/* 左側：画像 */}
          <div className="member-card-avatar">
            {member.image ? (
              <img src={member.image} alt={member.name} className="member-card-image" />
            ) : (
              <span className={`member-card-icon ${member.class}`} role="img" aria-label={CLASS_ICONS[member.class]?.label}>{CLASS_ICONS[member.class]?.emoji}</span>
            )}
          </div>

          {/* 右側：ステータス */}
          <div className="member-card-info">
            <div className="member-card-header">
              <span className="member-card-name">{member.name}</span>
              <span className="member-card-class">{CLASS_NAMES[member.class]}</span>
            </div>
            {!compact && (
              <>
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
                {/* 状態異常バッジ */}
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
              </>
            )}
            {compact && (
              <div className="member-card-hp-compact">
                HP {member.hp}/{member.maxHp}
              </div>
            )}
          </div>
        </div>
        {!member.isAlive && <div className="member-dead-overlay">戦闘不能</div>}
      </div>
    );
  };

  // メインメニュー（左右分割）
  const renderMainMenu = () => (
    <div className="pause-split-layout">
      {/* 左側：メニューオプション */}
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

        {/* 説明文 */}
        <div className="pause-menu-description">
          {hoveredMenu && menuItems.find(m => m.id === hoveredMenu)?.description}
        </div>

        {/* 共有リソース */}
        <div className="pause-resources">
          <div className="resource-item">
            <span className="resource-label">所持金</span>
            <span className="resource-value">{party.gold} G</span>
          </div>
          <div className="resource-item">
            <span className="resource-label">アイテム</span>
            <span className="resource-value">{party.inventory.reduce((sum, i) => sum + i.quantity, 0)}個</span>
          </div>
        </div>
      </div>

      {/* 右側：パーティー情報 */}
      <div className="pause-right-panel">
        <h3 className="panel-title">パーティー</h3>
        <div className="pause-party-grid">
          {party.members.map((member, index) => renderMemberCard(member, index))}
        </div>
      </div>
    </div>
  );

  // アイテムメニュー（左右分割）
  const renderItemsMenu = () => (
    <div className="pause-split-layout">
      {/* 左側：アイテムリスト */}
      <div className="pause-left-panel wide">
        <h3 className="panel-title">アイテム</h3>
        {message && <div className="pause-message">{message}</div>}

        <div className="item-list-scroll">
          {party.inventory.length === 0 ? (
            <p className="no-items">アイテムがありません</p>
          ) : (
            party.inventory.map((inv, index) => (
              <div key={index} className="item-row-new">
                <div className="item-info-new">
                  <span className="item-name-new">{inv.item.name}</span>
                  <span className="item-desc-new">{inv.item.description}</span>
                </div>
                <div className="item-actions-new">
                  <span className="item-qty-new">x{inv.quantity}</span>
                  {inv.canUseInMenu && (
                    <button
                      className="item-use-btn-new"
                      onClick={() => handleUseItem(inv)}
                    >
                      使う
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <button className="pause-back-btn" onClick={() => setView('main')}>
          もどる
        </button>
      </div>

      {/* 右側：使用対象選択 */}
      <div className="pause-right-panel narrow">
        <h3 className="panel-title">使用対象</h3>
        <div className="target-member-list">
          {party.members.map((member, index) => (
            <div
              key={member.id}
              className={`target-member-card ${index === selectedMemberIndex ? 'selected' : ''} ${!member.isAlive ? 'dead' : ''}`}
              onClick={() => member.isAlive && setSelectedMemberIndex(index)}
            >
              <span className="target-name">{member.name}</span>
              <span className="target-hp">HP {member.hp}/{member.maxHp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 装備可能なアイテムをフィルタリング
  const getEquippableItems = (slot: EquipmentSlot) => {
    return party.inventory.filter(inv => {
      if (inv.item.type !== 'equipment') return false;
      // スロット情報を取得するために、装備品アイテムの特性をチェック
      // 装備品はdescriptionに情報が含まれているか、typeがequipmentで
      // スロット判定はアイテムIDのパターンで判定
      const id = inv.item.id;
      if (slot === 'weapon') {
        return id.includes('sword') || id.includes('staff');
      } else if (slot === 'armor') {
        return id.includes('armor') || id.includes('robe');
      } else if (slot === 'accessory') {
        return id.includes('ring') || id.includes('pendant');
      }
      return false;
    });
  };

  // 装備ハンドラ
  const handleEquip = (itemId: string) => {
    if (!selectedMember) return;
    const result = onEquipItem(selectedMember.id, itemId);
    setMessage(result.message);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMessage(null), 2000);
    if (result.success) {
      setEquipSubView('slots');
      setSelectedSlot(null);
    }
  };

  // 装備解除ハンドラ
  const handleUnequip = (slot: EquipmentSlot) => {
    if (!selectedMember) return;
    const result = onUnequipItem(selectedMember.id, slot);
    setMessage(result.message);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMessage(null), 2000);
  };

  // そうびメニュー
  const renderEquipMenu = () => {
    const slots: EquipmentSlot[] = ['weapon', 'armor', 'accessory'];

    return (
      <div className="pause-split-layout">
        <div className="pause-left-panel wide">
          <h3 className="panel-title">そうび</h3>
          {message && <div className="pause-message">{message}</div>}

          {equipSubView === 'slots' && selectedMember && (
            <div className="equip-slots">
              {slots.map(slot => {
                const equipped = selectedMember.equipment[slot];
                return (
                  <div key={slot} className="equip-slot-row">
                    <span className="equip-slot-label">{SLOT_NAMES[slot]}</span>
                    <div className="equip-slot-item">
                      {equipped ? (
                        <>
                          <span className="equip-item-name">{equipped.name}</span>
                          <button
                            className="equip-change-btn"
                            onClick={() => { setSelectedSlot(slot); setEquipSubView('select'); }}
                          >
                            変更
                          </button>
                          <button
                            className="equip-remove-btn"
                            onClick={() => handleUnequip(slot)}
                          >
                            外す
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="equip-item-empty">---</span>
                          <button
                            className="equip-change-btn"
                            onClick={() => { setSelectedSlot(slot); setEquipSubView('select'); }}
                          >
                            装備
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 現在のステータス表示 */}
              <div className="equip-current-stats">
                <h4>ステータス</h4>
                <div className="equip-stat-row">
                  <span>攻撃力</span>
                  <span>{selectedMember.attack}</span>
                </div>
                <div className="equip-stat-row">
                  <span>防御力</span>
                  <span>{selectedMember.defense}</span>
                </div>
              </div>
            </div>
          )}

          {equipSubView === 'select' && selectedSlot && (
            <div className="equip-select">
              <h4>{SLOT_NAMES[selectedSlot]}を選択</h4>
              <div className="equip-item-list">
                {getEquippableItems(selectedSlot).length === 0 ? (
                  <p className="no-items">装備できるアイテムがありません</p>
                ) : (
                  getEquippableItems(selectedSlot).map((inv, index) => (
                    <div key={index} className="equip-item-row">
                      <div className="equip-item-info">
                        <span className="equip-item-name">{inv.item.name}</span>
                        <span className="equip-item-desc">{inv.item.description}</span>
                      </div>
                      <button
                        className="equip-select-btn"
                        onClick={() => handleEquip(inv.item.id)}
                      >
                        装備
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button
                className="pause-back-btn"
                onClick={() => { setEquipSubView('slots'); setSelectedSlot(null); }}
              >
                もどる
              </button>
            </div>
          )}

          {equipSubView === 'slots' && (
            <button className="pause-back-btn" onClick={() => setView('main')}>
              もどる
            </button>
          )}
        </div>

        <div className="pause-right-panel narrow">
          <h3 className="panel-title">装備者</h3>
          <div className="target-member-list">
            {party.members.map((member, index) => (
              <div
                key={member.id}
                className={`target-member-card ${index === selectedMemberIndex ? 'selected' : ''}`}
                onClick={() => setSelectedMemberIndex(index)}
              >
                <span className="target-name">{member.name}</span>
                <span className="target-hp">{CLASS_NAMES[member.class]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // つよさメニュー（左右分割）
  const renderStatusMenu = () => (
    <div className="pause-split-layout">
      {/* 左側：メンバー選択 */}
      <div className="pause-left-panel narrow">
        <h3 className="panel-title">メンバー</h3>
        <div className="status-member-list">
          {party.members.map((member, index) => (
            <button
              key={member.id}
              className={`status-member-btn ${index === selectedMemberIndex ? 'active' : ''} ${!member.isAlive ? 'dead' : ''}`}
              onClick={() => setSelectedMemberIndex(index)}
            >
              <span className="status-member-name">{member.name}</span>
              <span className="status-member-class">{CLASS_NAMES[member.class]}</span>
            </button>
          ))}
        </div>
        <button className="pause-back-btn" onClick={() => setView('main')}>
          もどる
        </button>
      </div>

      {/* 右側：詳細ステータス */}
      <div className="pause-right-panel wide">
        {selectedMember && (
          <div className="status-detail-new">
            <div className="status-header">
              <h3 className="status-name">{selectedMember.name}</h3>
              <span className="status-class-badge">{CLASS_NAMES[selectedMember.class]}</span>
            </div>

            <div className="status-sections">
              <div className="status-section-new">
                <h4>基本情報</h4>
                <div className="status-grid-new">
                  <div className="stat-row">
                    <span className="stat-label-new">レベル</span>
                    <span className="stat-value-new">{selectedMember.level}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label-new">経験値</span>
                    <span className="stat-value-new">{selectedMember.xp} / {selectedMember.xpToNext}</span>
                  </div>
                </div>
              </div>

              <div className="status-section-new">
                <h4>ステータス</h4>
                <div className="status-grid-new">
                  <div className="stat-row">
                    <span className="stat-label-new">HP</span>
                    <span className="stat-value-new">{selectedMember.hp} / {selectedMember.maxHp}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label-new">MP</span>
                    <span className="stat-value-new">{selectedMember.mp} / {selectedMember.maxMp}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label-new">攻撃力</span>
                    <span className="stat-value-new">{selectedMember.attack}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label-new">防御力</span>
                    <span className="stat-value-new">{selectedMember.defense}</span>
                  </div>
                </div>
              </div>

              <div className="status-section-new">
                <h4>装備</h4>
                <div className="status-grid-new">
                  <div className="stat-row">
                    <span className="stat-label-new">武器</span>
                    <span className="stat-value-new">{selectedMember.equipment.weapon?.name ?? '---'}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label-new">防具</span>
                    <span className="stat-value-new">{selectedMember.equipment.armor?.name ?? '---'}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label-new">装飾品</span>
                    <span className="stat-value-new">{selectedMember.equipment.accessory?.name ?? '---'}</span>
                  </div>
                </div>
              </div>

              <div className="status-section-new">
                <h4>スキル</h4>
                <div className="skill-list-new">
                  {selectedMember.skills.length === 0 ? (
                    <p className="no-skills">スキルがありません</p>
                  ) : (
                    selectedMember.skills.map((skill, index) => (
                      <div key={index} className="skill-row-new">
                        <span className="skill-name-new">{skill.name}</span>
                        <span className="skill-cost-new">MP {skill.mpCost}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="status-section-new">
                <h4>状態異常</h4>
                <div className="status-effects-list">
                  {selectedMember.statusEffects.length === 0 ? (
                    <p className="no-effects">状態異常はありません</p>
                  ) : (
                    selectedMember.statusEffects.map((effect) => (
                      <div key={effect.type} className="status-effect-row">
                        <span
                          className="status-effect-badge"
                          style={{ backgroundColor: effect.color }}
                        >
                          {effect.shortName}
                        </span>
                        <span className="status-effect-name">{effect.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // セーブスロット選択後の処理
  const handleSaveSlotSelect = (slotId: number) => {
    onSaveToSlot(slotId);
    setView('main');
  };

  const handleLoadSlotSelect = (slotId: number) => {
    onLoadFromSlot(slotId);
    // ロード成功後は親がメニューを閉じる
  };

  return (
    <div className="pause-overlay">
      <div className="pause-menu-new">
        <h2 className="pause-title-new">メニュー</h2>
        {view === 'main' && renderMainMenu()}
        {view === 'items' && renderItemsMenu()}
        {view === 'equip' && renderEquipMenu()}
        {view === 'status' && renderStatusMenu()}
        {view === 'save' && (
          <SaveLoadModal
            mode="save"
            slots={saveSlots}
            onSelectSlot={handleSaveSlotSelect}
            onClose={() => setView('main')}
          />
        )}
        {view === 'load' && (
          <SaveLoadModal
            mode="load"
            slots={saveSlots}
            onSelectSlot={handleLoadSlotSelect}
            onClose={() => setView('main')}
          />
        )}
        <p className="pause-hint-new">ESC / Mキーで開閉</p>
      </div>
    </div>
  );
}
