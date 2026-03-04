import { render, screen } from '../test/helpers';
import userEvent from '@testing-library/user-event';
import { createShopState, createShopItem } from '../test/helpers';
import { ShopModal } from './ShopModal';

describe('ShopModal', () => {
  describe('基本表示', () => {
    it('ショップ名が表示される', () => {
      render(
        <ShopModal
          shop={createShopState({ shopName: 'よろずや' })}
          playerGold={100}
          onBuyItem={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('よろずや')).toBeInTheDocument();
    });

    it('所持金が表示される', () => {
      render(
        <ShopModal
          shop={createShopState()}
          playerGold={500}
          onBuyItem={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('500 G')).toBeInTheDocument();
    });

    it('商品名と価格が表示される', () => {
      const shop = createShopState({
        items: [createShopItem({ item: { id: 'potion', name: 'やくそう', description: 'HPを回復' }, price: 50 })],
      });
      render(
        <ShopModal
          shop={shop}
          playerGold={100}
          onBuyItem={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('やくそう')).toBeInTheDocument();
      expect(screen.getByText('50 G')).toBeInTheDocument();
    });

    it('商品の説明が表示される', () => {
      const shop = createShopState({
        items: [createShopItem({ item: { id: 'potion', name: 'やくそう', description: 'HPを30回復する' }, price: 50 })],
      });
      render(
        <ShopModal
          shop={shop}
          playerGold={100}
          onBuyItem={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('HPを30回復する')).toBeInTheDocument();
    });
  });

  describe('在庫表示', () => {
    it('在庫-1（無限）のとき「∞」と表示される', () => {
      const shop = createShopState({
        items: [createShopItem({ stock: -1 })],
      });
      render(
        <ShopModal
          shop={shop}
          playerGold={100}
          onBuyItem={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('∞')).toBeInTheDocument();
    });

    it('在庫が有限のとき「残り X」と表示される', () => {
      const shop = createShopState({
        items: [createShopItem({ stock: 3 })],
      });
      render(
        <ShopModal
          shop={shop}
          playerGold={100}
          onBuyItem={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('残り 3')).toBeInTheDocument();
    });
  });

  describe('購入ボタン', () => {
    it('所持金が足りる場合「買う」ボタンが有効', () => {
      const shop = createShopState({
        items: [createShopItem({ price: 50 })],
      });
      render(
        <ShopModal
          shop={shop}
          playerGold={100}
          onBuyItem={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByRole('button', { name: '買う' })).not.toBeDisabled();
    });

    it('所持金が足りない場合「買う」ボタンが無効', () => {
      const shop = createShopState({
        items: [createShopItem({ price: 100 })],
      });
      render(
        <ShopModal
          shop={shop}
          playerGold={50}
          onBuyItem={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByRole('button', { name: '買う' })).toBeDisabled();
    });

    it('在庫0の場合「買う」ボタンが無効', () => {
      const shop = createShopState({
        items: [createShopItem({ price: 10, stock: 0 })],
      });
      render(
        <ShopModal
          shop={shop}
          playerGold={100}
          onBuyItem={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByRole('button', { name: '買う' })).toBeDisabled();
    });

    it('「買う」ボタンをクリックするとonBuyItemが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleBuyItem = vi.fn();
      const shopItem = createShopItem({ price: 50 });
      const shop = createShopState({ items: [shopItem] });

      render(
        <ShopModal
          shop={shop}
          playerGold={100}
          onBuyItem={handleBuyItem}
          onClose={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: '買う' }));
      expect(handleBuyItem).toHaveBeenCalledWith(shop.items[0]);
    });

    it('無効な「買う」ボタンをクリックしてもonBuyItemが呼ばれない', async () => {
      const user = userEvent.setup();
      const handleBuyItem = vi.fn();
      const shop = createShopState({
        items: [createShopItem({ price: 100 })],
      });

      render(
        <ShopModal
          shop={shop}
          playerGold={50}
          onBuyItem={handleBuyItem}
          onClose={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: '買う' }));
      expect(handleBuyItem).not.toHaveBeenCalled();
    });
  });

  describe('閉じる', () => {
    it('「閉じる」ボタンでonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(
        <ShopModal
          shop={createShopState()}
          playerGold={100}
          onBuyItem={vi.fn()}
          onClose={handleClose}
        />
      );

      await user.click(screen.getByRole('button', { name: '閉じる' }));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
