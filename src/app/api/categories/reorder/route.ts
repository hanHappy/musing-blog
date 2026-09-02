import { createClient, isAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { revalidateCategories } from '@/lib/cache-tags';
interface BulkCategoryOrderUpdate {
  updates: { id: string; parent_id: string | null; level: number; order: number }[];
}

export async function PUT(request: Request) {
  const admin = await isAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const body: BulkCategoryOrderUpdate = await request.json();

  if (!body.updates || !Array.isArray(body.updates) || body.updates.length === 0) {
    return NextResponse.json({ error: 'Updates array is required' }, { status: 400 });
  }

  try {
    await Promise.all(
      body.updates.map((update) =>
        supabase
          .from('categories')
          .update({
            parent_id: update.parent_id,
            level: update.level,
            order: update.order,
          })
          .eq('id', update.id)
      )
    );

    revalidateCategories();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reorder' },
      { status: 500 }
    );
  }
}
