import { DialogueEngine } from './DialogueEngine';
import { NPC } from '../models/NPC';
import type { NPCDefinition, DialogueChoice } from '../types/game';

function createNPCDef(overrides?: Partial<NPCDefinition>): NPCDefinition {
  return {
    id: 'test-npc',
    name: 'テスト村人',
    type: 'villager',
    dialogue: {
      startId: 'start',
      nodes: [
        {
          id: 'start',
          speaker: 'テスト村人',
          text: 'こんにちは！',
          nextId: 'second',
        },
        {
          id: 'second',
          speaker: 'テスト村人',
          text: 'いい天気ですね。',
          choices: [
            { id: 'bye', text: 'さようなら', action: { type: 'close' } },
          ],
        },
      ],
    },
    ...overrides,
  };
}

function createNPC(overrides?: Partial<NPCDefinition>): NPC {
  return new NPC(createNPCDef(overrides), 3, 4);
}

describe('DialogueEngine', () => {
  describe('基本的な会話フロー', () => {
    it('NPC に話しかけると最初のノードが表示される', () => {
      const npc = createNPC();
      const engine = new DialogueEngine(npc);
      const state = engine.getState();

      expect(state.isActive).toBe(true);
      expect(state.npcName).toBe('テスト村人');
      expect(state.currentNode?.id).toBe('start');
      expect(state.currentNode?.text).toBe('こんにちは！');
    });

    it('advance で次のノードに進む', () => {
      const npc = createNPC();
      const engine = new DialogueEngine(npc);

      engine.advance();

      const state = engine.getState();
      expect(state.currentNode?.id).toBe('second');
      expect(state.currentNode?.text).toBe('いい天気ですね。');
    });

    it('close を選ぶと会話が終了する', () => {
      const npc = createNPC();
      const engine = new DialogueEngine(npc);
      engine.advance(); // → second

      const closeChoice: DialogueChoice = {
        id: 'bye',
        text: 'さようなら',
        action: { type: 'close' },
      };
      engine.selectChoice(closeChoice);

      expect(engine.getState().isComplete).toBe(true);
      expect(engine.getState().isActive).toBe(false);
    });

    it('close() メソッドで直接会話を終了できる', () => {
      const npc = createNPC();
      const engine = new DialogueEngine(npc);

      engine.close();

      expect(engine.getState().isComplete).toBe(true);
    });
  });

  describe('選択肢のある会話', () => {
    it('選択肢を選ぶと対応するノードに遷移する', () => {
      const npc = createNPC({
        dialogue: {
          startId: 'start',
          nodes: [
            {
              id: 'start',
              speaker: 'NPC',
              text: '何を聞きたい？',
              choices: [
                { id: 'a', text: '町のこと', nextDialogueId: 'town_info' },
                { id: 'b', text: 'やめる', action: { type: 'close' } },
              ],
            },
            {
              id: 'town_info',
              speaker: 'NPC',
              text: 'ここは平和な町だよ。',
              choices: [
                { id: 'bye', text: 'ありがとう', action: { type: 'close' } },
              ],
            },
          ],
        },
      });
      const engine = new DialogueEngine(npc);

      const townChoice: DialogueChoice = {
        id: 'a',
        text: '町のこと',
        nextDialogueId: 'town_info',
      };
      engine.selectChoice(townChoice);

      expect(engine.getState().currentNode?.id).toBe('town_info');
      expect(engine.getState().currentNode?.text).toBe('ここは平和な町だよ。');
    });

    it('ショップを開く選択肢を選ぶと onOpenShop が呼ばれる', () => {
      const npc = createNPC({
        type: 'shopkeeper',
        dialogue: {
          startId: 'start',
          nodes: [
            {
              id: 'start',
              speaker: '商人',
              text: 'いらっしゃい！',
              choices: [
                { id: 'shop', text: '買い物', action: { type: 'open_shop' } },
              ],
            },
          ],
        },
      });
      const engine = new DialogueEngine(npc);
      const onOpenShop = vi.fn();
      engine.setCallbacks({ onOpenShop });

      const shopChoice: DialogueChoice = {
        id: 'shop',
        text: '買い物',
        action: { type: 'open_shop' },
      };
      engine.selectChoice(shopChoice);

      expect(onOpenShop).toHaveBeenCalledWith(npc);
    });
  });

  describe('回復NPC', () => {
    function createInnEngine() {
      const npc = createNPC({
        name: '宿屋',
        type: 'innkeeper',
        healCost: 20,
        dialogue: {
          startId: 'start',
          nodes: [
            {
              id: 'start',
              speaker: '宿屋',
              text: '一泊20ゴールドだよ',
              choices: [
                { id: 'rest', text: '泊まる', action: { type: 'heal', cost: 20 } },
                { id: 'bye', text: 'やめる', action: { type: 'close' } },
              ],
            },
            {
              id: 'healed',
              speaker: '宿屋',
              text: '元気になったね！',
              choices: [
                { id: 'bye', text: 'ありがとう', action: { type: 'close' } },
              ],
            },
            {
              id: 'no_money',
              speaker: '宿屋',
              text: 'お金が足りないよ。',
              choices: [
                { id: 'bye', text: '残念...', action: { type: 'close' } },
              ],
            },
          ],
        },
      });
      return { npc, engine: new DialogueEngine(npc) };
    }

    it('回復を選んでゴールドが足りると healed ノードに遷移する', () => {
      const { engine } = createInnEngine();
      const onHeal = vi.fn().mockReturnValue(true);
      engine.setCallbacks({ onHeal });

      const healChoice: DialogueChoice = {
        id: 'rest',
        text: '泊まる',
        action: { type: 'heal', cost: 20 },
      };
      engine.selectChoice(healChoice);

      expect(onHeal).toHaveBeenCalledWith(20);
      expect(engine.getState().currentNode?.id).toBe('healed');
    });

    it('ゴールドが足りないと no_money ノードに遷移する', () => {
      const { engine } = createInnEngine();
      const onHeal = vi.fn().mockReturnValue(false);
      engine.setCallbacks({ onHeal });

      const healChoice: DialogueChoice = {
        id: 'rest',
        text: '泊まる',
        action: { type: 'heal', cost: 20 },
      };
      engine.selectChoice(healChoice);

      expect(engine.getState().currentNode?.id).toBe('no_money');
    });
  });

  describe('条件付き開始ノード', () => {
    it('ゲームフラグに応じて開始ノードが変わる', () => {
      const npc = createNPC({
        conditionalStartIds: [
          {
            conditions: [{ key: 'quest_done', op: '>=', value: 1 }],
            startId: 'after_quest',
          },
        ],
        dialogue: {
          startId: 'start',
          nodes: [
            { id: 'start', speaker: 'NPC', text: 'クエスト前の会話' },
            { id: 'after_quest', speaker: 'NPC', text: 'クエスト完了後の会話' },
          ],
        },
      });

      // quest_done = 0 → デフォルトの start
      const engineBefore = new DialogueEngine(npc, () => 0);
      expect(engineBefore.getState().currentNode?.id).toBe('start');

      // quest_done = 1 → after_quest
      const engineAfter = new DialogueEngine(npc, (key) => key === 'quest_done' ? 1 : 0);
      expect(engineAfter.getState().currentNode?.id).toBe('after_quest');
    });
  });

  describe('set_state アクション', () => {
    it('set_state を選ぶと onSetState が呼ばれ、次のノードに遷移する', () => {
      const npc = createNPC({
        dialogue: {
          startId: 'start',
          nodes: [
            {
              id: 'start',
              speaker: 'NPC',
              text: 'クエストを受ける？',
              choices: [
                {
                  id: 'accept',
                  text: '受ける',
                  action: { type: 'set_state', key: 'quest', value: 1 },
                  nextDialogueId: 'accepted',
                },
              ],
            },
            {
              id: 'accepted',
              speaker: 'NPC',
              text: '頼んだぞ！',
              choices: [
                { id: 'bye', text: 'OK', action: { type: 'close' } },
              ],
            },
          ],
        },
      });
      const engine = new DialogueEngine(npc);
      const onSetState = vi.fn();
      engine.setCallbacks({ onSetState });

      const acceptChoice: DialogueChoice = {
        id: 'accept',
        text: '受ける',
        action: { type: 'set_state', key: 'quest', value: 1 },
        nextDialogueId: 'accepted',
      };
      engine.selectChoice(acceptChoice);

      expect(onSetState).toHaveBeenCalledWith('quest', 1);
      expect(engine.getState().currentNode?.id).toBe('accepted');
    });
  });

  describe('リスナー', () => {
    it('subscribe したリスナーに状態変更が通知される', () => {
      const npc = createNPC();
      const engine = new DialogueEngine(npc);
      const listener = vi.fn();
      engine.subscribe(listener);

      engine.advance();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].currentNode?.id).toBe('second');
    });

    it('unsubscribe 後はリスナーが呼ばれない', () => {
      const npc = createNPC();
      const engine = new DialogueEngine(npc);
      const listener = vi.fn();
      const unsubscribe = engine.subscribe(listener);

      unsubscribe();
      engine.advance();

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
