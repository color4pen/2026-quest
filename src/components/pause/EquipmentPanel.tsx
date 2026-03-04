import { useState, useRef, useEffect } from 'react';
import { PartyMemberState, InventoryItemState, EquipmentSlot, SLOT_NAMES } from '../../types/game';
import { MemberSidebar } from './MemberSidebar';

type EquipmentSubView = 'slots' | 'select';

interface EquipmentPanelProps {
  inventory: InventoryItemState[];
  members: PartyMemberState[];
  selectedMemberIndex: number;
  onSelectMember: (index: number) => void;
  onEquipItem: (memberId: string, itemId: string) => { success: boolean; message: string };
  onUnequipItem: (memberId: string, slot: EquipmentSlot) => { success: boolean; message: string };
  onBack: () => void;
}

/** スロットに装備可能なアイテムをフィルタリングする */
export function getEquippableItems(
  slot: EquipmentSlot,
  inventory: InventoryItemState[],
): InventoryItemState[] {
  return inventory.filter(inv => inv.item.equipSlot === slot);
}

export function EquipmentPanel({
  inventory,
  members,
  selectedMemberIndex,
  onSelectMember,
  onEquipItem,
  onUnequipItem,
  onBack,
}: EquipmentPanelProps) {
  const [subView, setSubView] = useState<EquipmentSubView>('slots');
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

  const selectedMember = members[selectedMemberIndex];
  const slots: EquipmentSlot[] = ['weapon', 'armor', 'accessory'];

  const showMessage = (text: string) => {
    setMessage(text);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMessage(null), 2000);
  };

  const handleEquip = (itemId: string) => {
    if (!selectedMember) return;
    const result = onEquipItem(selectedMember.id, itemId);
    showMessage(result.message);
    if (result.success) {
      setSubView('slots');
      setSelectedSlot(null);
    }
  };

  const handleUnequip = (slot: EquipmentSlot) => {
    if (!selectedMember) return;
    const result = onUnequipItem(selectedMember.id, slot);
    showMessage(result.message);
  };

  return (
    <div className="pause-split-layout">
      <div className="pause-left-panel wide">
        <h3 className="panel-title">そうび</h3>
        {message && <div className="pause-message">{message}</div>}

        {subView === 'slots' && selectedMember && (
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
                          onClick={() => { setSelectedSlot(slot); setSubView('select'); }}
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
                          onClick={() => { setSelectedSlot(slot); setSubView('select'); }}
                        >
                          装備
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

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

        {subView === 'select' && selectedSlot && (
          <div className="equip-select">
            <h4>{SLOT_NAMES[selectedSlot]}を選択</h4>
            <div className="equip-item-list">
              {getEquippableItems(selectedSlot, inventory).length === 0 ? (
                <p className="no-items">装備できるアイテムがありません</p>
              ) : (
                getEquippableItems(selectedSlot, inventory).map((inv, index) => (
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
              onClick={() => { setSubView('slots'); setSelectedSlot(null); }}
            >
              もどる
            </button>
          </div>
        )}

        {subView === 'slots' && (
          <button className="pause-back-btn" onClick={onBack}>
            もどる
          </button>
        )}
      </div>

      <div className="pause-right-panel narrow">
        <h3 className="panel-title">装備者</h3>
        <MemberSidebar
          members={members}
          selectedIndex={selectedMemberIndex}
          onSelect={onSelectMember}
          display="class"
        />
      </div>
    </div>
  );
}
