import { Modal, ModalBody, ModalFooter, Button } from './ui';

interface GameOverModalProps {
  onReturnToTitle: () => void;
}

export function GameOverModal({ onReturnToTitle }: GameOverModalProps) {
  return (
    <Modal variant="danger">
      <ModalBody className="game-over-body">
        <h2 className="game-over-title">ゲームオーバー</h2>
        <p className="game-over-text">全滅してしまった...</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="danger" size="large" onClick={onReturnToTitle}>
          タイトルに戻る
        </Button>
      </ModalFooter>
    </Modal>
  );
}
