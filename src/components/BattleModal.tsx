import { useEffect, useRef } from 'react';
import { BattleState, BattleCommand, SkillDefinition, EnemyBattleState, PartyState, InventoryItemState } from '../types/game';
import { Modal, Button, ListButton, MemberCardList } from './ui';

interface BattleModalProps {
  battle: BattleState;
  party: PartyState;
  onSelectCommand: (command: BattleCommand) => void;
  onUseSkill: (skill: SkillDefinition) => void;
  onUseItem: (itemId: string) => void;
  onSelectTarget: (targetIndex: number) => void;
  onCancel: () => void;
  onClose: () => void;
}

export function BattleModal({
  battle,
  party,
  onSelectCommand,
  onUseSkill,
  onUseItem,
  onSelectTarget,
  onCancel,
  onClose,
}: BattleModalProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battle.logs]);

  const isTargetSelecting = battle.phase === 'target_select';
  const currentMember = battle.partyMembers[battle.currentMemberIndex];
  const currentMemberState = party.members[battle.currentMemberIndex];

  return (
    <Modal variant="battle" className="battle-modal-custom">
      {/* 敵エリア */}
      <div className="battle-enemies-row">
        {battle.enemies.map((enemy, index) => (
          <EnemyCard
            key={enemy.id}
            enemy={enemy}
            index={index}
            isSelectable={isTargetSelecting && !enemy.isDead}
            isCurrentTurn={battle.phase === 'enemy_action' && battle.currentEnemyTurnIndex === index}
            onSelect={() => onSelectTarget(index)}
          />
        ))}
      </div>

      {/* バトルログ */}
      <div className="battle-log" ref={logRef}>
        {battle.logs.map((log) => (
          <div key={log.id} className={`battle-log-entry ${log.type}`}>
            {log.text}
          </div>
        ))}
      </div>

      {/* パーティーメンバーステータス */}
      <div className="battle-party-status">
        <MemberCardList
          members={battle.partyMembers}
          variant="battle"
          currentIndex={
            (battle.phase === 'command_select' || battle.phase === 'skill_select' ||
             battle.phase === 'item_select' || battle.phase === 'target_select')
              ? battle.currentMemberIndex : undefined
          }
          actingIndex={battle.phase === 'party_action' ? battle.currentMemberIndex : undefined}
        />
      </div>

      {/* コマンドエリア */}
      <div className="battle-command-area">
        {battle.phase === 'command_select' && currentMember && (
          <div className="battle-commands">
            <div className="battle-turn-indicator">{currentMember.name}のターン</div>
            <div className="battle-cmd-row">
              <Button size="medium" onClick={() => onSelectCommand('attack')}>
                こうげき
              </Button>
              <Button size="medium" onClick={() => onSelectCommand('skill')}>
                スキル
              </Button>
              <Button size="medium" onClick={() => onSelectCommand('item')}>
                アイテム
              </Button>
              <Button size="medium" onClick={() => onSelectCommand('defend')}>
                ぼうぎょ
              </Button>
            </div>
          </div>
        )}

        {battle.phase === 'target_select' && (
          <div className="battle-target-select">
            <div className="battle-select-title">ターゲットを選択</div>
            <div className="battle-target-hint">敵をクリックして選択</div>
            <Button variant="secondary" fullWidth onClick={onCancel}>
              もどる
            </Button>
          </div>
        )}

        {battle.phase === 'skill_select' && currentMemberState && (
          <div className="battle-skill-select">
            <div className="battle-select-title">{currentMember?.name}のスキル</div>
            <div className="battle-skill-list">
              {currentMemberState.skills.map((skill) => (
                <ListButton
                  key={skill.id}
                  label={skill.name}
                  value={<span className="mp-cost">MP {skill.mpCost}</span>}
                  onClick={() => onUseSkill(skill)}
                  disabled={!currentMember || currentMember.mp < skill.mpCost}
                />
              ))}
            </div>
            <Button variant="secondary" fullWidth onClick={onCancel}>
              もどる
            </Button>
          </div>
        )}

        {battle.phase === 'item_select' && (
          <div className="battle-item-select">
            <div className="battle-select-title">アイテム選択</div>
            <div className="battle-item-list">
              {party.inventory.filter((inv: InventoryItemState) => inv.canUseInBattle).length === 0 ? (
                <div className="battle-no-items">使えるアイテムがない</div>
              ) : (
                party.inventory
                  .filter((inv: InventoryItemState) => inv.canUseInBattle)
                  .map((inv: InventoryItemState) => (
                    <ListButton
                      key={inv.item.id}
                      label={inv.item.name}
                      value={`x${inv.quantity}`}
                      onClick={() => onUseItem(inv.item.id)}
                    />
                  ))
              )}
            </div>
            <Button variant="secondary" fullWidth onClick={onCancel}>
              もどる
            </Button>
          </div>
        )}

        {(battle.phase === 'party_action' || battle.phase === 'enemy_action') && (
          <div className="battle-waiting">
            {battle.phase === 'enemy_action' ? '敵のターン...' :
             battle.phase === 'party_action' ? `${currentMember?.name ?? ''}の行動...` : ''}
          </div>
        )}

        {battle.phase === 'battle_end' && (
          <div className="battle-result">
            <div className="battle-result-text">
              {battle.result === 'victory' ? '勝利！' : '敗北...'}
            </div>
            <Button size="large" onClick={onClose}>
              閉じる
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// 敵カードコンポーネント
interface EnemyCardProps {
  enemy: EnemyBattleState;
  index: number;
  isSelectable: boolean;
  isCurrentTurn: boolean;
  onSelect: () => void;
}

function EnemyCard({ enemy, isSelectable, isCurrentTurn, onSelect }: EnemyCardProps) {
  const hpPercent = (enemy.hp / enemy.maxHp) * 100;

  const cardClass = [
    'battle-enemy-card',
    enemy.isDead ? 'defeated' : '',
    isSelectable ? 'selectable' : '',
    isCurrentTurn ? 'current-turn' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClass}
      onClick={isSelectable ? onSelect : undefined}
    >
      <div className="battle-enemy-name">{enemy.name}</div>
      <div className="battle-enemy-sprite">
        {enemy.image ? (
          <img
            src={enemy.image}
            alt={enemy.name}
            className={`battle-enemy-image ${enemy.isDead ? 'dead' : ''}`}
          />
        ) : (
          <div className={`enemy-pixel-art ${enemy.isDead ? 'dead' : ''}`} />
        )}
      </div>
      <div className="battle-hp-bar enemy">
        <div
          className="battle-hp-fill"
          style={{ width: `${hpPercent}%` }}
        />
        <span className="battle-hp-text">
          {enemy.isDead ? 'DEAD' : `${enemy.hp}/${enemy.maxHp}`}
        </span>
      </div>
    </div>
  );
}
