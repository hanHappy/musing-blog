import type { Category as DBCategory } from './database';

// Re-export database Category type
export type Category = DBCategory;

/**
 * Category node with hierarchical children structure
 * Used for building category trees
 */
export interface CategoryNode extends Category {
  children: CategoryNode[];
  post_count?: number;
}

/**
 * Breadcrumb segment for navigation
 * href is undefined for the current/last segment (non-clickable)
 */
export interface BreadcrumbSegment {
  name: string;
  href?: string;
}

/**
 * Table of Contents item extracted from markdown headings
 * Only level 2 and 3 headings are included
 */
export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}
