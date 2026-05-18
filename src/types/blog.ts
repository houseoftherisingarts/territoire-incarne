import type { Timestamp } from "firebase/firestore";

export type Alignment = "left" | "center" | "right" | "justify";
export type FontFamily = "sans" | "serif";
export type FontSize = "p" | "lead" | "h1" | "h2" | "h3" | "quote";

export interface BlockColumn {
  id: string;
  type: "text" | "image";
  value: string; // text content (markdown-lite) OR image URL
  align?: Alignment;
  fontFamily?: FontFamily;
  fontSize?: FontSize;
}

export interface BlockRow {
  id: string;
  columns: BlockColumn[];
}

export interface BlogPostLanguageContent {
  title: string;
  excerpt: string;
  content: string; // JSON.stringify(BlockRow[])
}

export interface BlogPostSEO {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

export interface BlogPost {
  id: string; // = slug
  slug: string;
  fr: BlogPostLanguageContent;
  en?: Partial<BlogPostLanguageContent>;
  heroImage: string;
  seo?: Partial<BlogPostSEO>;
  published: boolean;
  publishedAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const emptyPost = (): Omit<BlogPost, "id" | "createdAt" | "publishedAt" | "updatedAt"> => ({
  slug: "",
  fr: { title: "", excerpt: "", content: "[]" },
  en: undefined,
  heroImage: "",
  seo: {},
  published: false,
});
