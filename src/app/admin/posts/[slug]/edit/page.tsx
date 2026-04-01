import { redirect, notFound } from 'next/navigation';
import { createClient, isAdmin } from '@/lib/supabase-server';
import { EditPostForm } from './EditPostForm';
import type { Category, PostWithCategoryAndTags } from '@/types/database';

interface EditPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  // 1. Check admin authentication
  const admin = await isAdmin();
  if (!admin) {
    redirect('/login');
  }

  // 2. Unwrap params
  const { slug } = await params;

  // 3. Fetch post by slug
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*),
      post_tags(tag_id, tags:tags(*))
    `)
    .eq('slug', slug)
    .single();

  if (error || !post) {
    notFound();
  }

  // 4. Fetch categories
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .order('level', { ascending: true })
    .order('order', { ascending: true });

  const categories = categoriesData || [];

  return (
    <div>
      <h1
        className="text-3xl font-bold mb-8"
        style={{ color: 'var(--text-primary)' }}
      >
        Edit Post
      </h1>

      <EditPostForm
        post={post as PostWithCategoryAndTags}
        categories={categories}
      />
    </div>
  );
}
