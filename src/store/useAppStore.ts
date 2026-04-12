import { create } from 'zustand';
import type { ContentData, Project, Category, BlogPost } from '../types';

interface AppState {
  site: any; sections: any[]; categories: Category[]; projects: Project[]; blogPosts: BlogPost[]; pages: any;
  loading: boolean; error: string | null;
  setContent: (data: Partial<ContentData>) => void; setLoading: (l: boolean) => void; setError: (e: string | null) => void;
  getProjectBySlug: (slug: string) => Project | undefined;
  getCategoryById: (id: string) => Category | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  site: null, sections: [], categories: [], projects: [], blogPosts: [], pages: {}, loading: false, error: null,
  setContent: (data) => set((state) => ({ ...state, ...data })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  getProjectBySlug: (slug: string) => get().projects.find((p) => p.slug === slug),
  getCategoryById: (id: string) => get().categories.find((c) => c.id === id),
}));
