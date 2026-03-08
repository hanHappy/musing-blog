import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@/lib/supabase-server';
import { getCachedCategoryTree } from '@/lib/supabase/cache';
import {
  buildCategoryMap,
  getCategoryPath,
  getCategorySlugByName,
} from '@/lib/utils/category';
import Sidebar from '@/components/Sidebar';
import Breadcrumb from '@/components/Breadcrumb';
import TableOfContents from '@/components/TableOfContents';
import type { BreadcrumbSegment } from '@/types/category';

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
    .select('title, excerpt, created_at')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (!post) {
    return {
      title: 'Not Found',
    };
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

  // Get all categories for sidebar and breadcrumb
  const allCategories = await getCachedCategoryTree();
  const categoryMap = buildCategoryMap(allCategories);

  // 카테고리 경로 구성
  let categoryPath = 'Uncategorized';
  if (post.category) {
    categoryPath = getCategoryPath(post.category.id, categoryMap);
  }

  // Build breadcrumb
  const pathSegments = categoryPath.split(' > ');
  const segments: BreadcrumbSegment[] = [
    { name: 'Home', href: '/' },
    ...pathSegments.map((name) => {
      const slug = getCategorySlugByName(name, categoryMap);
      return {
        name,
        href: slug ? `/category/${slug}` : undefined,
      };
    }),
    { name: post.title }, // Current post (no link)
  ];

  // Build category tree for sidebar
  type CategoryTreeNode = {
    name: string;
    slug: string;
    children: CategoryTreeNode[];
  };

  function buildTree(parentId: string | null = null): CategoryTreeNode[] {
    return allCategories
      .filter((cat) => cat.parent_id === parentId)
      .map((cat) => ({
        name: cat.name,
        slug: cat.slug,
        children: buildTree(cat.id),
      }));
  }

  const categoryTree = buildTree();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumb segments={segments} />

      <div className="flex gap-8">
        {/* Left Sidebar */}
        <Sidebar categories={categoryTree} />

        {/* Main Content */}
        <article className="w-full lg:w-[55%]">
          {/* 제목 */}
          <h1 className="mb-4 text-4xl font-bold text-[var(--text-primary)] md:text-5xl">
            {post.title}
          </h1>

          {/* 메타데이터 */}
          <div className="mb-8 flex flex-wrap gap-4 border-b border-[var(--border-color)] pb-6 text-sm text-[var(--text-secondary)]">
            <time
              dateTime={post.created_at}
              className="flex items-center gap-1"
            >
              📅 <span>{formatDate(post.created_at)}</span>
            </time>
          </div>

          {/* 본문 - react-markdown 사용 */}
          <div className="post-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>
        </article>

        {/* Right Sidebar - Table of Contents */}
        <TableOfContents content={post.content} />
      </div>
    </div>
  );
}
