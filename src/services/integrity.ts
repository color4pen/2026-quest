/**
 * セーブデータ改ざん検知用の署名関数
 * HMAC-SHA256を使用してカジュアルな改ざんを防止
 */

import { sha256 } from 'js-sha256';

// 署名用の固定鍵（public repoなので割り切り）
const SIGNING_KEY = 'rpg-save-integrity-2026';

/**
 * データに対するHMAC-SHA256署名を生成
 */
export function sign(data: string): string {
  return sha256.hmac(SIGNING_KEY, data);
}

/**
 * 署名を検証
 */
export function verify(data: string, signature: string): boolean {
  const expected = sign(data);
  return expected === signature;
}
