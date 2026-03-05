import { useState, useEffect, useRef, useMemo } from 'react';
import { Direction, BattleCommand, SkillDefinition, DialogueChoice, ShopItem, PartyMemberDefinition, EquipmentSlot } from '../types/game';
import { GameEngine, GameEngineState } from '../engine';
import { RenderableEntity } from '../components/GameCanvas';
import { SaveManager } from '../services/SaveManager';
import { SaveSlotInfo } from '../types/save';

// ==================== ドメイングループ型定義 ====================

export interface BattleAPI {
  selectCommand: (command: BattleCommand) => void;
  useSkill: (skill: SkillDefinition) => void;
  useItem: (itemId: string) => void;
  selectTarget: (targetIndex: number) => void;
  cancel: () => void;
  close: () => void;
}

export interface DialogueAPI {
  selectChoice: (choice: DialogueChoice) => void;
  advance: () => void;
  close: () => void;
}

export interface ShopAPI {
  buyItem: (shopItem: ShopItem) => boolean;
  close: () => void;
}

export interface ExplorationAPI {
  move: (direction: Direction) => void;
  reset: () => void;
}

export interface PartyAPI {
  useFieldItem: (itemId: string, targetMemberId?: string) => { success: boolean; message: string };
  equipItem: (memberId: string, itemId: string) => { success: boolean; message: string };
  unequipItem: (memberId: string, slot: EquipmentSlot) => { success: boolean; message: string };
  recruitMember: (definition: PartyMemberDefinition) => boolean;
}

export interface SaveAPI {
  save: (slotId: number) => boolean;
  load: (slotId: number) => boolean;
  getSlots: () => SaveSlotInfo[];
  hasData: () => boolean;
}

// ==================== Hook ====================

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

  // ドメイングループ
  const battle = useMemo<BattleAPI>(() => ({
    selectCommand: (command: BattleCommand) => engine.selectBattleCommand(command),
    useSkill: (skill: SkillDefinition) => engine.useBattleSkill(skill),
    useItem: (itemId: string) => engine.useBattleItem(itemId),
    selectTarget: (targetIndex: number) => engine.selectBattleTarget(targetIndex),
    cancel: () => engine.cancelBattleSelection(),
    close: () => engine.closeBattle(),
  }), [engine]);

  const dialogue = useMemo<DialogueAPI>(() => ({
    selectChoice: (choice: DialogueChoice) => engine.selectDialogueChoice(choice),
    advance: () => engine.advanceDialogue(),
    close: () => engine.closeDialogue(),
  }), [engine]);

  const shop = useMemo<ShopAPI>(() => ({
    buyItem: (shopItem: ShopItem) => engine.buyItem(shopItem),
    close: () => engine.closeShop(),
  }), [engine]);

  const exploration = useMemo<ExplorationAPI>(() => ({
    move: (direction: Direction) => engine.move(direction),
    reset: () => engine.reset(),
  }), [engine]);

  const party = useMemo<PartyAPI>(() => ({
    useFieldItem: (itemId: string, targetMemberId?: string) => engine.useFieldItem(itemId, targetMemberId),
    equipItem: (memberId: string, itemId: string) => engine.equipItem(memberId, itemId),
    unequipItem: (memberId: string, slot: EquipmentSlot) => engine.unequipItem(memberId, slot),
    recruitMember: (definition: PartyMemberDefinition) => engine.recruitMember(definition),
  }), [engine]);

  const save = useMemo<SaveAPI>(() => ({
    save: (slotId: number) => engine.save(slotId),
    load: (slotId: number) => engine.load(slotId),
    getSlots: () => engine.getSaveSlots(),
    hasData: () => SaveManager.hasSaveData(),
  }), [engine]);

  // RenderableEntities取得
  const entities = useMemo<RenderableEntity[]>(() => {
    return engine.getRenderableEntities();
  }, [engine, state]);

  // キーボードイベント（バトル/会話/ショップ/ポーズ中は無効）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        exploration.move(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exploration, state.battle, state.dialogue, state.shop, isPaused]);

  return {
    state,
    entities,
    battle,
    dialogue,
    shop,
    exploration,
    party,
    save,
  };
}
