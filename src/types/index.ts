export interface SiteInfo { name: string; phone: string; email: string; instagram: string; facebook: string; houzz: string; }
export interface Section { id: string; name: string; type: string; slug?: string; }
export interface Category { id: string; name: string; slug: string; description?: string; showInHeader: boolean; sortOrder: number; }
export interface BlockItem { type: string; data: Record<string, any>; id?: string; }
export type ProjectStylePreset = 'default' | 'kids' | 'minimal' | 'luxury' | 'warm' | 'editorial';
export interface Project { id: string; title: string; slug: string; categoryId: string; isFeatured: boolean; isPublished: boolean; sortOrder: number; stylePreset?: ProjectStylePreset; content: string | BlockItem[]; seoTitle?: string; seoDescription?: string; seoKeywords?: string; cityName?: string; year?: number; createdAt: string; updatedAt: string; }
export interface BlogPost { id: string; title: string; slug: string; excerpt?: string; coverImage?: string; content: string; isPublished: boolean; publishedAt?: string; seoTitle?: string; seoDescription?: string; seoKeywords?: string; tags?: string; }
export interface StaticPage { title: string; body: string; }
export type ThemeMode = 'dark' | 'light';
export interface ThemeTokens {
  background: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentSoft: string;
  border: string;
  headerBackground: string;
  footerBackground: string;
}
export interface ThemeSettings {
  dark: ThemeTokens;
  light: ThemeTokens;
}
export interface ContentData { site: SiteInfo; sections: Section[]; categories: Category[]; projects: Project[]; pages: Record<string, StaticPage>; blogPosts: BlogPost[]; themeSettings?: ThemeSettings; }
