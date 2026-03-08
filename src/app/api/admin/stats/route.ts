// API route for admin dashboard statistics
import { createClient, isAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { DashboardStats } from '@/types/database';

export async function GET() {
  const admin = await isAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  try {
    // Get total posts count
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    // Get published posts count
    const { count: publishedPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('published', true);

    // Get draft posts count
    const { count: draftPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('published', false);

    // Get total categories count
    const { count: totalCategories } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    // Get total media count
    const { count: totalMedia } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true });

    // Get storage usage
    const { data: mediaFiles } = await supabase
      .from('media')
      .select('size');

    const storageUsed = mediaFiles
      ? mediaFiles.reduce((sum, file) => sum + (file.size || 0), 0)
      : 0;

    const stats: DashboardStats = {
      total_posts: totalPosts || 0,
      published_posts: publishedPosts || 0,
      draft_posts: draftPosts || 0,
      total_categories: totalCategories || 0,
      total_media: totalMedia || 0,
      storage_used: storageUsed,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
