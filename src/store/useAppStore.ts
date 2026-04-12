import { create } from 'zustand';
import type { ContentData, Project, Category, StaticPage, SiteInfo } from '../types';

interface AppState {
  // Data
  site: SiteInfo | null;
  sections: any[];
  categories: Category[];
  projects: Project[];
  pages: Record<string, StaticPage>;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  setContent: (data: Partial<ContentData>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Selectors helpers
  getProjectBySlug: (slug: string) => Project | undefined;
  getProjectsByCategory: (categoryId: string) => Project[];
  getFeaturedProjects: (categoryId: string) => Project[];
  getCategoryById: (id: string) => Category | undefined;
  getPage: (pageId: string) => StaticPage | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  site: null,
  sections: [],
  categories: [],
  projects: [],
  pages: {},
  loading: false,
  error: null,

  // Actions
  setContent: (data) => set((state) => ({
    ...state,
    ...data,
  })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Selectors
  getProjectBySlug: (slug: string) => {
    return get().projects.find((p) => p.slug === slug);
  },

  getProjectsByCategory: (categoryId: string) => {
    return get().projects.filter(
      (p) => p.categoryId === categoryId && p.published
    );
  },

  getFeaturedProjects: (categoryId: string) => {
    return get().projects.filter(
      (p) => p.categoryId === categoryId && p.featuredOnHome && p.published
    );
  },

  getCategoryById: (id: string) => {
    return get().categories.find((c) => c.id === id);
  },

  getPage: (pageId: string) => {
    return get().pages[pageId];
  },
}));
