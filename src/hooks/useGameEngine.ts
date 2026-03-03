import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Direction, BattleCommand, SkillDefinition, DialogueChoice, ShopItem, PartyMemberDefinition, EquipmentSlot } from '../types/game';
import { GameEngine, GameEngineState } from '../engine';
import { GameObject } from '../components/game';
import { SaveManager } from '../services/SaveManager';

export function useGameEngine(isPaused: boolean = false) {
  const engineRef = useRef<GameEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }

  const engine = engineRef.current;

  const [state, setState] = useState<GameEngineState>(() => engine.getState());

  useEffect(() => {
    const unsubscribe = engine.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, [engine]);

  // フィールド移動
  const move = useCallback((direction: Direction) => {
    engine.move(direction);
  }, [engine]);

  // ゲームリセット
  const resetGame = useCallback(() => {
    engine.reset();
  }, [engine]);

  // バトルコマンド選択
  const selectBattleCommand = useCallback((command: BattleCommand) => {
    engine.selectBattleCommand(command);
  }, [engine]);

  // スキル使用
  const useBattleSkill = useCallback((skill: SkillDefinition) => {
    engine.useBattleSkill(skill);
  }, [engine]);

  // アイテム使用
  const useBattleItem = useCallback((itemId: string) => {
    engine.useBattleItem(itemId);
  }, [engine]);

  // ターゲット選択
  const selectBattleTarget = useCallback((targetIndex: number) => {
    engine.selectBattleTarget(targetIndex);
  }, [engine]);

  // バトル選択キャンセル
  const cancelBattleSelection = useCallback(() => {
    engine.cancelBattleSelection();
  }, [engine]);

  // バトル終了（モーダルを閉じる）
  const closeBattle = useCallback(() => {
    engine.closeBattle();
  }, [engine]);

  // 会話選択肢を選択
  const selectDialogueChoice = useCallback((choice: DialogueChoice) => {
    engine.selectDialogueChoice(choice);
  }, [engine]);

  // 会話終了（モーダルを閉じる）
  const closeDialogue = useCallback(() => {
    engine.closeDialogue();
  }, [engine]);

  // 会話を進める（選択肢がないノードで次へ）
  const advanceDialogue = useCallback(() => {
    engine.advanceDialogue();
  }, [engine]);

  // ショップでアイテム購入
  const buyItem = useCallback((shopItem: ShopItem) => {
    return engine.buyItem(shopItem);
  }, [engine]);

  // ショップを閉じる
  const closeShop = useCallback(() => {
    engine.closeShop();
  }, [engine]);

  // フィールドでアイテム使用
  const useFieldItem = useCallback((itemId: string, targetMemberId?: string) => {
    return engine.useFieldItem(itemId, targetMemberId);
  }, [engine]);

  // 仲間を追加
  const recruitMember = useCallback((definition: PartyMemberDefinition) => {
    return engine.recruitMember(definition);
  }, [engine]);

  // 装備を装着
  const equipItem = useCallback((memberId: string, itemId: string) => {
    return engine.equipItem(memberId, itemId);
  }, [engine]);

  // 装備を外す
  const unequipItem = useCallback((memberId: string, slot: EquipmentSlot) => {
    return engine.unequipItem(memberId, slot);
  }, [engine]);

  // セーブスロット一覧取得
  const getSaveSlots = useCallback(() => {
    return engine.getSaveSlots();
  }, [engine]);

  // ゲームをセーブ
  const saveGame = useCallback((slotId: number) => {
    return engine.save(slotId);
  }, [engine]);

  // ゲームをロード
  const loadGame = useCallback((slotId: number) => {
    return engine.load(slotId);
  }, [engine]);

  // セーブデータがあるかチェック
  const hasSaveData = useCallback(() => {
    return SaveManager.hasSaveData();
  }, []);

  // GameObjects取得（Unity的なアプローチ：オブジェクトが自身を描画）
  const gameObjects = useMemo<GameObject[]>(() => {
    return engine.getGameObjects();
  }, [engine, state]);  // stateが変わるたびに再取得

  // キーボードイベント（バトル/会話/ショップ/ポーズ中は無効）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // バトル/会話/ショップ/ポーズ中は移動キーを無効化
      if (state.battle || state.dialogue || state.shop || isPaused) {
        return;
      }

      let direction: Direction | null = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'right';
          break;
      }

      if (direction) {
        e.preventDefault();
        move(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, state.battle, state.dialogue, state.shop, isPaused]);

  return {
    state,
    gameObjects,  // Unity的にGameObjectsを直接公開
    move,
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
    recruitMember,
    equipItem,
    unequipItem,
    getSaveSlots,
    saveGame,
    loadGame,
    hasSaveData,
    engine,
  };
}
