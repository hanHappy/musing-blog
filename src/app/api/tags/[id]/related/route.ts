import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET /api/tags/[id]/related - Get related tags by co-occurrence strength
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch relations where this tag appears as either tag_a or tag_b
  const { data: relations, error } = await supabase
    .from('tag_relations')
    .select('tag_a, tag_b, strength')
    .or(`tag_a.eq.${id},tag_b.eq.${id}`)
    .order('strength', { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!relations || relations.length === 0) {
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
      },
    });
  }

  // Collect the "other" tag IDs
  const otherTagIds = relations.map((r) =>
    r.tag_a === id ? r.tag_b : r.tag_a
  );

  // Fetch tag details
  const { data: tags, error: tagError } = await supabase
    .from('tags')
    .select('*')
    .in('id', otherTagIds);

  if (tagError) {
    return NextResponse.json({ error: tagError.message }, { status: 500 });
  }

  const tagMap = new Map((tags || []).map((t) => [t.id, t]));

  // Build result with strength info
  const result = relations
    .map((r) => {
      const otherId = r.tag_a === id ? r.tag_b : r.tag_a;
      const tag = tagMap.get(otherId);
      if (!tag) return null;
      return { ...tag, strength: r.strength };
    })
    .filter(Boolean);

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
