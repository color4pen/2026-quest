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
    gameObjects,  // Unity的：GameObjectsを直接受け取る
    resetGame,
    selectBattleCommand,
    useBattleSkill,
    useBattleItem,
    selectBattleTarget,
    cancelBattleSelection,
    closeBattle,
    selectDialogueChoice,
    closeDialogue,
    advanceDialogue,
    buyItem,
    closeShop,
    useFieldItem,
    equipItem,
    unequipItem,
    getSaveSlots,
    saveGame,
    loadGame,
    hasSaveData,
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
    resetGame();
    setGamePhase('playing');
  };

  // タイトル画面：つづきから
  const handleContinue = () => {
    setShowTitleLoadModal(true);
  };

  // タイトル画面のロードモーダルからロード
  const handleTitleLoad = (slotId: number) => {
    const success = loadGame(slotId);
    if (success) {
      setShowTitleLoadModal(false);
      setGamePhase('playing');
    }
  };

  // メニュー操作
  const handleResume = () => setIsPaused(false);

  const handleSaveToSlot = (slotId: number) => {
    saveGame(slotId);
  };

  const handleLoadFromSlot = (slotId: number) => {
    const success = loadGame(slotId);
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
          hasSaveData={hasSaveData()}
          onNewGame={handleNewGame}
          onContinue={handleContinue}
        />
        {showTitleLoadModal && (
          <SaveLoadModal
            mode="load"
            slots={getSaveSlots()}
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
          {/* Unity的：GameObjectsが自身を描画する */}
          <GameCanvas
            gameObjects={gameObjects}
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
          onSelectCommand={selectBattleCommand}
          onUseSkill={useBattleSkill}
          onUseItem={useBattleItem}
          onSelectTarget={selectBattleTarget}
          onCancel={cancelBattleSelection}
          onClose={closeBattle}
        />
      )}

      {/* 会話モーダル */}
      {state.dialogue && (
        <DialogueModal
          dialogue={state.dialogue}
          onSelectChoice={selectDialogueChoice}
          onAdvance={advanceDialogue}
          onClose={closeDialogue}
        />
      )}

      {/* ショップモーダル */}
      {state.shop && (
        <ShopModal
          shop={state.shop}
          playerGold={state.party.gold}
          onBuyItem={buyItem}
          onClose={closeShop}
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
          saveSlots={getSaveSlots()}
          onResume={handleResume}
          onSaveToSlot={handleSaveToSlot}
          onLoadFromSlot={handleLoadFromSlot}
          onQuit={handleQuit}
          onUseItem={useFieldItem}
          onEquipItem={equipItem}
          onUnequipItem={unequipItem}
        />
      )}
    </div>
  );
}

export default App;
