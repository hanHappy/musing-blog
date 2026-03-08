/**
 * Category page - Displays all posts in a category and its descendants
 * Uses ISR with 1-hour revalidation and static generation for all categories
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@/lib/supabase-server';
import { getCachedCategoryTree } from '@/lib/supabase/cache';
import {
  buildCategoryMap,
  getCategoryPath,
  getDescendantCategoryIds,
} from '@/lib/utils/category';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import Breadcrumb from '@/components/Breadcrumb';
import CategoryInfo from '@/components/CategoryInfo';
import EmptyState from '@/components/EmptyState';
import type { BreadcrumbSegment } from '@/types/category';

export const revalidate = 3600; // 1 hour

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // Use anonymous client for build time (no cookies needed)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data: categories } = await supabase
    .from('categories')
    .select('slug')
    .order('level', { ascending: true });

  if (!categories) return [];

  return categories.map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', slug)
    .single();

  return {
    title: category ? `${category.name} - Muse.log` : 'Category - Muse.log',
    description: category?.description || undefined,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  // Validate slug
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugPattern.test(slug)) {
    notFound();
  }

  const supabase = await createClient();

  // Fetch category
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (categoryError || !category) {
    notFound();
  }

  // Get all categories for breadcrumb and filtering
  const allCategories = await getCachedCategoryTree();
  const categoryMap = buildCategoryMap(allCategories);

  // Get descendant category IDs
  const categoryIds = getDescendantCategoryIds(category.id, categoryMap);

  // Fetch posts from this category and descendants
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .in('category_id', categoryIds)
    .eq('published', true)
    .order('created_at', { ascending: false });

  // Get subcategories
  const subcategories = allCategories
    .filter((cat) => cat.parent_id === category.id)
    .map((cat) => ({ name: cat.name, slug: cat.slug }));

  // Build breadcrumb
  const categoryPath = getCategoryPath(category.id, categoryMap);
  const pathSegments = categoryPath.split(' > ');
  const segments: BreadcrumbSegment[] = [
    { name: 'Home', href: '/' },
    ...pathSegments.slice(0, -1).map((name) => {
      const cat = Array.from(categoryMap.values()).find(
        (c) => c.name === name
      );
      return {
        name,
        href: cat ? `/category/${cat.slug}` : undefined,
      };
    }),
    { name: pathSegments[pathSegments.length - 1] }, // Current category (no link)
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

  // Format date helper
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumb segments={segments} />

      <div className="flex gap-8">
        {/* Left Sidebar */}
        <Sidebar categories={categoryTree} />

        {/* Main Content */}
        <main className="w-full lg:w-[55%]">
          <h1 className="mb-2 text-3xl font-bold text-[var(--text-primary)]">
            {category.name}
          </h1>
          <p className="mb-8 text-sm text-[var(--text-muted)]">
            {posts?.length || 0} {posts?.length === 1 ? 'post' : 'posts'}
          </p>

          {posts && posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.slug}
                  title={post.title}
                  excerpt={post.excerpt || ''}
                  slug={post.slug}
                  date={formatDate(post.created_at)}
                  category={categoryPath}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              message="No posts yet in this category"
              linkText="Browse all posts"
              linkHref="/"
            />
          )}
        </main>

        {/* Right Sidebar - Category Info */}
        <CategoryInfo
          description={category.description}
          postCount={posts?.length || 0}
          subcategories={subcategories.length > 0 ? subcategories : undefined}
        />
      </div>
    </div>
  );
}
