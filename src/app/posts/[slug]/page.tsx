import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@/lib/supabase-server';
import PostDetailView from '@/components/PostDetailView';

// ISR: 24시간마다 재검증
export const revalidate = 86400;

// 동적 경로 비활성화 (빌드된 페이지만 허용)
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 빌드타임에 모든 published 게시글 생성
export async function generateStaticParams() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data: posts } = await supabase
    .from('posts')
    .select('slug')
    .eq('published', true);

  if (!posts) return [];
  return posts.map((post) => ({ slug: post.slug }));
}

// SEO Metadata
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugPattern.test(slug)) {
    return { title: 'Not Found' };
  }

  const supabase = await createClient();
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, created_at')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (!post) {
    return { title: 'Not Found' };
  }

  return {
    title: `${post.title} - Muse.log`,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: 'article',
      publishedTime: post.created_at,
    },
  };
}

// 게시글 페이지
export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;

  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugPattern.test(slug)) {
    notFound();
  }

  const supabase = await createClient();

  // 현재 게시글 조회
  const { data: post } = await supabase
    .from('posts')
    .select(`*, category:categories(*)`)
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (!post) {
    notFound();
  }

  // 같은 카테고리의 관련 게시글
  let relatedPosts: { title: string; slug: string }[] = [];
  if (post.category_id) {
    const { data: related } = await supabase
      .from('posts')
      .select('title, slug')
      .eq('category_id', post.category_id)
      .eq('published', true)
      .neq('slug', slug)
      .order('created_at', { ascending: false })
      .limit(5);
    if (related) relatedPosts = related;
  }

  // 이전/다음 게시글
  const { data: allPosts } = await supabase
    .from('posts')
    .select('title, slug')
    .eq('published', true)
    .order('created_at', { ascending: true });

  let prevPost: { title: string; slug: string } | null = null;
  let nextPost: { title: string; slug: string } | null = null;

  if (allPosts) {
    const idx = allPosts.findIndex((p) => p.slug === slug);
    if (idx > 0) prevPost = allPosts[idx - 1];
    if (idx < allPosts.length - 1) nextPost = allPosts[idx + 1];
  }

  return (
    <PostDetailView
      post={{
        title: post.title,
        slug: post.slug,
        content: post.content,
        created_at: post.created_at,
      }}
      relatedPosts={relatedPosts}
      prevPost={prevPost}
      nextPost={nextPost}
    />
  );
}
