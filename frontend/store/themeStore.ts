import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme:    'light' | 'dark';
  fontSize: 'sm' | 'md' | 'lg';
  setTheme:    (t: 'light' | 'dark') => void;
  setFontSize: (s: 'sm' | 'md' | 'lg') => void;
}

export const useThemeStore = create<ThemeState>()(persist(
  (set) => ({
    theme:       'light',
    fontSize:    'md',
    setTheme:    (theme)    => set({ theme }),
    setFontSize: (fontSize) => set({ fontSize }),
  }),
  { name: 'claudgpt-theme' }
));
