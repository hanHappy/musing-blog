import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { TagGraphData } from '@/types/database';

// GET /api/tags/graph - Get tag graph data (nodes + edges) for D3 visualization
export async function GET() {
  const supabase = await createClient();

  // Fetch all tags
  const { data: tags, error: tagError } = await supabase
    .from('tags')
    .select('*')
    .order('name');

  if (tagError) {
    return NextResponse.json({ error: tagError.message }, { status: 500 });
  }

  // Fetch post counts per tag
  const { data: postTags, error: ptError } = await supabase
    .from('post_tags')
    .select('tag_id');

  if (ptError) {
    return NextResponse.json({ error: ptError.message }, { status: 500 });
  }

  const countMap = new Map<string, number>();
  for (const row of postTags || []) {
    countMap.set(row.tag_id, (countMap.get(row.tag_id) || 0) + 1);
  }

  // Build nodes (only tags with at least 1 post)
  const nodes = (tags || [])
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      post_count: countMap.get(tag.id) || 0,
    }))
    .filter((n) => n.post_count > 0);

  const nodeIds = new Set(nodes.map((n) => n.id));

  // Fetch all tag relations
  const { data: relations, error: relError } = await supabase
    .from('tag_relations')
    .select('tag_a, tag_b, strength')
    .order('strength', { ascending: false });

  if (relError) {
    return NextResponse.json({ error: relError.message }, { status: 500 });
  }

  // Filter edges to only include nodes present in the graph
  const edges = (relations || [])
    .filter((r) => nodeIds.has(r.tag_a) && nodeIds.has(r.tag_b))
    .map((r) => ({
      source: r.tag_a,
      target: r.tag_b,
      strength: r.strength,
    }));

  const graphData: TagGraphData = { nodes, edges };

  return NextResponse.json(graphData, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
