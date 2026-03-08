import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@/lib/supabase-server';
import { buildCategoryMap, getCategoryPath } from '@/lib/utils/category';

// ISR: 24시간마다 재검증
export const revalidate = 86400;

// 동적 경로 비활성화 (빌드된 페이지만 허용)
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 빌드타임에 모든 published 게시글 생성
export async function generateStaticParams() {
  // 빌드타임에는 익명 클라이언트 사용 (cookies 불필요)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data: posts } = await supabase
    .from('posts')
    .select('slug')
    .eq('published', true);

  if (!posts) return [];

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// SEO Metadata
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Slug 검증
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugPattern.test(slug)) {
    return {
      title: 'Not Found',
    };
  }

  const supabase = await createClient();
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, created_at, updated_at')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (!post) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
    },
  };
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// 게시글 페이지
export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;

  // Slug 검증 (보안)
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugPattern.test(slug)) {
    notFound();
  }

  // 데이터 조회
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('posts')
    .select(
      `
      *,
      category:categories(*)
    `
    )
    .eq('slug', slug)
    .eq('published', true) // 이중 검증
    .single();

  if (!post) {
    notFound();
  }

  // 카테고리 경로 구성
  let categoryPath = 'Uncategorized';
  if (post.category) {
    const { data: categories } = await supabase.from('categories').select('*');

    if (categories) {
      const categoryMap = buildCategoryMap(categories);
      categoryPath = getCategoryPath(post.category.id, categoryMap);
    }
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <div
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          📁 {categoryPath}
        </div>
      </nav>

      {/* 제목 */}
      <h1
        className="text-4xl md:text-5xl font-bold mb-4"
        style={{ color: 'var(--text-primary)' }}
      >
        {post.title}
      </h1>

      {/* 메타데이터 */}
      <div
        className="flex flex-wrap gap-4 text-sm mb-8 pb-6 border-b"
        style={{
          color: 'var(--text-secondary)',
          borderColor: 'var(--border-color)',
        }}
      >
        <time dateTime={post.created_at} className="flex items-center gap-1">
          📅 <span>{formatDate(post.created_at)}</span>
        </time>
        {post.updated_at !== post.created_at && (
          <time dateTime={post.updated_at} className="flex items-center gap-1">
            ✏️ <span>Updated {formatDate(post.updated_at)}</span>
          </time>
        )}
      </div>

      {/* 본문 - react-markdown 사용 */}
      <div className="post-prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
