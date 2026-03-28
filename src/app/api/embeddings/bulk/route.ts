// API route for bulk embedding regeneration (admin only)
import { createClient, isAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateChunkEmbeddings } from '@/lib/rag/embeddings';

export async function POST() {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // 발행된 모든 글 조회
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, content, excerpt')
    .eq('published', true)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({ total: 0, success: 0, failed: 0, details: [] });
  }

  const details: { post_id: string; title: string; chunks: number; status: string }[] = [];
  let success = 0;
  let failed = 0;

  for (const post of posts) {
    try {
      const result = await generateChunkEmbeddings(
        post.id,
        post.title,
        post.content,
        post.excerpt
      );
      details.push({
        post_id: post.id,
        title: post.title,
        chunks: result.chunks_created,
        status: 'success',
      });
      success++;
    } catch (err) {
      console.error(`Failed to generate embeddings for post ${post.id}:`, err);
      details.push({
        post_id: post.id,
        title: post.title,
        chunks: 0,
        status: `error: ${err instanceof Error ? err.message : 'unknown'}`,
      });
      failed++;
    }

    // OpenAI rate limit 방지: 200ms 간격
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return NextResponse.json({
    total: posts.length,
    success,
    failed,
    details,
  });
}
