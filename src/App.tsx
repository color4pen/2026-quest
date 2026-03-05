import { useState, useEffect, useCallback } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import {
  GameCanvas,
  PlayerStats,
  GameInfo,
  GameOverModal,
  BattleModal,
  DialogueModal,
  ShopModal,
  PauseMenu,
  TitleScreen,
} from './components';
import { SaveLoadModal } from './components/SaveLoadModal';
import './App.css';

type GamePhase = 'title' | 'playing';

function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('title');
  const [isPaused, setIsPaused] = useState(false);
  const [showTitleLoadModal, setShowTitleLoadModal] = useState(false);

  const {
    state,
    entities,
    battle,
    dialogue,
    shop,
    exploration,
    party,
    save,
  } = useGameEngine(isPaused);

  // ESC/Mキーでユーザーメニュー開閉
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
      // タイトル画面、バトル・会話・ショップ中は無視
      if (gamePhase === 'title' || state.battle || state.dialogue || state.shop || state.isGameOver) {
        return;
      }
      setIsPaused(prev => !prev);
    }
  }, [gamePhase, state.battle, state.dialogue, state.shop, state.isGameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // タイトル画面：はじめから
  const handleNewGame = () => {
    exploration.reset();
    setGamePhase('playing');
  };

  // タイトル画面：つづきから
  const handleContinue = () => {
    setShowTitleLoadModal(true);
  };

  // タイトル画面のロードモーダルからロード
  const handleTitleLoad = (slotId: number) => {
    const success = save.load(slotId);
    if (success) {
      setShowTitleLoadModal(false);
      setGamePhase('playing');
    }
  };

  // メニュー操作
  const handleResume = () => setIsPaused(false);

  const handleSaveToSlot = (slotId: number) => {
    save.save(slotId);
  };

  const handleLoadFromSlot = (slotId: number) => {
    const success = save.load(slotId);
    if (success) {
      setIsPaused(false);
    }
  };

  const handleQuit = () => {
    if (confirm('タイトルに戻りますか？')) {
      setIsPaused(false);
      setGamePhase('title');
    }
  };

  // タイトル画面
  if (gamePhase === 'title') {
    return (
      <>
        <TitleScreen
          hasSaveData={save.hasData()}
          onNewGame={handleNewGame}
          onContinue={handleContinue}
        />
        {showTitleLoadModal && (
          <SaveLoadModal
            mode="load"
            slots={save.getSlots()}
            onSelectSlot={handleTitleLoad}
            onClose={() => setShowTitleLoadModal(false)}
            fullscreen
            skipLoadConfirm
          />
        )}
      </>
    );
  }

  // ゲーム画面
  return (
    <div className="game-container">
      <div className="game-layout">
        <PlayerStats player={state.party} mapName={state.mapName} />

        <div className="center-panel">
          <GameCanvas
            entities={entities}
            map={state.map}
            camera={state.camera}
          />
        </div>

        <GameInfo messages={state.messages} />
      </div>

      {/* バトルモーダル */}
      {state.battle && (
        <BattleModal
          battle={state.battle}
          party={state.party}
          onSelectCommand={battle.selectCommand}
          onUseSkill={battle.useSkill}
          onUseItem={battle.useItem}
          onSelectTarget={battle.selectTarget}
          onCancel={battle.cancel}
          onClose={battle.close}
        />
      )}

      {/* 会話モーダル */}
      {state.dialogue && (
        <DialogueModal
          dialogue={state.dialogue}
          onSelectChoice={dialogue.selectChoice}
          onAdvance={dialogue.advance}
          onClose={dialogue.close}
        />
      )}

      {/* ショップモーダル */}
      {state.shop && (
        <ShopModal
          shop={state.shop}
          playerGold={state.party.gold}
          onBuyItem={shop.buyItem}
          onClose={shop.close}
        />
      )}

      {/* ゲームオーバーモーダル */}
      {state.isGameOver && !state.battle && (
        <GameOverModal onReturnToTitle={() => setGamePhase('title')} />
      )}

      {/* ポーズメニュー */}
      {isPaused && (
        <PauseMenu
          party={state.party}
          saveSlots={save.getSlots()}
          onResume={handleResume}
          onSaveToSlot={handleSaveToSlot}
          onLoadFromSlot={handleLoadFromSlot}
          onQuit={handleQuit}
          onUseItem={party.useFieldItem}
          onEquipItem={party.equipItem}
          onUnequipItem={party.unequipItem}
        />
      )}
    </div>
  );
}

export default App;
