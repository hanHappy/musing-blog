import { createClient, isAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { DashboardData } from '@/types/database';

export async function GET() {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  try {
    // Run all queries in parallel
    const [
      { count: totalPosts },
      { count: publishedPosts },
      { count: draftPosts },
      { count: totalCategories },
      { count: totalMedia },
      { data: mediaFiles },
      { data: timelinePosts },
      { data: recentPosts },
      { data: categoryPosts },
      { data: categories },
      { data: tagData },
      { data: popularPosts },
    ] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('published', true),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('published', false),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('media').select('*', { count: 'exact', head: true }),
      supabase.from('media').select('size'),
      // Posts created since start of current year for timeline
      supabase
        .from('posts')
        .select('created_at')
        .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString())
        .order('created_at', { ascending: true }),
      // Recent 5 posts
      supabase
        .from('posts')
        .select('title, slug, published, created_at, view_count')
        .order('created_at', { ascending: false })
        .limit(5),
      // Posts with category_id for distribution
      supabase.from('posts').select('category_id'),
      // All categories for name lookup
      supabase.from('categories').select('id, name'),
      // Tags with post count via post_tags junction
      supabase.from('post_tags').select('tag_id, tags(name, color)'),
      // Popular posts by view count
      supabase
        .from('posts')
        .select('title, slug, view_count')
        .eq('published', true)
        .order('view_count', { ascending: false })
        .limit(5),
    ]);

    const storageUsed = mediaFiles
      ? mediaFiles.reduce((sum, file) => sum + (file.size || 0), 0)
      : 0;

    // Build post timeline (date -> count)
    const timelineMap = new Map<string, number>();
    if (timelinePosts) {
      for (const post of timelinePosts) {
        const date = post.created_at.split('T')[0];
        timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
      }
    }
    const post_timeline = Array.from(timelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Build category distribution
    const categoryMap = new Map<string, number>();
    const categoryNames = new Map<string, string>();
    if (categories) {
      for (const cat of categories) {
        categoryNames.set(cat.id, cat.name);
      }
    }
    if (categoryPosts) {
      for (const post of categoryPosts) {
        if (post.category_id) {
          const name = categoryNames.get(post.category_id) || 'Unknown';
          categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
        } else {
          categoryMap.set('Uncategorized', (categoryMap.get('Uncategorized') || 0) + 1);
        }
      }
    }
    const category_distribution = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Build popular tags
    const tagCountMap = new Map<string, { name: string; color: string; count: number }>();
    if (tagData) {
      for (const row of tagData) {
        const tag = row.tags as unknown as { name: string; color: string } | null;
        if (tag) {
          const existing = tagCountMap.get(tag.name);
          if (existing) {
            existing.count++;
          } else {
            tagCountMap.set(tag.name, { name: tag.name, color: tag.color, count: 1 });
          }
        }
      }
    }
    const popular_tags = Array.from(tagCountMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(({ name, color, count }) => ({ name, color, post_count: count }));

    const data: DashboardData = {
      total_posts: totalPosts || 0,
      published_posts: publishedPosts || 0,
      draft_posts: draftPosts || 0,
      total_categories: totalCategories || 0,
      total_media: totalMedia || 0,
      storage_used: storageUsed,
      post_timeline,
      recent_posts: (recentPosts || []).map((p) => ({
        title: p.title,
        slug: p.slug,
        published: p.published,
        created_at: p.created_at,
        view_count: p.view_count ?? 0,
      })),
      category_distribution,
      popular_tags,
      popular_posts: (popularPosts || []).map((p) => ({
        title: p.title,
        slug: p.slug,
        view_count: p.view_count ?? 0,
      })),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
