import { useState } from 'react';
import { SaveSlotInfo } from '../types/save';
import { getPartyMemberDefinition } from '../data/partyMembers';
import './SaveLoadModal.css';

type MenuMode = 'save' | 'load';

interface SaveLoadModalProps {
  mode: MenuMode;
  slots: SaveSlotInfo[];
  onSelectSlot: (slotId: number) => void;
  onClose: () => void;
  /** trueの場合、フルスクリーンオーバーレイで表示 */
  fullscreen?: boolean;
  /** trueの場合、ロード時の確認ダイアログをスキップ */
  skipLoadConfirm?: boolean;
}

export function SaveLoadModal({ mode, slots, onSelectSlot, onClose, fullscreen = false, skipLoadConfirm = false }: SaveLoadModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const title = mode === 'save' ? 'セーブ' : 'ロード';

  const formatTimestamp = (timestamp: number | null): string => {
    if (!timestamp) return '---';
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLeaderDisplayName = (leaderId: string | null): string => {
    if (!leaderId) return '---';
    const definition = getPartyMemberDefinition(leaderId);
    return definition?.name ?? leaderId;
  };

  const handleSlotClick = (slot: SaveSlotInfo) => {
    setSelectedSlot(slot.slotId);

    // セーブモードで既存データがある場合は上書き確認
    if (mode === 'save' && !slot.isEmpty) {
      setShowConfirm(true);
    }
    // ロードモードでデータがある場合
    else if (mode === 'load' && !slot.isEmpty) {
      // 確認スキップの場合は即ロード
      if (skipLoadConfirm) {
        onSelectSlot(slot.slotId);
      } else {
        setShowConfirm(true);
      }
    }
    // セーブモードで空スロットの場合は即セーブ
    else if (mode === 'save' && slot.isEmpty) {
      onSelectSlot(slot.slotId);
    }
    // ロードモードで空スロットは何もしない
  };

  const handleConfirm = () => {
    if (selectedSlot !== null) {
      onSelectSlot(selectedSlot);
    }
    setShowConfirm(false);
  };

  const handleCancel = () => {
    setSelectedSlot(null);
    setShowConfirm(false);
  };

  const modalContent = (
    <div className="save-load-modal">
      <h2 className="save-load-title">{title}</h2>

      <div className="save-slot-list">
        {slots.map((slot) => (
          <button
            key={slot.slotId}
            className={`save-slot ${slot.isEmpty ? 'empty' : ''} ${selectedSlot === slot.slotId ? 'selected' : ''}`}
            onClick={() => handleSlotClick(slot)}
            disabled={mode === 'load' && slot.isEmpty}
          >
            <div className="slot-header">
              <span className="slot-number">スロット {slot.slotId + 1}</span>
              {!slot.isEmpty && (
                <span className="slot-timestamp">{formatTimestamp(slot.timestamp)}</span>
              )}
            </div>

            {slot.isEmpty ? (
              <div className="slot-empty">--- 空きスロット ---</div>
            ) : (
              <div className="slot-info">
                <span className="slot-map">{slot.mapName}</span>
                <span className="slot-leader">
                  {getLeaderDisplayName(slot.leaderName)} Lv.{slot.leaderLevel}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      <button className="save-load-back-btn" onClick={onClose}>
        もどる
      </button>

      {/* 確認ダイアログ */}
      {showConfirm && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <p>
              {mode === 'save'
                ? 'データを上書きしますか？'
                : 'このデータをロードしますか？（現在の進行は失われます）'
              }
            </p>
            <div className="confirm-buttons">
              <button className="confirm-yes" onClick={handleConfirm}>はい</button>
              <button className="confirm-no" onClick={handleCancel}>いいえ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="save-load-fullscreen-overlay">
        <div className="save-load-fullscreen-container">
          {modalContent}
        </div>
      </div>
    );
  }

  return modalContent;
}
