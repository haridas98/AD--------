import { create } from 'zustand';
import { DEFAULT_HOMEPAGE_SETTINGS } from '../lib/homepageSettings';
import { DEFAULT_THEME_SETTINGS } from '../lib/themeTokens';
import type { ContentData, Project, Category, BlogPost, Testimonial, ThemeMode, ThemeSettings, HomepageSettings } from '../types';

const THEME_STORAGE_KEY = 'alexandradiz-theme-mode';

function getInitialThemeMode(): ThemeMode {
  return 'light';
}

interface AppState {
  site: any; sections: any[]; categories: Category[]; projects: Project[]; blogPosts: BlogPost[]; testimonials: Testimonial[]; pages: any;
  loading: boolean; error: string | null;
  themeMode: ThemeMode;
  themeSettings: ThemeSettings;
  homepageSettings: HomepageSettings;
  setContent: (data: Partial<ContentData>) => void; setLoading: (l: boolean) => void; setError: (e: string | null) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  getProjectBySlug: (slug: string) => Project | undefined;
  getCategoryById: (id: string) => Category | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  site: null, sections: [], categories: [], projects: [], blogPosts: [], testimonials: [], pages: {}, loading: false, error: null,
  themeMode: getInitialThemeMode(),
  themeSettings: DEFAULT_THEME_SETTINGS,
  homepageSettings: DEFAULT_HOMEPAGE_SETTINGS,
  setContent: (data) => set((state) => ({
    ...state,
    ...data,
    themeSettings: data.themeSettings || state.themeSettings,
    homepageSettings: data.homepageSettings || state.homepageSettings,
  })),
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
