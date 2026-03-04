import { useState } from 'react';
import { PartyState, EquipmentSlot } from '../types/game';
import { SaveSlotInfo } from '../types/save';
import { MainMenu, ItemsPanel, EquipmentPanel, StatusPanel } from './pause';
import { SaveLoadModal } from './SaveLoadModal';
import './PauseMenu.css';

type MenuView = 'main' | 'items' | 'equip' | 'status' | 'save' | 'load';

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
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0);

  const goMain = () => setView('main');

  const renderView = () => {
    switch (view) {
      case 'main':
        return (
          <MainMenu
            members={party.members}
            gold={party.gold}
            itemCount={party.inventory.reduce((sum, i) => sum + i.quantity, 0)}
            onResume={onResume}
            onNavigate={setView}
            onQuit={onQuit}
          />
        );
      case 'items':
        return (
          <ItemsPanel
            inventory={party.inventory}
            members={party.members}
            selectedMemberIndex={selectedMemberIndex}
            onSelectMember={setSelectedMemberIndex}
            onUseItem={onUseItem}
            onBack={goMain}
          />
        );
      case 'equip':
        return (
          <EquipmentPanel
            inventory={party.inventory}
            members={party.members}
            selectedMemberIndex={selectedMemberIndex}
            onSelectMember={setSelectedMemberIndex}
            onEquipItem={onEquipItem}
            onUnequipItem={onUnequipItem}
            onBack={goMain}
          />
        );
      case 'status':
        return (
          <StatusPanel
            members={party.members}
            selectedMemberIndex={selectedMemberIndex}
            onSelectMember={setSelectedMemberIndex}
            onBack={goMain}
          />
        );
      case 'save':
        return (
          <SaveLoadModal
            mode="save"
            slots={saveSlots}
            onSelectSlot={(slotId) => { onSaveToSlot(slotId); goMain(); }}
            onClose={goMain}
          />
        );
      case 'load':
        return (
          <SaveLoadModal
            mode="load"
            slots={saveSlots}
            onSelectSlot={onLoadFromSlot}
            onClose={goMain}
          />
        );
    }
  };

  return (
    <div className="pause-overlay">
      <div className="pause-menu-new">
        <h2 className="pause-title-new">メニュー</h2>
        {renderView()}
        <p className="pause-hint-new">ESC / Mキーで開閉</p>
      </div>
    </div>
  );
}
