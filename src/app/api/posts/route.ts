// API route for posts CRUD operations
import { createClient, isAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { CreatePostRequest, UpdatePostRequest } from '@/types/database';
import { generateChunkEmbeddings } from '@/lib/rag/embeddings';

const STORAGE_MARKER = '/storage/v1/object/public/blog-images/';

function extractStoragePaths(content: string): string[] {
  const pattern = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
  return [...content.matchAll(pattern)]
    .map((m) => m[1])
    .map((url) => {
      const idx = url.indexOf(STORAGE_MARKER);
      return idx !== -1 ? url.slice(idx + STORAGE_MARKER.length) : null;
    })
    .filter((p): p is string => p !== null);
}

// GET /api/posts - Get all posts (public: only published, admin: all)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category_id');
  const published = searchParams.get('published');
  const slug = searchParams.get('slug');

  const supabase = await createClient();
  const admin = await isAdmin();

  let query = supabase
    .from('posts')
    .select(`
      *,
      category:categories(*),
      post_tags(tag_id, tags:tags(*))
    `)
    .order('created_at', { ascending: false });

  // Filter by slug if provided
  if (slug) {
    query = query.eq('slug', slug);
  }

  // Filter by category if provided
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  // Filter by published status
  if (!admin) {
    // Non-admin users can only see published posts
    query = query.eq('published', true);
  } else if (published !== null) {
    // Admin can filter by published status
    query = query.eq('published', published === 'true');
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}

// POST /api/posts - Create a new post (admin only)
export async function POST(request: Request) {
  const admin = await isAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const body: CreatePostRequest = await request.json();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Insert post
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: body.title,
      slug: body.slug,
      content: body.content,
      excerpt: body.excerpt || null,
      category_id: body.category_id || null,
      published: body.published || false,
      author_id: user?.id || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert post tags if provided
  if (body.tag_ids && body.tag_ids.length > 0) {
    const postTags = body.tag_ids.map((tag_id) => ({
      post_id: data.id,
      tag_id,
    }));
    const { error: tagError } = await supabase
      .from('post_tags')
      .insert(postTags);
    if (tagError) {
      console.error('Failed to insert post tags:', tagError);
    }
  }

  // Generate chunk embeddings if post is published
  if (data.published) {
    try {
      await generateChunkEmbeddings(data.id, data.title, data.content, data.excerpt);
    } catch (embedError) {
      console.error('Failed to generate chunk embeddings:', embedError);
      // Don't fail the request if embedding generation fails
    }
  }

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/posts - Update a post (admin only)
export async function PATCH(request: Request) {
  // TODO: Add rate limiting (Phase 2)
  // TODO: Add Zod input validation (Phase 2)

  // 1. Authentication check (MUST be first)
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const body: UpdatePostRequest = await request.json();

  const { id, slug: _slug, tag_ids, ...updates } = body;

  // 2. Validate required fields
  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  // 3. Block slug modification (Security requirement)
  if (_slug !== undefined) {
    return NextResponse.json(
      { error: 'Slug cannot be modified after creation' },
      { status: 400 }
    );
  }

  // 4. Fetch old content before update (for image diff)
  let oldContent: string | null = null;
  if (updates.content) {
    const { data: oldPost } = await supabase
      .from('posts')
      .select('content')
      .eq('id', id)
      .single();
    oldContent = oldPost?.content ?? null;
  }

  // 5. Update post
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 5. Update post tags if provided
  if (tag_ids !== undefined) {
    // Delete existing tags for this post
    await supabase.from('post_tags').delete().eq('post_id', id);
    // Insert new tags
    if (tag_ids.length > 0) {
      const postTags = tag_ids.map((tag_id) => ({
        post_id: id,
        tag_id,
      }));
      const { error: tagError } = await supabase
        .from('post_tags')
        .insert(postTags);
      if (tagError) {
        console.error('Failed to update post tags:', tagError);
      }
    }
  }

  // 6. Delete removed images from Storage
  if (updates.content && oldContent) {
    const oldPaths = extractStoragePaths(oldContent);
    const newPaths = new Set(extractStoragePaths(updates.content));
    const removed = oldPaths.filter((p) => !newPaths.has(p));
    if (removed.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('blog-images')
        .remove(removed);
      if (storageError) {
        console.error('Failed to delete removed images:', storageError);
      }
    }
  }

  // 7. Regenerate chunk embeddings if content changed and post is published
  if ((updates.content || updates.title) && data.published) {
    try {
      await generateChunkEmbeddings(data.id, data.title, data.content, data.excerpt);
    } catch (embedError) {
      console.error('Failed to regenerate chunk embeddings:', embedError);
    }
  }

  // 6. 온디맨드 재검증
  try {
    revalidatePath(`/posts/${data.slug}`);
  } catch (revalidateError) {
    console.error('Failed to revalidate path:', revalidateError);
    // 재검증 실패해도 응답은 성공
  }

  return NextResponse.json(data);
}

// DELETE /api/posts?id=xxx&slug=xxx - Delete a post (admin only)
export async function DELETE(request: Request) {
  // TODO: Add rate limiting (Phase 2)

  // 1. Authentication check (MUST be first)
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const slug = searchParams.get('slug');

  // 2. Validate: either id or slug is required
  if (!id && !slug) {
    return NextResponse.json(
      { error: 'Post ID or slug is required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // 3. Fetch post content before deletion to extract image URLs
  const { data: post } = await (id
    ? supabase.from('posts').select('content').eq('id', id).single()
    : supabase.from('posts').select('content').eq('slug', slug!).single());

  // 4. Delete post
  const { error } = await (id
    ? supabase.from('posts').delete().eq('id', id)
    : supabase.from('posts').delete().eq('slug', slug!));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 5. Delete referenced images from Storage
  if (post?.content) {
    const storagePaths = extractStoragePaths(post.content);
    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('blog-images')
        .remove(storagePaths);
      if (storageError) {
        console.error('Failed to delete post images:', storageError);
      }
    }
  }

  return NextResponse.json({ success: true });
}

