import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthStore {
  user: User | null;
  isAdmin: boolean;
  tempApiKey: string | null;
  authLoading: boolean;
  setUser: (user: User | null) => void;
  setTempApiKey: (key: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAdmin: false,
  tempApiKey: null,
  authLoading: true,
  setUser: (user) => set({ 
    user, 
    isAdmin: user?.email === 'emmanuelfabiani23@gmail.com',
    authLoading: false
  }),
  setTempApiKey: (tempApiKey) => set({ tempApiKey }),
  setAuthLoading: (authLoading) => set({ authLoading }),
}));