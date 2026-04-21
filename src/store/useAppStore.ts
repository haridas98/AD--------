import { create } from 'zustand';
import { DEFAULT_THEME_SETTINGS } from '../lib/themeTokens';
import type { ContentData, Project, Category, BlogPost, ThemeMode, ThemeSettings } from '../types';

const THEME_STORAGE_KEY = 'alexandradiz-theme-mode';

function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

interface AppState {
  site: any; sections: any[]; categories: Category[]; projects: Project[]; blogPosts: BlogPost[]; pages: any;
  loading: boolean; error: string | null;
  themeMode: ThemeMode;
  themeSettings: ThemeSettings;
  setContent: (data: Partial<ContentData>) => void; setLoading: (l: boolean) => void; setError: (e: string | null) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  getProjectBySlug: (slug: string) => Project | undefined;
  getCategoryById: (id: string) => Category | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  site: null, sections: [], categories: [], projects: [], blogPosts: [], pages: {}, loading: false, error: null,
  themeMode: getInitialThemeMode(),
  themeSettings: DEFAULT_THEME_SETTINGS,
  setContent: (data) => set((state) => ({ ...state, ...data, themeSettings: data.themeSettings || state.themeSettings })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setThemeMode: (themeMode) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    set({ themeMode });
  },
  toggleThemeMode: () => {
    const nextMode: ThemeMode = get().themeMode === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    set({ themeMode: nextMode });
  },
  getProjectBySlug: (slug: string) => get().projects.find((p) => p.slug === slug),
  getCategoryById: (id: string) => get().categories.find((c) => c.id === id),
}));
