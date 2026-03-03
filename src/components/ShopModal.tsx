import { ShopState, ShopItem } from '../types/game';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from './ui';

interface ShopModalProps {
  shop: ShopState;
  playerGold: number;
  onBuyItem: (item: ShopItem) => void;
  onClose: () => void;
}

export function ShopModal({
  shop,
  playerGold,
  onBuyItem,
  onClose,
}: ShopModalProps) {
  return (
    <Modal variant="shop">
      <ModalHeader className="shop-header">
        <div className="shop-title">{shop.shopName}</div>
        <div className="shop-gold">{playerGold} G</div>
      </ModalHeader>

      <ModalBody className="shop-body">
        <div className="shop-items">
          {shop.items.map((shopItem) => {
            const canAfford = playerGold >= shopItem.price;
            const inStock = shopItem.stock !== 0;
            const canBuy = canAfford && inStock;

            return (
              <div
                key={shopItem.item.id}
                className={`shop-item ${!canBuy ? 'disabled' : ''}`}
              >
                <div className="shop-item-info">
                  <div className="shop-item-name">{shopItem.item.name}</div>
                  <div className="shop-item-desc">{shopItem.item.description}</div>
                </div>
                <div className="shop-item-right">
                  <div className="shop-item-price">{shopItem.price} G</div>
                  <div className="shop-item-stock">
                    {shopItem.stock === -1 ? '∞' : `残り ${shopItem.stock}`}
                  </div>
                  <Button
                    size="small"
                    disabled={!canBuy}
                    onClick={() => canBuy && onBuyItem(shopItem)}
                  >
                    買う
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          閉じる
        </Button>
      </ModalFooter>
    </Modal>
  );
}
