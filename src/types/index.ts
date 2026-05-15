export interface SiteInfo {
  name: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  houzz: string;
  pinterest?: string;
  youtube?: string;
  tiktok?: string;
}
export interface Section { id: string; name: string; type: string; slug?: string; }
export interface Category { id: string; name: string; slug: string; description?: string; showInHeader: boolean; sortOrder: number; }
export interface BlockItem { type: string; data: Record<string, any>; id?: string; }
export type ProjectStylePreset = 'default' | 'kids' | 'minimal' | 'luxury' | 'warm' | 'editorial';
export type ProjectAssetKind = 'image' | 'video';
export type ProjectAssetStatus = 'active' | 'missing' | 'archived';
export type ProjectAssetSourceType = 'upload' | 'folder-sync' | 'remote-import' | 'legacy-import';
export interface ProjectAssetUsage {
  id: string;
  projectId: string;
  assetId: string;
  blockId?: string;
  slotKey?: string;
  usageType?: string;
  cropX?: number | null;
  cropY?: number | null;
  cropScale?: number | null;
  focalX?: number | null;
  focalY?: number | null;
  aspectRatio?: string;
  captionOverride?: string;
  labelOverride?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
export interface ProjectAsset {
  id: string;
  projectId: string;
  kind: ProjectAssetKind;
  storagePath: string;
  publicUrl: string;
  originalFilename: string;
  mimeType?: string;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  fileSize?: number | null;
  checksum?: string;
  status: ProjectAssetStatus;
  includeInAi: boolean;
  sourceType: ProjectAssetSourceType;
  sourcePath?: string;
  altText?: string;
  caption?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
  usages?: ProjectAssetUsage[];
}
export interface AssetBlockReference {
  assetId?: string;
  usageId?: string;
  image?: string;
  video?: string;
}
export interface Project { id: string; title: string; slug: string; categoryId: string; isFeatured: boolean; isPublished: boolean; sortOrder: number; stylePreset?: ProjectStylePreset; content: string | BlockItem[]; assets?: ProjectAsset[]; coverImage?: string | null; seoTitle?: string; seoDescription?: string; seoKeywords?: string; cityName?: string; year?: number; completedAt?: string | null; createdAt: string; updatedAt: string; deletedAt?: string | null; }
export interface BlogPost { id: string; title: string; slug: string; excerpt?: string; coverImage?: string; content: string; isPublished: boolean; publishedAt?: string; seoTitle?: string; seoDescription?: string; seoKeywords?: string; tags?: string; }
export interface Testimonial {
  id: string;
  author: string;
  date?: string | null;
  text: string;
  link?: string | null;
  linkHref?: string | null;
  image?: string | null;
  projectId?: string | null;
  projectHref?: string | null;
  projectText?: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
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
export interface HomepageTestimonial {
  date: string;
  text: string;
  author: string;
  link?: string | null;
  linkHref?: string | null;
  image?: string | null;
  projectHref?: string | null;
  projectText?: string;
}
export interface HomepageImageRef {
  url: string;
  assetId?: string;
  projectId?: string;
  alt?: string;
}
export type HomepageImageValue = string | HomepageImageRef;
export interface HomepageSettings {
  seo: { title: string; description: string; keywords: string };
  hero: { title: string; image: string };
  collage: {
    title: string;
    text: string;
    quote: string;
    cardTitle: string;
    cardText: string;
    images: { primary: HomepageImageValue; smallOne: HomepageImageValue; wide: HomepageImageValue; tall: HomepageImageValue; smallTwo: HomepageImageValue };
  };
  feature: {
    quote: string;
    image: string;
    darkTitle: string;
    darkText: string;
    linkLabel: string;
    linkHref: string;
    lightTitle: string;
    lightText: string;
  };
  showcase: { label: string; title: string; projectCount: number };
  approach: {
    label: string;
    title: string;
    image: HomepageImageValue;
    items: Array<{ number: string; title: string; text: string }>;
  };
  detail: { label: string; title: string; images: HomepageImageValue[] };
  testimonials: { label: string; title: string; count: number; items: HomepageTestimonial[] };
  cta: { label: string; title: string; buttonLabel: string; buttonHref: string };
}
export interface ContentData { site: SiteInfo; sections: Section[]; categories: Category[]; projects: Project[]; pages: Record<string, StaticPage>; blogPosts: BlogPost[]; testimonials: Testimonial[]; themeSettings?: ThemeSettings; homepageSettings?: HomepageSettings; }
