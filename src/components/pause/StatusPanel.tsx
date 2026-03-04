import { PartyMemberState, CLASS_NAMES } from '../../types/game';

interface StatusPanelProps {
  members: PartyMemberState[];
  selectedMemberIndex: number;
  onSelectMember: (index: number) => void;
  onBack: () => void;
}

export function StatusPanel({
  members,
  selectedMemberIndex,
  onSelectMember,
  onBack,
}: StatusPanelProps) {
  const selectedMember = members[selectedMemberIndex];

  return (
    <div className="pause-split-layout">
      <div className="pause-left-panel narrow">
        <h3 className="panel-title">メンバー</h3>
        <div className="status-member-list">
          {members.map((member, index) => (
            <button
              key={member.id}
              className={`status-member-btn ${index === selectedMemberIndex ? 'active' : ''} ${!member.isAlive ? 'dead' : ''}`}
              onClick={() => onSelectMember(index)}
            >
              <span className="status-member-name">{member.name}</span>
              <span className="status-member-class">{CLASS_NAMES[member.class]}</span>
            </button>
          ))}
        </div>
        <button className="pause-back-btn" onClick={onBack}>
          もどる
        </button>
      </div>

      <div className="pause-right-panel wide">
        {selectedMember && (
          <div className="status-detail-new">
            <div className="status-header">
              <h3 className="status-name">{selectedMember.name}</h3>
              <span className="status-class-badge">{CLASS_NAMES[selectedMember.class]}</span>
            </div>

            <div className="status-sections">
              <div className="status-section-new">
                <h4>基本情報</h4>
                <div className="status-grid-new">
                  <div className="stat-row">
                    <span className="stat-label-new">レベル</span>
                    <span className="stat-value-new">{selectedMember.level}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label-new">経験値</span>
                    <span className="stat-value-new">{selectedMember.xp} / {selectedMember.xpToNext}</span>
                  </div>
                </div>
              </div>

              <div className="status-section-new">
                <h4>ステータス</h4>
                <div className="status-grid-new">
                  <div className="stat-row">
                    <span className="stat-label-new">HP</span>
                    <span className="stat-value-new">{selectedMember.hp} / {selectedMember.maxHp}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label-new">MP</span>
                    <span className="stat-value-new">{selectedMember.mp} / {selectedMember.maxMp}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label-new">攻撃力</span>
                    <span className="stat-value-new">{selectedMember.attack}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label-new">防御力</span>
                    <span className="stat-value-new">{selectedMember.defense}</span>
                  </div>
                </div>
              </div>

              <div className="status-section-new">
                <h4>装備</h4>
                <div className="status-grid-new">
                  <div className="stat-row">
                    <span className="stat-label-new">武器</span>
                    <span className="stat-value-new">{selectedMember.equipment.weapon?.name ?? '---'}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label-new">防具</span>
                    <span className="stat-value-new">{selectedMember.equipment.armor?.name ?? '---'}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label-new">装飾品</span>
                    <span className="stat-value-new">{selectedMember.equipment.accessory?.name ?? '---'}</span>
                  </div>
                </div>
              </div>

              <div className="status-section-new">
                <h4>スキル</h4>
                <div className="skill-list-new">
                  {selectedMember.skills.length === 0 ? (
                    <p className="no-skills">スキルがありません</p>
                  ) : (
                    selectedMember.skills.map((skill, index) => (
                      <div key={index} className="skill-row-new">
                        <span className="skill-name-new">{skill.name}</span>
                        <span className="skill-cost-new">MP {skill.mpCost}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="status-section-new">
                <h4>状態異常</h4>
                <div className="status-effects-list">
                  {selectedMember.statusEffects.length === 0 ? (
                    <p className="no-effects">状態異常はありません</p>
                  ) : (
                    selectedMember.statusEffects.map((effect) => (
                      <div key={effect.type} className="status-effect-row">
                        <span
                          className="status-effect-badge"
                          style={{ backgroundColor: effect.color }}
                        >
                          {effect.shortName}
                        </span>
                        <span className="status-effect-name">{effect.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
