import { useState, useRef, useEffect } from 'react';
import { PartyMemberState, InventoryItemState } from '../../types/game';
import { PanelLayout } from './PanelLayout';
import { MemberSidebar } from './MemberSidebar';

interface ItemsPanelProps {
  inventory: InventoryItemState[];
  members: PartyMemberState[];
  selectedMemberIndex: number;
  onSelectMember: (index: number) => void;
  onUseItem: (itemId: string, targetMemberId?: string) => { success: boolean; message: string };
  onBack: () => void;
}

export function ItemsPanel({
  inventory,
  members,
  selectedMemberIndex,
  onSelectMember,
  onUseItem,
  onBack,
}: ItemsPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

  const selectedMember = members[selectedMemberIndex];

  const handleUseItem = (inv: InventoryItemState) => {
    if (!selectedMember) return;

    const result = onUseItem(inv.item.id, selectedMember.id);
    setMessage(result.success
      ? `${selectedMember.name}に${inv.item.name}を使った！`
      : result.message
    );
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMessage(null), 2000);
  };

  return (
    <PanelLayout
      left={{
        title: 'アイテム',
        wide: true,
        children: (
          <div className="item-list-scroll">
            {inventory.length === 0 ? (
              <p className="no-items">アイテムがありません</p>
            ) : (
              inventory.map((inv, index) => (
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
        ),
      }}
      right={{
        title: '使用対象',
        narrow: true,
        children: (
          <MemberSidebar
            members={members}
            selectedIndex={selectedMemberIndex}
            onSelect={onSelectMember}
            display="hp"
          />
        ),
      }}
      message={message}
      onBack={onBack}
    />
  );
}
