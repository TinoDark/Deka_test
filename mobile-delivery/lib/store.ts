import { create } from 'zustand';

export type PickupLocation = {
  storeName: string;
  address: string;
  lat: number;
  lng: number;
};

export interface DeliveryTask {
  id: string;
  packageCode: string;
  status: 'PENDING' | 'COLLECTED' | 'IN_TRANSIT' | 'DELIVERED';
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  pickups: PickupLocation[];
  totalAmount: number;
  amountDue: number;
  cod: boolean;
}

export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'APPROVED';

export interface KycInfo {
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  submittedAt?: number;
  approvedAt?: number;
}

interface DeliveryStore {
  tasks: DeliveryTask[];
  isOnline: boolean;
  currentLocation: { lat: number; lng: number } | null;
  walletBalance: number;
  kycStatus: KycStatus;
  kycInfo: KycInfo;

  setTasks: (tasks: DeliveryTask[]) => void;
  addTask: (task: DeliveryTask) => void;
  updateTaskStatus: (packageCode: string, status: DeliveryTask['status']) => void;
  setOnline: (online: boolean) => void;
  setCurrentLocation: (location: { lat: number; lng: number } | null) => void;
  depositCodPayment: (amount: number) => void;
  submitKyc: (info: KycInfo) => void;
  approveKyc: () => void;
}

export const useDeliveryStore = create<DeliveryStore>((set) => ({
  tasks: [],
  isOnline: false,
  currentLocation: null,
  walletBalance: 0,
  kycStatus: 'NOT_STARTED',
  kycInfo: {},

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTaskStatus: (packageCode, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.packageCode === packageCode ? { ...t, status } : t
      ),
    })),
  setOnline: (online) => set({ isOnline: online }),
  setCurrentLocation: (location) => set({ currentLocation: location }),
  depositCodPayment: (amount) =>
    set((state) => ({ walletBalance: state.walletBalance + amount })),
  submitKyc: (info) =>
    set({ kycInfo: { ...info, submittedAt: Date.now() }, kycStatus: 'PENDING' }),
  approveKyc: () =>
    set((state) => ({
      kycStatus: 'APPROVED',
      kycInfo: { ...state.kycInfo, approvedAt: Date.now() },
    })),
}));
