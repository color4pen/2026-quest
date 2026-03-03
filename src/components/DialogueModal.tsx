import { DialogueState, DialogueChoice } from '../types/game';
import { Modal, Button } from './ui';

interface DialogueModalProps {
  dialogue: DialogueState;
  onSelectChoice: (choice: DialogueChoice) => void;
  onAdvance: () => void;
  onClose: () => void;
}

export function DialogueModal({
  dialogue,
  onSelectChoice,
  onAdvance,
  onClose,
}: DialogueModalProps) {
  const currentNode = dialogue.currentNode;

  if (!currentNode) {
    return null;
  }

  return (
    <Modal variant="dialogue" className={`dialogue-modal-custom ${!dialogue.npcImage ? 'no-portrait' : ''}`}>
      {/* キャラクター立ち絵エリア */}
      {dialogue.npcImage && (
        <div className="dialogue-portrait-area">
          <img
            src={dialogue.npcImage}
            alt={dialogue.npcName}
            className="dialogue-portrait"
          />
        </div>
      )}

      {/* テキストボックス */}
      <div className="dialogue-textbox">
        <div className="dialogue-nameplate">
          {currentNode.speaker}
        </div>
        <div className="dialogue-text">
          {currentNode.text}
        </div>
      </div>

      {/* 選択肢 */}
      <div className="dialogue-choices">
        {currentNode.choices ? (
          currentNode.choices.map((choice) => (
            <Button
              key={choice.id}
              onClick={() => onSelectChoice(choice)}
            >
              {choice.text}
            </Button>
          ))
        ) : currentNode.nextId ? (
          <Button onClick={onAdvance}>
            続ける
          </Button>
        ) : (
          <Button onClick={onClose}>
            閉じる
          </Button>
        )}
      </div>
    </Modal>
  );
}
