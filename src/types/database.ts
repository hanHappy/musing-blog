// Database types for muse.log
// Auto-generated from Supabase schema

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  level: 1 | 2 | 3;
  order: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string; // Markdown
  excerpt: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  published: boolean;
  author_id: string | null;
}

export interface Media {
  id: string;
  filename: string;
  url: string;
  alt_text: string | null;
  size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface PostEmbedding {
  id: string;
  post_id: string;
  embedding: number[]; // Vector(1536)
  created_at: string;
}

// Extended types with relations
export interface PostWithCategory extends Post {
  category: Category | null;
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

// API request/response types
export interface CreatePostRequest {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category_id?: string;
  published?: boolean;
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  parent_id?: string;
  level: 1 | 2 | 3;
  order?: number;
  description?: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string;
}

export interface UploadMediaRequest {
  file: File;
  alt_text?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  answer: string;
  sources: {
    title: string;
    slug: string;
  }[];
}

export interface SearchPostsResult {
  id: string;
  title: string;
  content: string;
  slug: string;
  similarity: number;
}

// Dashboard stats
export interface DashboardStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_categories: number;
  total_media: number;
  storage_used: number; // in bytes
}

// RAG settings
export interface RAGSettings {
  match_threshold: number; // 0.0 - 1.0
  match_count: number; // 1 - 10
  max_tokens: number;
}
