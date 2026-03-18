import { createClient, isAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { CreateTagRequest, UpdateTagRequest } from '@/types/database';

// GET /api/tags - Get all tags with post counts
export async function GET() {
  const supabase = await createClient();

  const { data: tags, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get post counts for each tag
  const { data: counts, error: countError } = await supabase
    .from('post_tags')
    .select('tag_id');

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const countMap = new Map<string, number>();
  for (const row of counts || []) {
    countMap.set(row.tag_id, (countMap.get(row.tag_id) || 0) + 1);
  }

  const tagsWithCount = (tags || []).map((tag) => ({
    ...tag,
    post_count: countMap.get(tag.id) || 0,
  }));

  return NextResponse.json(tagsWithCount, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}

// POST /api/tags - Create a new tag (admin only)
export async function POST(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const body: CreateTagRequest = await request.json();

  const { data, error } = await supabase
    .from('tags')
    .insert({
      name: body.name,
      slug: body.slug,
      color: body.color || '#00FFC8',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/tags - Update a tag (admin only)
export async function PATCH(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const body: UpdateTagRequest = await request.json();

  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('tags')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/tags?id=xxx - Delete a tag (admin only)
export async function DELETE(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('tags').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
