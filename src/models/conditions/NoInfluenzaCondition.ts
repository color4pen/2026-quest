/**
 * インフルエンザ禁止条件
 *
 * パーティーの誰かがインフルエンザ状態だと通過できない
 */

import type { Party } from '../Party';
import type { PassCondition } from './PassCondition';

export class NoInfluenzaCondition implements PassCondition {
  readonly type = 'no_influenza';

  canPass(party: Party): boolean {
    return !party.getMembers().some(m => m.hasStatusEffect('influenza'));
  }

  getBlockedMessage(): string {
    return 'インフルエンザが治るまで外には出られない...';
  }
}
