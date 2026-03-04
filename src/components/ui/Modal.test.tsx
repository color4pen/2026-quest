import { render, screen } from '../../test/helpers';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';

describe('Modal', () => {
  describe('基本表示', () => {
    it('子要素が表示される', () => {
      render(
        <Modal>
          <div>モーダルコンテンツ</div>
        </Modal>
      );
      expect(screen.getByText('モーダルコンテンツ')).toBeInTheDocument();
    });

    it('オーバーレイが表示される', () => {
      const { container } = render(<Modal><div>test</div></Modal>);
      expect(container.querySelector('.modal-overlay')).toBeInTheDocument();
    });

    it('コンテナが表示される', () => {
      const { container } = render(<Modal><div>test</div></Modal>);
      expect(container.querySelector('.modal-container')).toBeInTheDocument();
    });
  });

  describe('variant', () => {
    it('デフォルトはmodal-defaultクラス', () => {
      const { container } = render(<Modal><div>test</div></Modal>);
      expect(container.querySelector('.modal-default')).toBeInTheDocument();
    });

    it('variant="battle"でmodal-battleクラス', () => {
      const { container } = render(<Modal variant="battle"><div>test</div></Modal>);
      expect(container.querySelector('.modal-battle')).toBeInTheDocument();
    });

    it('variant="dialogue"でmodal-dialogueクラス', () => {
      const { container } = render(<Modal variant="dialogue"><div>test</div></Modal>);
      expect(container.querySelector('.modal-dialogue')).toBeInTheDocument();
    });

    it('variant="shop"でmodal-shopクラス', () => {
      const { container } = render(<Modal variant="shop"><div>test</div></Modal>);
      expect(container.querySelector('.modal-shop')).toBeInTheDocument();
    });

    it('variant="danger"でmodal-dangerクラス', () => {
      const { container } = render(<Modal variant="danger"><div>test</div></Modal>);
      expect(container.querySelector('.modal-danger')).toBeInTheDocument();
    });
  });

  describe('カスタムクラス', () => {
    it('追加のclassNameが適用される', () => {
      const { container } = render(<Modal className="custom-modal"><div>test</div></Modal>);
      expect(container.querySelector('.custom-modal')).toBeInTheDocument();
    });
  });
});

describe('ModalHeader', () => {
  it('子要素が表示される', () => {
    render(<ModalHeader>ヘッダータイトル</ModalHeader>);
    expect(screen.getByText('ヘッダータイトル')).toBeInTheDocument();
  });

  it('modal-headerクラスが付く', () => {
    const { container } = render(<ModalHeader>test</ModalHeader>);
    expect(container.querySelector('.modal-header')).toBeInTheDocument();
  });

  it('追加のclassNameが適用される', () => {
    const { container } = render(<ModalHeader className="custom-header">test</ModalHeader>);
    expect(container.querySelector('.custom-header')).toBeInTheDocument();
  });
});

describe('ModalBody', () => {
  it('子要素が表示される', () => {
    render(<ModalBody>ボディコンテンツ</ModalBody>);
    expect(screen.getByText('ボディコンテンツ')).toBeInTheDocument();
  });

  it('modal-bodyクラスが付く', () => {
    const { container } = render(<ModalBody>test</ModalBody>);
    expect(container.querySelector('.modal-body')).toBeInTheDocument();
  });

  it('追加のclassNameが適用される', () => {
    const { container } = render(<ModalBody className="custom-body">test</ModalBody>);
    expect(container.querySelector('.custom-body')).toBeInTheDocument();
  });
});

describe('ModalFooter', () => {
  it('子要素が表示される', () => {
    render(<ModalFooter>フッターコンテンツ</ModalFooter>);
    expect(screen.getByText('フッターコンテンツ')).toBeInTheDocument();
  });

  it('modal-footerクラスが付く', () => {
    const { container } = render(<ModalFooter>test</ModalFooter>);
    expect(container.querySelector('.modal-footer')).toBeInTheDocument();
  });

  it('追加のclassNameが適用される', () => {
    const { container } = render(<ModalFooter className="custom-footer">test</ModalFooter>);
    expect(container.querySelector('.custom-footer')).toBeInTheDocument();
  });
});

describe('Modal 組み合わせ', () => {
  it('Header, Body, Footerを組み合わせて使用できる', () => {
    render(
      <Modal variant="default">
        <ModalHeader>タイトル</ModalHeader>
        <ModalBody>本文</ModalBody>
        <ModalFooter>ボタン</ModalFooter>
      </Modal>
    );

    expect(screen.getByText('タイトル')).toBeInTheDocument();
    expect(screen.getByText('本文')).toBeInTheDocument();
    expect(screen.getByText('ボタン')).toBeInTheDocument();
  });
});
