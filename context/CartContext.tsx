import { DrugData } from '@/services/api';
import { storage } from '@/utils/storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const CART_STORAGE_KEY = 'drug_requisitions';

export interface DrugReqItem {
  pharmacy_drug_id: string;
  medication_name: string;
  quantity: number;
  unit_price: number;
  requiresPrescription: boolean;
}

// One requisition per pharmacy, since an order can only go to one pharmacy.
export interface DrugReqData {
  pharmacy_id: string;
  prescription_id: string | null;
  delivery_address: string | null;
  notes: string | null;
  items: DrugReqItem[];
}

interface CartContextType {
  drugRequisition: DrugReqData[];
  /** Total number of units across every pharmacy. */
  itemCount: number;
  /** True once the saved cart has been loaded from storage. */
  hydrated: boolean;
  addToCart: (args: {
    data: DrugData;
    pharmacyId: string;
    quantity: number;
  }) => Promise<void>;
  removeFromCart: (args: {
    data: DrugData;
    pharmacyId: string;
  }) => Promise<void>;
  updateQuantity: (args: {
    data: DrugData;
    pharmacyId: string;
    quantity: number;
  }) => Promise<void>;
  /** Clears one pharmacy's requisition, or everything when no id is given. */
  clearCart: (pharmacyId?: string) => Promise<void>;
  getQuantity: (drugId: string, pharmacyId: string) => number;
  getPharmacyTotal: (pharmacyId: string) => number;
  /** Set prescription, address or notes on a pharmacy's requisition. */
  updateRequisitionDetails: (
    pharmacyId: string,
    details: Partial<
      Pick<DrugReqData, 'prescription_id' | 'delivery_address' | 'notes'>
    >
  ) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

// Highest quantity allowed for a drug (`stock: null` means stock isn't tracked).
const maxQty = (drug: DrugData): number => drug.stock ?? Infinity;

const isPurchasable = (drug: DrugData): boolean =>
  drug.available !== false && drug.stock !== 0;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [drugRequisition, setDrugRequisition] = useState<DrugReqData[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  // Load saved cart once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await storage.getItem(CART_STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setDrugRequisition(parsed);
        }
      } catch (error) {
        console.error('Failed to load cart', error);
      } finally {
        if (!cancelled) {
          hydratedRef.current = true;
          setHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Save on every change, but only after the initial load so we never
  // overwrite the saved cart with the empty default.
  useEffect(() => {
    if (!hydratedRef.current) return;
    storage
      .setItem(CART_STORAGE_KEY, JSON.stringify(drugRequisition))
      .catch((error: unknown) => console.error('Failed to save cart', error));
  }, [drugRequisition]);

  const addToCart: CartContextType['addToCart'] = useCallback(
    async ({ data, pharmacyId, quantity }) => {
      if (!data || !pharmacyId || quantity < 1 || !isPurchasable(data)) return;

      setDrugRequisition((prev) => {
        const existing = prev.find((r) => r.pharmacy_id === pharmacyId);

        // No requisition for this pharmacy yet: start one.
        if (!existing) {
          return [
            ...prev,
            {
              pharmacy_id: pharmacyId,
              prescription_id: null,
              delivery_address: null,
              notes: null,
              items: [
                {
                  pharmacy_drug_id: data.id,
                  medication_name: data.name,
                  quantity: Math.min(quantity, maxQty(data)),
                  unit_price: data.price,
                  requiresPrescription: data.requiresPrescription ?? false,
                },
              ],
            },
          ];
        }

        const hasDrug = existing.items.some(
          (i) => i.pharmacy_drug_id === data.id
        );

        return prev.map((req) => {
          if (req.pharmacy_id !== pharmacyId) return req;

          // Same drug again: bump quantity (capped at stock) instead of duplicating.
          if (hasDrug) {
            return {
              ...req,
              items: req.items.map((i) =>
                i.pharmacy_drug_id === data.id
                  ? {
                      ...i,
                      quantity: Math.min(i.quantity + quantity, maxQty(data)),
                      unit_price: data.price, // keep price fresh
                    }
                  : i
              ),
            };
          }

          return {
            ...req,
            items: [
              ...req.items,
              {
                pharmacy_drug_id: data.id,
                medication_name: data.name,
                quantity: Math.min(quantity, maxQty(data)),
                unit_price: data.price,
                requiresPrescription: data.requiresPrescription ?? false,
              },
            ],
          };
        });
      });
    },
    []
  );

  const removeFromCart: CartContextType['removeFromCart'] = useCallback(
    async ({ data, pharmacyId }) => {
      if (!data || !pharmacyId) return;

      setDrugRequisition((prev) =>
        prev
          .map((req) =>
            req.pharmacy_id === pharmacyId
              ? {
                  ...req,
                  items: req.items.filter(
                    (i) => i.pharmacy_drug_id !== data.id
                  ),
                }
              : req
          )
          // Drop a pharmacy's requisition once its last item is gone.
          .filter((req) => req.items.length > 0)
      );
    },
    []
  );

  const updateQuantity: CartContextType['updateQuantity'] = useCallback(
    async ({ data, pharmacyId, quantity }) => {
      if (!data || !pharmacyId) return;

      // Setting quantity to 0 or below removes the item.
      if (quantity < 1) {
        await removeFromCart({ data, pharmacyId });
        return;
      }

      setDrugRequisition((prev) =>
        prev.map((req) =>
          req.pharmacy_id === pharmacyId
            ? {
                ...req,
                items: req.items.map((i) =>
                  i.pharmacy_drug_id === data.id
                    ? { ...i, quantity: Math.min(quantity, maxQty(data)) }
                    : i
                ),
              }
            : req
        )
      );
    },
    [removeFromCart]
  );

  const clearCart: CartContextType['clearCart'] = useCallback(
    async (pharmacyId) => {
      setDrugRequisition((prev) =>
        pharmacyId ? prev.filter((r) => r.pharmacy_id !== pharmacyId) : []
      );
    },
    []
  );

  const updateRequisitionDetails: CartContextType['updateRequisitionDetails'] =
    useCallback(async (pharmacyId, details) => {
      setDrugRequisition((prev) =>
        prev.map((req) =>
          req.pharmacy_id === pharmacyId ? { ...req, ...details } : req
        )
      );
    }, []);

  const getQuantity = useCallback(
    (drugId: string, pharmacyId: string): number =>
      drugRequisition
        .find((r) => r.pharmacy_id === pharmacyId)
        ?.items.find((i) => i.pharmacy_drug_id === drugId)?.quantity ?? 0,
    [drugRequisition]
  );

  const getPharmacyTotal = useCallback(
    (pharmacyId: string): number =>
      drugRequisition
        .find((r) => r.pharmacy_id === pharmacyId)
        ?.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0) ?? 0,
    [drugRequisition]
  );

  const itemCount = useMemo(
    () =>
      drugRequisition.reduce(
        (sum, req) => sum + req.items.reduce((s, i) => s + i.quantity, 0),
        0
      ),
    [drugRequisition]
  );

  const value = useMemo<CartContextType>(
    () => ({
      drugRequisition,
      itemCount,
      hydrated,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getQuantity,
      getPharmacyTotal,
      updateRequisitionDetails,
    }),
    [
      drugRequisition,
      itemCount,
      hydrated,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getQuantity,
      getPharmacyTotal,
      updateRequisitionDetails,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
