import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  nom: string;
  prix: number;
  quantite: number;
  image_cdn_url: string;
  shopOrigin?: string | null;
}

export interface DeliveryAddress {
  lat: number;
  lng: number;
  adresse_texte: string;
  repere: string;
  telephone: string;
}

interface CartStore {
  items: CartItem[];
  shopOrigin: string | null;
  deliveryAddress: DeliveryAddress | null;
  setShopOrigin: (slug: string | null) => void;
  setDeliveryAddress: (address: DeliveryAddress) => void;
  addItem: (product: Omit<CartItem, 'quantite'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      shopOrigin: null,
      deliveryAddress: null,
      setShopOrigin: (slug) => set({ shopOrigin: slug }),
      setDeliveryAddress: (address) => set({ deliveryAddress: address }),
      addItem: (product) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.productId === product.productId);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.productId === product.productId
                  ? { ...item, quantite: item.quantite + 1 }
                  : item,
              ),
              shopOrigin: state.shopOrigin ?? product.shopOrigin ?? null,
            };
          }

          return {
            items: [...state.items, { ...product, quantite: 1 }],
            shopOrigin: state.shopOrigin ?? product.shopOrigin ?? null,
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantite: Math.max(1, quantity) }
              : item,
          ),
        })),
      clear: () => set({ items: [], shopOrigin: null, deliveryAddress: null }),
    }),
    {
      name: 'deka-client-cart',
      partialize: (state) => ({
        items: state.items,
        shopOrigin: state.shopOrigin,
        deliveryAddress: state.deliveryAddress,
      }),
    },
  ),
);
