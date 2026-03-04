import { NPCDefinition } from '../types/npc';
import { ItemFactory } from '../models/items/ItemFactory';
import { ITEM_IDS } from './itemIds';

export const NPC_DEFINITIONS: NPCDefinition[] = [
  {
    id: 'home_pc',
    name: 'パソコン',
    type: 'villager',
    renderType: 'computer',
    dialogue: {
      startId: 'start',
      nodes: [
        {
          id: 'start',
          speaker: 'パソコン',
          text: '「Escape from Tarkov」ハードコアなFPSだが、ゴミ拾いと荷物整理がやめられない...',
          choices: [
            { id: 'bye', text: '閉じる', action: { type: 'close' } },
          ],
        },
      ],
    },
  },
  {
    id: 'shopkeeper_1',
    name: '商人',
    type: 'shopkeeper',
    dialogue: {
      startId: 'start',
      nodes: [
        {
          id: 'start',
          speaker: '商人',
          text: 'いらっしゃい！何かお探しかい？',
          choices: [
            { id: 'shop', text: '買い物をする', action: { type: 'open_shop' } },
            { id: 'bye', text: '見てるだけ', action: { type: 'close' } },
          ],
        },
      ],
    },
    shopItems: [
      { item: ItemFactory.getDefinition(ITEM_IDS.POTION)!, price: 30, stock: -1 },
      { item: ItemFactory.getDefinition(ITEM_IDS.HI_POTION)!, price: 80, stock: -1 },
      { item: ItemFactory.getDefinition(ITEM_IDS.BOMB)!, price: 50, stock: 5 },
    ],
  },
  {
    id: 'innkeeper_1',
    name: '宿屋の主人',
    type: 'innkeeper',
    image: '/assets/images/npcs/innkeeper.png',
    healCost: 20,
    dialogue: {
      startId: 'start',
      nodes: [
        {
          id: 'start',
          speaker: '宿屋の主人',
          text: 'ようこそ！一泊20ゴールドで休めるよ。HPとMPが全回復するさ。',
          choices: [
            { id: 'rest', text: '泊まる（20G）', action: { type: 'heal', cost: 20 } },
            { id: 'bye', text: 'やめておく', action: { type: 'close' } },
          ],
        },
        {
          id: 'healed',
          speaker: '宿屋の主人',
          text: 'ゆっくり休めたかい？元気になったね！',
          choices: [
            { id: 'bye', text: 'ありがとう', action: { type: 'close' } },
          ],
        },
        {
          id: 'no_money',
          speaker: '宿屋の主人',
          text: 'おっと、お金が足りないみたいだね。また来てくれ。',
          choices: [
            { id: 'bye', text: '残念...', action: { type: 'close' } },
          ],
        },
      ],
    },
  },
  {
    id: 'villager_entrance',
    name: '村人',
    type: 'villager',
    dialogue: {
      startId: 'start',
      nodes: [
        {
          id: 'start',
          speaker: '村人',
          text: 'ここは「はじまりの村」だよ。ようこそ！',
          choices: [
            { id: 'bye', text: 'ありがとう', action: { type: 'close' } },
          ],
        },
      ],
    },
  },
  {
    id: 'elder',
    name: '村の長老',
    type: 'villager',
    // 条件付き会話開始（上から順に評価）
    conditionalStartIds: [
      // クエスト完了後
      {
        conditions: [{ key: 'quest_forest', op: '>=', value: 3 }],
        startId: 'completed',
      },
      // ボス撃破後（報酬まだ）
      {
        conditions: [{ key: 'quest_forest', op: '==', value: 2 }],
        startId: 'reward',
      },
      // クエスト受注済み
      {
        conditions: [{ key: 'quest_forest', op: '==', value: 1 }],
        startId: 'in_progress',
      },
    ],
    dialogue: {
      startId: 'start',  // デフォルト（クエスト未受注）
      nodes: [
        // === クエスト未受注 ===
        {
          id: 'start',
          speaker: '村の長老',
          text: 'おお、旅の者か。実は困っておるのじゃ...南の洞窟に凶暴なモンスターが住み着いてしまってな。',
          nextId: 'request',
        },
        {
          id: 'request',
          speaker: '村の長老',
          text: '村の若者では歯が立たぬ。どうか、あのモンスターを退治してはくれぬか？',
          choices: [
            {
              id: 'accept',
              text: '引き受けよう',
              action: { type: 'set_state', key: 'quest_forest', value: 1 },
              nextDialogueId: 'accepted',
            },
            { id: 'ask', text: '報酬は？', nextDialogueId: 'reward_info' },
            { id: 'bye', text: '少し考えさせてくれ', action: { type: 'close' } },
          ],
        },
        {
          id: 'reward_info',
          speaker: '村の長老',
          text: '報酬か...そうじゃな、村に伝わる秘薬を授けよう。どんな傷も癒やす霊薬じゃ。',
          choices: [
            {
              id: 'accept',
              text: 'わかった、引き受けよう',
              action: { type: 'set_state', key: 'quest_forest', value: 1 },
              nextDialogueId: 'accepted',
            },
            { id: 'bye', text: '考えておく', action: { type: 'close' } },
          ],
        },
        {
          id: 'accepted',
          speaker: '村の長老',
          text: 'おお、引き受けてくれるか！ありがたい...洞窟は村を出て南に進んだ先にある。くれぐれも気をつけてな。',
          choices: [
            { id: 'bye', text: '任せてくれ', action: { type: 'close' } },
          ],
        },

        // === クエスト受注済み（進行中） ===
        {
          id: 'in_progress',
          speaker: '村の長老',
          text: '洞窟のモンスターはまだ暴れておるようじゃ...頼んだぞ、勇者よ。南の洞窟じゃ、忘れるでないぞ。',
          choices: [
            { id: 'bye', text: '必ず倒してくる', action: { type: 'close' } },
          ],
        },

        // === ボス撃破後（報酬受け取り） ===
        {
          id: 'reward',
          speaker: '村の長老',
          text: 'おお！その顔は...まさか、洞窟のモンスターを倒してくれたのか！？',
          nextId: 'reward_give',
        },
        {
          id: 'reward_give',
          speaker: '村の長老',
          text: 'なんと勇ましい...！約束の秘薬じゃ、受け取ってくれ。村を救ってくれて、本当にありがとう。',
          choices: [
            {
              id: 'receive',
              text: '秘薬を受け取る',
              action: {
                type: 'give_item',
                item: ItemFactory.getDefinition(ITEM_IDS.ELIXIR)!,
                quantity: 1,
              },
              nextDialogueId: 'reward_received',
            },
          ],
        },
        {
          id: 'reward_received',
          speaker: '村の長老',
          text: 'これからも村のことを頼むぞ。お主のような勇者がおれば、この村も安泰じゃ。',
          choices: [
            {
              id: 'bye',
              text: 'まだまだこれからだ',
              action: { type: 'set_state', key: 'quest_forest', value: 3 },
            },
          ],
        },

        // === クエスト完了後 ===
        {
          id: 'completed',
          speaker: '村の長老',
          text: 'おお、村の英雄殿。洞窟が静かになってから、村人たちも安心して暮らしておるよ。本当にありがとう。',
          choices: [
            { id: 'bye', text: 'お元気で', action: { type: 'close' } },
          ],
        },
      ],
    },
  },
  {
    id: 'developer_npc',
    name: '謎の技術者',
    type: 'villager',
    dialogue: {
      startId: 'start',
      nodes: [
        {
          id: 'start',
          speaker: '謎の技術者',
          text: 'やあ、この扉の仕組みに興味があるのかい？',
          choices: [
            { id: 'architecture', text: '設計について教えて', nextDialogueId: 'architecture' },
            { id: 'condition', text: '通過条件って何？', nextDialogueId: 'condition' },
            { id: 'future', text: '今後の拡張は？', nextDialogueId: 'future' },
            { id: 'bye', text: '興味ない', action: { type: 'close' } },
          ],
        },
        {
          id: 'architecture',
          speaker: '謎の技術者',
          text: 'この扉はDoorクラスで管理されているんだ。各扉にはidと座標、そしてオプションでPassConditionを持てる設計さ。',
          choices: [
            { id: 'architecture2', text: 'もっと詳しく', nextDialogueId: 'architecture2' },
            { id: 'back', text: '他の話を聞く', nextDialogueId: 'start' },
          ],
        },
        {
          id: 'architecture2',
          speaker: '謎の技術者',
          text: 'GameMapがDoorオブジェクトを保持し、プレイヤー移動時にgetDoorAt()で扉を取得。canPass(party)で通過判定をしているんだ。',
          choices: [
            { id: 'back', text: 'なるほど', nextDialogueId: 'start' },
          ],
        },
        {
          id: 'condition',
          speaker: '謎の技術者',
          text: 'PassConditionはインターフェースで、canPass()とgetBlockedMessage()を持つ。この家の扉にはNoInfluenzaConditionが設定されているよ。',
          choices: [
            { id: 'condition2', text: 'どう判定してる？', nextDialogueId: 'condition2' },
            { id: 'back', text: '他の話を聞く', nextDialogueId: 'start' },
          ],
        },
        {
          id: 'condition2',
          speaker: '謎の技術者',
          text: 'party.getMembers()で全メンバーを取得し、hasStatusEffect("influenza")でインフルエンザ状態をチェック。一人でも感染してたら通れないんだ。',
          choices: [
            { id: 'back', text: '厳しいね', nextDialogueId: 'start' },
          ],
        },
        {
          id: 'future',
          speaker: '謎の技術者',
          text: 'ConditionFactoryでcondition typeから条件を生成している。将来は鍵システムも追加できる設計さ。',
          choices: [
            { id: 'future2', text: '鍵システム？', nextDialogueId: 'future2' },
            { id: 'back', text: '他の話を聞く', nextDialogueId: 'start' },
          ],
        },
        {
          id: 'future2',
          speaker: '謎の技術者',
          text: 'conditionをオブジェクト型に変更すれば、{ type: "has_key", params: { keyId: "red_key" } }のようにパラメータを渡せる。コードにTODOコメントも残してあるよ。',
          choices: [
            { id: 'bye', text: '勉強になった！', action: { type: 'close' } },
            { id: 'back', text: '他の話を聞く', nextDialogueId: 'start' },
          ],
        },
      ],
    },
  },
];
