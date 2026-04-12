import { create } from 'zustand';
import type { ContentData, Project, Category, StaticPage, SiteInfo } from '../types';

interface AppState {
  site: SiteInfo | null;
  sections: any[];
  categories: Category[];
  projects: Project[];
  pages: Record<string, StaticPage>;
  loading: boolean;
  error: string | null;

  setContent: (data: Partial<ContentData>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  getProjectBySlug: (slug: string) => Project | undefined;
  getProjectsByCategory: (categoryId: string) => Project[];
  getFeaturedProjects: (categoryId: string) => Project[];
  getCategoryById: (id: string) => Category | undefined;
  getPage: (pageId: string) => StaticPage | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  site: null,
  sections: [],
  categories: [],
  projects: [],
  pages: {},
  loading: false,
  error: null,

  setContent: (data) => set((state) => ({ ...state, ...data })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  getProjectBySlug: (slug: string) => get().projects.find((p) => p.slug === slug),
  getProjectsByCategory: (categoryId: string) =>
    get().projects.filter((p) => p.categoryId === categoryId && p.isPublished),
  getFeaturedProjects: (categoryId: string) =>
    get().projects.filter((p) => p.categoryId === categoryId && p.isFeatured && p.isPublished),
  getCategoryById: (id: string) => get().categories.find((c) => c.id === id),
  getPage: (pageId: string) => get().pages[pageId],
}));
