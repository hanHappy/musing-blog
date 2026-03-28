// API route for RAG chatbot (chunk-based search)
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { ChatRequest, ChatResponse } from '@/types/database';

interface SearchChunkResult {
  chunk_id: string;
  post_id: string;
  title: string;
  slug: string;
  chunk_text: string;
  heading: string | null;
  chunk_index: number;
  metadata: Record<string, unknown>;
  similarity: number;
}

/**
 * 검색된 청크들을 포스트별로 그룹화하고, chunk_index 순으로 정렬하여
 * 구조화된 컨텍스트를 조립한다.
 */
function buildContext(chunks: SearchChunkResult[]): { context: string; sources: { title: string; slug: string }[] } {
  // 포스트별 그룹화
  const postMap = new Map<string, { title: string; slug: string; chunks: SearchChunkResult[] }>();

  for (const chunk of chunks) {
    const existing = postMap.get(chunk.post_id);
    if (existing) {
      existing.chunks.push(chunk);
    } else {
      postMap.set(chunk.post_id, {
        title: chunk.title,
        slug: chunk.slug,
        chunks: [chunk],
      });
    }
  }

  // 각 포스트 내 청크를 chunk_index 순으로 정렬
  const contextParts: string[] = [];
  const sources: { title: string; slug: string }[] = [];

  for (const [, post] of postMap) {
    post.chunks.sort((a, b) => a.chunk_index - b.chunk_index);
    sources.push({ title: post.title, slug: post.slug });

    const chunkTexts = post.chunks.map((c) => {
      const sectionLabel = c.heading ? `[섹션: ${c.heading}]\n` : '';
      return `${sectionLabel}${c.chunk_text}`;
    });

    contextParts.push(`=== 출처: ${post.title} ===\n${chunkTexts.join('\n\n')}`);
  }

  return { context: contextParts.join('\n\n'), sources };
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Step 1: Generate embedding for user question
    const embeddingResponse = await fetch(
      'https://api.openai.com/v1/embeddings',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: message,
        }),
      }
    );

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Step 2: Search for similar chunks using pgvector
    const supabase = await createClient();
    const { data: similarChunks, error: searchError } = await supabase.rpc(
      'search_chunks',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 5,
      }
    );

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json(
        { error: 'Failed to search posts' },
        { status: 500 }
      );
    }

    // If no similar chunks found, return a default message
    if (!similarChunks || similarChunks.length === 0) {
      return NextResponse.json({
        answer:
          '죄송합니다. 관련된 블로그 포스트를 찾을 수 없습니다. 다른 질문을 해주시겠어요?',
        sources: [],
      });
    }

    const typedChunks = similarChunks as SearchChunkResult[];

    // Step 3: Build context from similar chunks (grouped by post)
    const { context, sources } = buildContext(typedChunks);

    // Step 4: Generate answer using GPT
    const completionResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `당신은 "muse.log" 블로그의 AI 어시스턴트입니다.
아래 블로그 포스트 내용을 참고하여 사용자의 질문에 답변하세요.

${context}

답변 시 다음 규칙을 따르세요:
- 참고 포스트의 내용을 바탕으로 정확하게 답변하세요
- 자연스러운 한국어로 답변하세요
- 답변은 300 토큰 이내로 간결하게 작성하세요
- 포스트에 없는 내용은 추측하지 마세요
- 어떤 포스트를 참고했는지 자연스럽게 언급하세요`,
            },
            {
              role: 'user',
              content: message,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      }
    );

    if (!completionResponse.ok) {
      throw new Error('Failed to generate answer');
    }

    const completionData = await completionResponse.json();
    const answer = completionData.choices[0].message.content;

    // Step 5: Return answer with sources
    const response: ChatResponse = {
      answer,
      sources,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
