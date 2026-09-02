// API route for categories CRUD operations
import { createClient, isAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateSlug } from '@/lib/slug';
import { revalidateCategories } from '@/lib/cache-tags';
import type {
  Category,
  CategoryWithChildren,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/database';

// GET /api/categories - Get all categories (public)
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('level')
    .order('order');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build tree structure
  const tree = buildCategoryTree(data);

  return NextResponse.json(tree, {
    headers: {
      // Long-lived edge cache, purged explicitly by revalidateCategories().
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}

// POST /api/categories - Create a new category (admin only)
export async function POST(request: Request) {
  const admin = await isAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const body: CreateCategoryRequest = await request.json();

  // A name written only in Korean used to slugify to an empty string, which
  // then failed the NOT NULL / UNIQUE constraint on slug with an opaque 500.
  const slug = generateSlug(body.slug || body.name || '');

  if (!slug) {
    return NextResponse.json(
      { error: 'Could not derive a slug from the given name. Enter one manually.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: body.name,
      slug,
      parent_id: body.parent_id || null,
      level: body.level,
      order: body.order || 0,
      description: body.description || null,
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation (duplicate slug)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `Slug "${slug}" is already in use.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateCategories();

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/categories - Update a category (admin only)
export async function PATCH(request: Request) {
  const admin = await isAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const body: UpdateCategoryRequest = await request.json();

  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json(
      { error: 'Category ID is required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateCategories();

  return NextResponse.json(data);
}

// DELETE /api/categories?id=xxx - Delete a category (admin only)
export async function DELETE(request: Request) {
  const admin = await isAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Category ID is required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateCategories();

  return NextResponse.json({ success: true });
}

// Helper function to build category tree
function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  const map = new Map<string, CategoryWithChildren>();
  const roots: CategoryWithChildren[] = [];

  // First pass: create map
  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build tree
  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parent_id) {
      const parent = map.get(cat.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}
