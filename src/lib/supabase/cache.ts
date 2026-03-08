/**
 * Server-side caching layer for Supabase queries
 * Uses React cache for per-request deduplication
 */

import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';
import type { Category } from '@/types/category';

/**
 * Cached category tree fetch with per-request deduplication
 * Uses React cache to deduplicate multiple calls within the same request
 *
 * Note: This uses React cache (not Next.js unstable_cache) because
 * we need to access cookies() in createClient(), which is not allowed
 * inside unstable_cache. The ISR revalidation is handled at the page level.
 *
 * @returns All categories ordered by level and order
 */
export const getCachedCategoryTree = cache(async (): Promise<Category[]> => {
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
});
