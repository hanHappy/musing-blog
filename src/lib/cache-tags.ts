import { revalidatePath } from 'next/cache';

/**
 * Purge cached category data after a write.
 *
 * The category GET is edge-cached for 24h (s-maxage=86400); without this the
 * admin list and public pages keep serving a stale tree long after a create,
 * edit, delete or reorder.
 */
export function revalidateCategories() {
  revalidatePath('/api/categories');
  revalidatePath('/admin/categories');
  revalidatePath('/', 'layout');
}
