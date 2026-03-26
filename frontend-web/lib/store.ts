import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  role: string;
  kycStatus: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
}));
