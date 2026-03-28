/**
 * 임베딩 생성 유틸리티
 *
 * 포스트를 청크로 분할하고, 각 청크의 임베딩을 생성하여 DB에 저장한다.
 * OpenAI batch embedding API를 사용하여 한 번의 호출로 다수 청크를 처리한다.
 */

import { createClient } from '@/lib/supabase-server';
import { chunkMarkdown, buildEmbeddingInput, type ChunkInput } from './chunker';

interface EmbeddingResult {
  post_id: string;
  chunks_created: number;
}

/**
 * 포스트의 카테고리명과 태그명을 조회한다.
 */
async function getPostMeta(postId: string): Promise<{ category?: string; tags?: string[] }> {
  const supabase = await createClient();

  // 카테고리 조회
  const { data: post } = await supabase
    .from('posts')
    .select('category_id, categories(name)')
    .eq('id', postId)
    .single();

  // 태그 조회
  const { data: postTags } = await supabase
    .from('post_tags')
    .select('tags(name)')
    .eq('post_id', postId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postAny = post as any;
  const category = postAny?.categories?.name as string | undefined;
  const tags = postTags
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?.map((pt: any) => pt.tags?.name as string | undefined)
    .filter((name?: string): name is string => !!name);

  return { category: category || undefined, tags };
}

/**
 * OpenAI embedding API를 호출하여 텍스트 배열의 임베딩을 생성한다.
 * batch 요청으로 한 번의 API 호출로 다수 텍스트를 처리한다.
 */
async function createEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const { data } = await response.json();

  // API 응답의 index 순서대로 정렬
  const sorted = [...data].sort(
    (a: { index: number }, b: { index: number }) => a.index - b.index
  );
  return sorted.map((item: { embedding: number[] }) => item.embedding);
}

/**
 * 포스트의 청크 임베딩을 생성한다.
 *
 * 1. 포스트 메타데이터(카테고리, 태그) 조회
 * 2. 마크다운을 청크로 분할
 * 3. 각 청크의 임베딩 입력 텍스트 구성
 * 4. OpenAI batch embedding 호출
 * 5. 기존 청크 삭제 → 새 청크 + 임베딩 저장
 */
export async function generateChunkEmbeddings(
  postId: string,
  title: string,
  content: string,
  excerpt?: string | null
): Promise<EmbeddingResult> {
  // 1. 메타데이터 조회
  const { category, tags } = await getPostMeta(postId);

  // 2. 청크 분할
  const chunkInput: ChunkInput = {
    title,
    content,
    category,
    tags,
    excerpt: excerpt || undefined,
  };

  const chunks = chunkMarkdown(chunkInput);

  if (chunks.length === 0) {
    return { post_id: postId, chunks_created: 0 };
  }

  // 3. 임베딩 입력 텍스트 구성
  const embeddingInputs = chunks.map((chunk) => buildEmbeddingInput(chunk, title));

  // 4. batch embedding 생성
  const embeddings = await createEmbeddings(embeddingInputs);

  // 5. DB 저장 (기존 청크 삭제 → 새 청크 삽입)
  const supabase = await createClient();

  await supabase.from('post_chunks').delete().eq('post_id', postId);

  const rows = chunks.map((chunk, i) => ({
    post_id: postId,
    chunk_index: chunk.chunk_index,
    chunk_text: chunk.chunk_text,
    heading: chunk.heading,
    metadata: chunk.metadata,
    embedding: embeddings[i],
  }));

  const { error } = await supabase.from('post_chunks').insert(rows);

  if (error) {
    throw new Error(`Failed to save chunks: ${error.message}`);
  }

  return { post_id: postId, chunks_created: chunks.length };
}
