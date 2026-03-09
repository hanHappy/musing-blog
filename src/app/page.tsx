import { createClient } from '@/lib/supabase-server';
import type { Category, CategoryWithChildren } from '@/types/database';
import { NeuralHomePage } from '@/components/neural/NeuralHomePage';
import { buildNeuralGraph } from '@/lib/neural-graph-builder';

// Helper function to build category tree
function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  const tree: CategoryWithChildren[] = [];
  const map = new Map<string, CategoryWithChildren>();

  // First pass: create all nodes
  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build tree structure
  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parent_id) {
      const parent = map.get(cat.parent_id);
      if (parent) {
        parent.children?.push(node);
      }
    } else {
      tree.push(node);
    }
  });

  return tree;
}

// ISR configuration - regenerate every hour
export const revalidate = 3600;

export default async function Home() {
  const supabase = await createClient();

  // Fetch categories
  const { data: categoriesData, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .order('level')
    .order('order');

  if (categoriesError) {
    console.error('Failed to fetch categories:', categoriesError);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Failed to load categories</p>
      </div>
    );
  }

  // Fetch published posts
  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (postsError) {
    console.error('Failed to fetch posts:', postsError);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Failed to load posts</p>
      </div>
    );
  }

  const categories = categoriesData || [];
  const posts = postsData || [];

  // Build category tree
  const categoryTree = buildCategoryTree(categories);

  // Build neural graph
  const neuralGraph = buildNeuralGraph(categoryTree, posts);

  return <NeuralHomePage initialGraph={neuralGraph} />;
}
