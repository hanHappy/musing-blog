/**
 * Server-side caching layer for Supabase queries
 * Uses Next.js unstable_cache for per-request and cross-request caching
 */

import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import { CACHE_DURATION } from '@/lib/constants';
import type { Category } from '@/types/category';

/**
 * Cached category tree fetch with 24-hour revalidation
 * Uses Next.js cache with tags for granular invalidation
 *
 * @returns All categories ordered by level and order
 */
export const getCachedCategoryTree = unstable_cache(
  async (): Promise<Category[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('level', { ascending: true })
      .order('order', { ascending: true });

    if (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }

    return data || [];
  },
  ['category-tree'],
  {
    revalidate: CACHE_DURATION.CATEGORY_TREE,
    tags: ['categories'],
  }
);
