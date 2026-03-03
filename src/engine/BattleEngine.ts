import {
  BattleState,
  BattlePhase,
  BattleResult,
  BattleCommand,
  BattleLogEntry,
  SkillDefinition,
  PartyMemberAction,
} from '../types/game';
import { Party, PartyMember, DamageItem, HealItem, CureItem } from '../models';
import { Enemy } from '../models/Enemy';

export type BattleEventListener = (state: BattleState) => void;

/**
 * パーティー対応バトルエンジン
 * ドラクエ風ターン順: 味方全員がコマンド選択 → 味方全員が行動 → 敵全員が行動
 */
export class BattleEngine {
  private party: Party;
  private enemies: Enemy[];
  private phase: BattlePhase;
  private result: BattleResult | null;
  private logs: BattleLogEntry[];
  private logId: number;
  private selectedCommand: BattleCommand | null;
  private selectedTargetIndex: number | null;
  private currentMemberIndex: number;        // 現在選択/行動中のメンバーインデックス
  private currentEnemyTurnIndex: number;
  private actionQueue: PartyMemberAction[];  // メンバーの行動キュー
  private pendingAction: { type: 'attack' | 'skill' | 'item'; skill?: SkillDefinition; itemId?: string } | null;
  private listeners: Set<BattleEventListener>;
  private onBattleEnd: ((result: BattleResult, enemies: Enemy[]) => void) | null;

  // 状態キャッシュ（パフォーマンス最適化）
  private stateCache: BattleState | null = null;
  private stateDirty: boolean = true;

  constructor(party: Party, enemies: Enemy[]) {
    this.party = party;
    this.enemies = enemies;
    this.phase = 'command_select';
    this.result = null;
    this.logs = [];
    this.logId = 0;
    this.selectedCommand = null;
    this.selectedTargetIndex = null;
    this.currentMemberIndex = 0;
    this.currentEnemyTurnIndex = 0;
    this.actionQueue = [];
    this.pendingAction = null;
    this.listeners = new Set();
    this.onBattleEnd = null;

    // 全員の防御状態をリセット
    this.party.resetAllDefend();

    // 敵出現ログ
    const enemyNames = enemies.map(e => e.name).join('、');
    this.addLog(`${enemyNames}が現れた！`, 'system');

    // 最初の生存メンバーを選択
    this.selectFirstAliveMember();
  }

  /**
   * 戦闘終了時のコールバックを設定
   */
  public setOnBattleEnd(callback: (result: BattleResult, enemies: Enemy[]) => void): void {
    this.onBattleEnd = callback;
  }

  /**
   * 生存中の敵を取得
   */
  private getAliveEnemies(): Enemy[] {
    return this.enemies.filter(e => !e.isDead());
  }

  /**
   * 生存中のパーティーメンバーを取得
   */
  private getAliveMembers(): PartyMember[] {
    return this.party.getAliveMembers();
  }

  /**
   * 現在のメンバーを取得
   */
  private getCurrentMember(): PartyMember | null {
    const members = this.party.getMembers();
    return members[this.currentMemberIndex] ?? null;
  }

  /**
   * 最初の生存メンバーを選択
   */
  private selectFirstAliveMember(): void {
    const members = this.party.getMembers();
    for (let i = 0; i < members.length; i++) {
      if (members[i].isAlive()) {
        this.currentMemberIndex = i;
        return;
      }
    }
  }

  /**
   * 次の生存メンバーへ移動
   * @returns 次のメンバーがいればtrue、全員選択完了ならfalse
   */
  private moveToNextAliveMember(): boolean {
    const members = this.party.getMembers();
    for (let i = this.currentMemberIndex + 1; i < members.length; i++) {
      if (members[i].isAlive()) {
        this.currentMemberIndex = i;
        return true;
      }
    }
    return false;
  }

  /**
   * コマンドを選択
   */
  public selectCommand(command: BattleCommand): void {
    if (this.phase !== 'command_select') return;

    this.selectedCommand = command;
    const member = this.getCurrentMember();
    if (!member) return;

    switch (command) {
      case 'attack':
        this.pendingAction = { type: 'attack' };
        this.goToTargetSelectOrAuto();
        break;
      case 'skill':
        this.phase = 'skill_select';
        break;
      case 'item':
        this.phase = 'item_select';
        break;
      case 'defend':
        this.queueDefendAction(member);
        break;
    }

    this.notifyListeners();
  }

  /**
   * ターゲット選択へ移行（敵が1体なら自動選択）
   */
  private goToTargetSelectOrAuto(): void {
    const aliveEnemies = this.getAliveEnemies();
    if (aliveEnemies.length === 1) {
      const targetIndex = this.enemies.findIndex(e => !e.isDead());
      this.phase = 'target_select';
      this.selectTarget(targetIndex);
    } else {
      this.phase = 'target_select';
    }
  }

  /**
   * スキルを選択
   */
  public useSkill(skill: SkillDefinition): void {
    if (this.phase !== 'skill_select') return;

    const member = this.getCurrentMember();
    if (!member) return;

    if (!member.canUseSkill(skill)) {
      this.addLog('MPが足りない！', 'system');
      this.phase = 'command_select';
      this.notifyListeners();
      return;
    }

    if (skill.type === 'attack') {
      this.pendingAction = { type: 'skill', skill };
      this.goToTargetSelectOrAuto();
    } else {
      // 回復スキルは自分に即キュー
      this.queueAction({
        memberId: member.id,
        command: 'skill',
        skill,
        partyTargetId: member.id,
      });
    }

    this.notifyListeners();
  }

  /**
   * アイテムを選択
   */
  public useItem(itemId: string): void {
    if (this.phase !== 'item_select') return;

    const member = this.getCurrentMember();
    if (!member) return;

    const itemCount = this.party.getItemCount(itemId);
    if (itemCount <= 0) {
      this.addLog('アイテムがない！', 'system');
      this.phase = 'command_select';
      this.notifyListeners();
      return;
    }

    // アイテムオブジェクトを取得してターゲット判定
    const item = this.party.getItem(itemId);
    if (!item) {
      this.addLog('アイテムがない！', 'system');
      this.phase = 'command_select';
      this.notifyListeners();
      return;
    }

    if (item.isTargetEnemy()) {
      this.pendingAction = { type: 'item', itemId };
      this.goToTargetSelectOrAuto();
    } else {
      // 自分対象アイテムは即キュー
      this.queueAction({
        memberId: member.id,
        command: 'item',
        itemId,
        partyTargetId: member.id,
      });
    }

    this.notifyListeners();
  }

  /**
   * 敵ターゲットを選択
   */
  public selectTarget(targetIndex: number): void {
    if (this.phase !== 'target_select') return;

    const target = this.enemies[targetIndex];
    if (!target || target.isDead()) return;

    const member = this.getCurrentMember();
    if (!member) return;

    this.selectedTargetIndex = targetIndex;

    if (this.pendingAction) {
      switch (this.pendingAction.type) {
        case 'attack':
          this.queueAction({
            memberId: member.id,
            command: 'attack',
            targetIndex,
          });
          break;
        case 'skill':
          if (this.pendingAction.skill) {
            this.queueAction({
              memberId: member.id,
              command: 'skill',
              skill: this.pendingAction.skill,
              targetIndex,
            });
          }
          break;
        case 'item':
          if (this.pendingAction.itemId) {
            this.queueAction({
              memberId: member.id,
              command: 'item',
              itemId: this.pendingAction.itemId,
              targetIndex,
            });
          }
          break;
      }
    }

    this.pendingAction = null;
    this.notifyListeners();
  }

  /**
   * 防御アクションをキューに追加
   */
  private queueDefendAction(member: PartyMember): void {
    this.queueAction({
      memberId: member.id,
      command: 'defend',
    });
  }

  /**
   * アクションをキューに追加し、次のメンバーへ
   */
  private queueAction(action: PartyMemberAction): void {
    this.actionQueue.push(action);
    this.selectedCommand = null;
    this.selectedTargetIndex = null;

    // 次の生存メンバーへ
    if (this.moveToNextAliveMember()) {
      this.phase = 'command_select';
    } else {
      // 全員選択完了 → 行動実行フェーズへ
      this.startPartyActionPhase();
    }
  }

  /**
   * 選択をキャンセル
   */
  public cancelSelection(): void {
    if (this.phase === 'skill_select' || this.phase === 'item_select' || this.phase === 'target_select') {
      this.phase = 'command_select';
      this.selectedCommand = null;
      this.pendingAction = null;
      this.notifyListeners();
    }
  }

  // ==================== 行動実行フェーズ ====================

  /**
   * パーティー行動フェーズを開始
   */
  private startPartyActionPhase(): void {
    this.phase = 'party_action';
    this.currentMemberIndex = 0;
    this.executeNextPartyAction();
  }

  /**
   * 次のパーティーメンバーの行動を実行
   */
  private executeNextPartyAction(): void {
    if (this.actionQueue.length === 0) {
      // 全員の行動完了 → 敵フェーズへ
      this.startEnemyPhase();
      return;
    }

    const action = this.actionQueue.shift()!;
    const member = this.party.getMemberById(action.memberId);

    // メンバーが死亡していたらスキップ
    if (!member || member.isDead()) {
      this.executeNextPartyAction();
      return;
    }

    // 現在のメンバーインデックスを更新（UI表示用）
    const members = this.party.getMembers();
    this.currentMemberIndex = members.findIndex(m => m.id === action.memberId);

    this.executePartyMemberAction(member, action);
  }

  /**
   * パーティーメンバーの行動を実行
   */
  private executePartyMemberAction(member: PartyMember, action: PartyMemberAction): void {
    switch (action.command) {
      case 'attack':
        this.executeAttack(member, action.targetIndex!);
        break;
      case 'skill':
        this.executeSkill(member, action.skill!, action.targetIndex, action.partyTargetId);
        break;
      case 'item':
        this.executeItem(member, action.itemId!, action.targetIndex, action.partyTargetId);
        break;
      case 'defend':
        this.executeDefend(member);
        break;
    }

    // 勝利チェック
    if (this.getAliveEnemies().length === 0) {
      this.result = 'victory';
      this.phase = 'battle_end';
      this.addLog('戦闘に勝利した！', 'system');
      this.onBattleEnd?.(this.result, this.enemies);
      this.notifyListeners();
      return;
    }

    // 次の行動へ（遅延付き）
    setTimeout(() => {
      this.executeNextPartyAction();
      this.notifyListeners();
    }, 400);
  }

  /**
   * 通常攻撃を実行
   */
  private executeAttack(member: PartyMember, targetIndex: number): void {
    const target = this.enemies[targetIndex];
    if (!target || target.isDead()) return;

    const damage = member.calculateAttackDamage();
    target.takeDamage(damage);

    this.addLog(`${member.name}の攻撃！`, 'player');
    this.addLog(`${target.name}に ${damage} のダメージ！`, 'damage');

    if (target.isDead()) {
      this.addLog(`${target.name}を倒した！`, 'system');
    }
  }

  /**
   * スキルを実行
   */
  private executeSkill(member: PartyMember, skill: SkillDefinition, targetIndex?: number, partyTargetId?: string): void {
    if (!member.useMp(skill.mpCost)) return;

    if (skill.type === 'attack' && targetIndex !== undefined) {
      const target = this.enemies[targetIndex];
      if (!target || target.isDead()) return;

      const damage = member.calculateSkillDamage(skill);
      target.takeDamage(damage);

      this.addLog(`${member.name}の${skill.name}！`, 'player');
      this.addLog(`${target.name}に ${damage} のダメージ！`, 'damage');

      if (target.isDead()) {
        this.addLog(`${target.name}を倒した！`, 'system');
      }
    } else if (skill.type === 'heal') {
      const target = partyTargetId ? this.party.getMemberById(partyTargetId) : member;
      if (!target) return;

      const healed = target.heal(skill.power);
      this.addLog(`${member.name}の${skill.name}！`, 'player');
      this.addLog(`${target.name}のHPが ${healed} 回復した！`, 'heal');
    }
  }

  /**
   * アイテムを実行
   */
  private executeItem(member: PartyMember, itemId: string, targetIndex?: number, partyTargetId?: string): void {
    const item = this.party.consumeItem(itemId);
    if (!item) return;

    this.addLog(`${member.name}は${item.name}を使った！`, 'player');

    switch (item.type) {
      case 'heal':
        const healTarget = partyTargetId ? this.party.getMemberById(partyTargetId) : member;
        if (healTarget && item instanceof HealItem) {
          const healed = healTarget.heal(item.healAmount);
          this.addLog(`${healTarget.name}のHPが ${healed} 回復した！`, 'heal');
        }
        break;
      case 'damage':
        if (targetIndex !== undefined && item instanceof DamageItem) {
          const target = this.enemies[targetIndex];
          if (target && !target.isDead()) {
            target.takeDamage(item.damage);
            this.addLog(`${target.name}に ${item.damage} のダメージ！`, 'damage');
            if (target.isDead()) {
              this.addLog(`${target.name}を倒した！`, 'system');
            }
          }
        }
        break;
      case 'cure':
        // 汎用状態異常治療
        const cureTarget = partyTargetId ? this.party.getMemberById(partyTargetId) : member;
        if (cureTarget && item instanceof CureItem) {
          if (cureTarget.hasStatusEffect(item.cureEffect)) {
            cureTarget.removeStatusEffect(item.cureEffect);
            // 状態異常名を取得して表示
            const effectNames: Record<string, string> = {
              poison: '毒',
              influenza: 'インフルエンザ',
            };
            const effectName = effectNames[item.cureEffect] || item.cureEffect;
            this.addLog(`${cureTarget.name}の${effectName}が治った！`, 'heal');
          } else {
            this.addLog(`しかし効果がなかった...`, 'system');
          }
        }
        break;
    }
  }

  /**
   * 防御を実行
   */
  private executeDefend(member: PartyMember): void {
    member.isDefending = true;
    this.addLog(`${member.name}は防御の構えをとった！`, 'player');
  }

  // ==================== 敵フェーズ ====================

  /**
   * 敵フェーズを開始
   */
  private startEnemyPhase(): void {
    this.currentEnemyTurnIndex = 0;
    this.executeNextEnemyTurn();
  }

  /**
   * 次の敵のターンを実行
   */
  private executeNextEnemyTurn(): void {
    while (this.currentEnemyTurnIndex < this.enemies.length) {
      const enemy = this.enemies[this.currentEnemyTurnIndex];
      if (!enemy.isDead()) {
        this.phase = 'enemy_action';
        this.executeEnemyTurn(enemy);
        return;
      }
      this.currentEnemyTurnIndex++;
    }

    // 全敵の行動が終了
    this.finishEnemyPhase();
  }

  /**
   * 敵のターンを実行
   */
  private executeEnemyTurn(enemy: Enemy): void {
    const action = this.decideEnemyAction(enemy);
    const aliveMembers = this.getAliveMembers();

    if (aliveMembers.length === 0) {
      this.result = 'defeat';
      this.phase = 'battle_end';
      this.addLog('敗北した...', 'system');
      this.onBattleEnd?.(this.result, this.enemies);
      this.notifyListeners();
      return;
    }

    if (action === 'wait') {
      this.addLog(`${enemy.name}は様子を見ている...`, 'enemy');
    } else {
      // ランダムな生存メンバーを攻撃
      const targetMember = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
      const damage = enemy.calculateAttackDamage();
      const bonusDamage = action === 'power_attack' ? Math.floor(damage * 0.5) : 0;
      const totalDamage = damage + bonusDamage;
      const actualDamage = targetMember.takeDamage(totalDamage);

      if (action === 'power_attack') {
        this.addLog(`${enemy.name}の強攻撃！`, 'enemy');
      } else if (targetMember.isDefending) {
        this.addLog(`${enemy.name}の攻撃！${targetMember.name}は防御した！`, 'enemy');
      } else {
        this.addLog(`${enemy.name}の攻撃！`, 'enemy');
      }
      this.addLog(`${targetMember.name}に ${actualDamage} のダメージ！`, 'damage');

      // 毒攻撃判定（特定の敵は毒を付与する可能性がある）
      const poisonChance = enemy.battleConfig.poisonChance ?? 0;
      if (poisonChance > 0 && !targetMember.isPoisoned && targetMember.isAlive() && Math.random() < poisonChance) {
        targetMember.poison();
        this.addLog(`${targetMember.name}は毒を受けた！`, 'damage');
      }

      if (targetMember.isDead()) {
        this.addLog(`${targetMember.name}は倒れた！`, 'system');
      }
    }

    // 敗北チェック
    if (this.party.isAllDead()) {
      this.result = 'defeat';
      this.phase = 'battle_end';
      this.addLog('敗北した...', 'system');
      this.onBattleEnd?.(this.result, this.enemies);
      this.notifyListeners();
      return;
    }

    // 次の敵へ
    this.currentEnemyTurnIndex++;

    setTimeout(() => {
      this.executeNextEnemyTurn();
      this.notifyListeners();
    }, 300);
  }

  /**
   * 敵フェーズ終了
   */
  private finishEnemyPhase(): void {
    // 全員の防御状態をリセット
    this.party.resetAllDefend();
    this.selectedCommand = null;
    this.selectedTargetIndex = null;
    this.actionQueue = [];

    // 状態異常のターン終了処理（毒ダメージなど）
    this.processStatusEffects();

    // パーティー全滅チェック
    if (this.party.isAllDead()) {
      this.result = 'defeat';
      this.phase = 'battle_end';
      this.addLog('敗北した...', 'system');
      this.onBattleEnd?.(this.result, this.enemies);
      this.notifyListeners();
      return;
    }

    // 次のターンへ
    this.selectFirstAliveMember();
    this.phase = 'command_select';
    this.notifyListeners();
  }

  /**
   * 状態異常のターン終了処理（汎用）
   * 毒、やけどなど、ターン終了時に効果を発揮する状態異常を処理
   */
  private processStatusEffects(): void {
    const members = this.party.getMembers();
    for (const member of members) {
      if (member.isAlive()) {
        const results = member.processStatusEffectsTurnEnd();
        for (const result of results) {
          // メッセージに改行が含まれる場合は分割して表示
          const messages = result.message.split('\n');
          for (const msg of messages) {
            if (msg.includes('倒れた')) {
              this.addLog(msg, 'system');
            } else {
              this.addLog(msg, 'damage');
            }
          }
        }
      }
    }
  }

  /**
   * 敵の行動を決定
   */
  private decideEnemyAction(enemy: Enemy): 'attack' | 'power_attack' | 'wait' {
    const aiType = enemy.battleConfig.aiType;
    const rand = Math.random();

    switch (aiType) {
      case 'aggressive':
        return rand < 0.3 ? 'power_attack' : 'attack';
      case 'defensive':
        return rand < 0.3 ? 'wait' : 'attack';
      case 'random':
      default:
        if (rand < 0.2) return 'power_attack';
        if (rand < 0.4) return 'wait';
        return 'attack';
    }
  }

  /**
   * ログを追加
   */
  private addLog(text: string, type: BattleLogEntry['type']): void {
    this.logs.push({ id: this.logId++, text, type });

    if (this.logs.length > 30) {
      this.logs = this.logs.slice(-30);
    }
  }

  /**
   * 状態を取得
   */
  public getState(): BattleState {
    // キャッシュが有効ならそのまま返す
    if (!this.stateDirty && this.stateCache) {
      return this.stateCache;
    }

    const members = this.party.getMembers();

    this.stateCache = {
      isActive: true,
      phase: this.phase,
      result: this.result,
      partyMembers: members.map(m => ({
        id: m.id,
        name: m.name,
        class: m.memberClass,
        hp: m.hp,
        maxHp: m.getEffectiveMaxHp(),
        mp: m.mp,
        maxMp: m.getEffectiveMaxMp(),
        attack: m.getEffectiveAttack(),
        defense: m.getEffectiveDefense(),
        isAlive: m.isAlive(),
        isDefending: m.isDefending,
        isPoisoned: m.isPoisoned,  // 後方互換性用
        statusEffects: m.getStatusEffectInfos(),  // 拡張用
      })),
      currentMemberIndex: this.currentMemberIndex,
      enemies: this.enemies.map((enemy, index) => ({
        id: index,
        name: enemy.name,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        image: enemy.image,
        isDead: enemy.isDead(),
      })),
      selectedTargetIndex: this.selectedTargetIndex,
      currentEnemyTurnIndex: this.currentEnemyTurnIndex,
      logs: [...this.logs],
      selectedCommand: this.selectedCommand,
      isDefending: members[this.currentMemberIndex]?.isDefending ?? false,
    };
    this.stateDirty = false;

    return this.stateCache;
  }

  /**
   * 状態を変更したことをマーク
   */
  private markDirty(): void {
    this.stateDirty = true;
  }

  /**
   * リスナーを登録
   */
  public subscribe(listener: BattleEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * リスナーに通知
   */
  private notifyListeners(): void {
    this.markDirty();
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
}
