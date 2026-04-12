export interface SiteInfo {
  name: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  houzz: string;
}

export interface Section {
  id: string;
  name: string;
  type: 'home-anchor' | 'category' | 'page';
  slug?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  showInHeader: boolean;
  sortOrder: number;
}

export interface BlockItem {
  type: string;
  data: Record<string, any>;
  id?: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  content: string | BlockItem[]; // JSON string or parsed array
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaticPage {
  title: string;
  body: string;
}

export interface ContentData {
  site: SiteInfo;
  sections: Section[];
  categories: Category[];
  projects: Project[];
  pages: Record<string, StaticPage>;
}
