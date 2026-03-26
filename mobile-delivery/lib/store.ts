import { create } from 'zustand';

interface DeliveryTask {
  id: string;
  packageCode: string;
  status: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  lat?: number;
  lng?: number;
}

interface DeliveryStore {
  tasks: DeliveryTask[];
  isOnline: boolean;
  currentLocation: { lat: number; lng: number } | null;
  
  setTasks: (tasks: DeliveryTask[]) => void;
  addTask: (task: DeliveryTask) => void;
  updateTaskStatus: (packageCode: string, status: string) => void;
  setOnline: (online: boolean) => void;
  setCurrentLocation: (location: { lat: number; lng: number } | null) => void;
}

export const useDeliveryStore = create<DeliveryStore>((set) => ({
  tasks: [],
  isOnline: false,
  currentLocation: null,
  
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
}));
