import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
interface AuthState { user: User | null; token: string | null; isAuthenticated: boolean; setUser: (u: User | null) => void; setToken: (t: string | null) => void; clear: () => void; }
export const useAuthStore = create<AuthState>()(persist((set) => ({
  user: null, token: null, isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  clear: () => set({ user: null, token: null, isAuthenticated: false }),
}), { name: 'claudgpt-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }));
