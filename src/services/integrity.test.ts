import { sign, verify } from './integrity';

describe('integrity', () => {
  describe('sign', () => {
    it('同じ入力に対して同じ署名を生成する', () => {
      const data = '{"test": "data"}';
      const sig1 = sign(data);
      const sig2 = sign(data);

      expect(sig1).toBe(sig2);
    });

    it('異なる入力に対して異なる署名を生成する', () => {
      const sig1 = sign('data1');
      const sig2 = sign('data2');

      expect(sig1).not.toBe(sig2);
    });

    it('64文字のhex文字列を返す（SHA-256）', () => {
      const sig = sign('test');

      expect(sig).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('verify', () => {
    it('正しい署名に対して true を返す', () => {
      const data = '{"gold": 100}';
      const sig = sign(data);

      expect(verify(data, sig)).toBe(true);
    });

    it('不正な署名に対して false を返す', () => {
      const data = '{"gold": 100}';

      expect(verify(data, 'invalid-signature')).toBe(false);
    });

    it('データが改ざんされていたら false を返す', () => {
      const original = '{"gold": 100}';
      const sig = sign(original);
      const tampered = '{"gold": 999999}';

      expect(verify(tampered, sig)).toBe(false);
    });
  });
});
