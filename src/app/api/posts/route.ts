// API route for posts CRUD operations
import { createClient, isAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { CreatePostRequest, UpdatePostRequest } from '@/types/database';

// GET /api/posts - Get all posts (public: only published, admin: all)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category_id');
  const published = searchParams.get('published');

  const supabase = await createClient();
  const admin = await isAdmin();

  let query = supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .order('created_at', { ascending: false });

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
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
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

  // Generate embedding if post is published
  if (data.published) {
    try {
      await generateEmbedding(data.id, data.title, data.content);
    } catch (embedError) {
      console.error('Failed to generate embedding:', embedError);
      // Don't fail the request if embedding generation fails
    }
  }

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/posts - Update a post (admin only)
export async function PATCH(request: Request) {
  const admin = await isAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const body: UpdatePostRequest = await request.json();

  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  // Update post
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Regenerate embedding if content changed and post is published
  if ((updates.content || updates.title) && data.published) {
    try {
      await generateEmbedding(data.id, data.title, data.content);
    } catch (embedError) {
      console.error('Failed to regenerate embedding:', embedError);
    }
  }

  return NextResponse.json(data);
}

// DELETE /api/posts?id=xxx - Delete a post (admin only)
export async function DELETE(request: Request) {
  const admin = await isAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from('posts').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Helper function to generate embedding
async function generateEmbedding(
  postId: string,
  title: string,
  content: string
) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: `${title}\n\n${content}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const { data } = await response.json();
  const embedding = data[0].embedding;

  // Save embedding to database
  const supabase = await createClient();
  await supabase
    .from('post_embeddings')
    .upsert({
      post_id: postId,
      embedding,
    });
}
