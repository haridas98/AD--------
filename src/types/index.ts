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
  homeTitle?: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  location?: string;
  year?: string;
  coverImage: string;
  gallery: string[];
  summary: string;
  workDone?: string;
  featuredOnHome: boolean;
  published: boolean;
}

export interface StaticPage {
  title: string;
  body: string;
}

export interface ContentData {
  site: SiteInfo;
  sections: Section[];
  categories: Category[];
  pages: Record<string, StaticPage>;
  projects: Project[];
}
