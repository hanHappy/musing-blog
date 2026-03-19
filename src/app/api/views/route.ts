import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET /api/views?slug=xxx - Get view count for a post
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('view_count')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error) {
    return NextResponse.json({ view_count: 0 });
  }

  return NextResponse.json(
    { view_count: data?.view_count ?? 0 },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}

// POST /api/views - Increment view count
export async function POST(request: Request) {
  const body = await request.json();
  const slug = body?.slug;

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'slug required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('increment_view_count', {
    post_slug: slug,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ view_count: data });
}
