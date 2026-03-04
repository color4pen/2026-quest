import { DefendAction } from './DefendAction';
import type { ActionContext } from './Action';

describe('DefendAction', () => {
  function createContext(overrides?: Partial<ActionContext>): ActionContext {
    return {
      performer: {
        id: 'hero',
        name: '勇者',
        attack: 20,
        defense: 10,
        isDefending: false,
        isAlive: () => true,
      },
      allies: [],
      enemies: [],
      ...overrides,
    };
  }

  describe('基本情報', () => {
    it('id は defend', () => {
      const action = new DefendAction();
      expect(action.id).toBe('defend');
    });

    it('name は 防御', () => {
      const action = new DefendAction();
      expect(action.name).toBe('防御');
    });

    it('type は defend', () => {
      const action = new DefendAction();
      expect(action.type).toBe('defend');
    });

    it('targetType は self', () => {
      const action = new DefendAction();
      expect(action.getTargetType()).toBe('self');
    });
  });

  describe('canExecute', () => {
    it('生存していれば実行可能', () => {
      const action = new DefendAction();
      const context = createContext();

      expect(action.canExecute(context)).toBe(true);
    });

    it('死亡していれば実行不可', () => {
      const action = new DefendAction();
      const context = createContext({
        performer: {
          id: 'hero',
          name: '勇者',
          attack: 20,
          defense: 10,
          isDefending: false,
          isAlive: () => false,
        },
      });

      expect(action.canExecute(context)).toBe(false);
    });
  });

  describe('execute', () => {
    it('成功を返す', () => {
      const action = new DefendAction();
      const context = createContext();

      const result = action.execute(null, context);

      expect(result.success).toBe(true);
    });

    it('防御ログが出力される', () => {
      const action = new DefendAction();
      const context = createContext();

      const result = action.execute(null, context);

      expect(result.logs.length).toBe(1);
      expect(result.logs[0].text).toBe('勇者は防御の構えをとった！');
      expect(result.logs[0].type).toBe('player');
    });

    it('performerRef が渡されると defend() が呼ばれる', () => {
      const action = new DefendAction();
      const context = createContext();
      const defendMock = vi.fn();
      const performerRef = { defend: defendMock };

      action.execute(null, context, performerRef);

      expect(defendMock).toHaveBeenCalled();
    });
  });
});
