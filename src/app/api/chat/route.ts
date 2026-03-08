// API route for RAG chatbot
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { ChatRequest, ChatResponse } from '@/types/database';

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

    // Step 2: Search for similar posts using pgvector
    const supabase = await createClient();
    const { data: similarPosts, error: searchError } = await supabase.rpc(
      'search_posts',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 3,
      }
    );

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json(
        { error: 'Failed to search posts' },
        { status: 500 }
      );
    }

    // If no similar posts found, return a default message
    if (!similarPosts || similarPosts.length === 0) {
      return NextResponse.json({
        answer:
          '죄송합니다. 관련된 블로그 포스트를 찾을 수 없습니다. 다른 질문을 해주시겠어요?',
        sources: [],
      });
    }

    // Step 3: Build context from similar posts
    const context = similarPosts
      .map((post: any) => `### ${post.title}\n${post.content.slice(0, 1000)}`)
      .join('\n\n');

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
              content: `당신은 블로그 어시스턴트입니다. 다음 블로그 포스트를 참고하여 사용자의 질문에 답변하세요.

참고 포스트:
${context}

답변 시 다음 규칙을 따르세요:
- 블로그 포스트의 내용을 바탕으로 정확하게 답변하세요
- 자연스러운 한국어로 답변하세요
- 답변은 300 토큰 이내로 간결하게 작성하세요
- 포스트에 없는 내용은 추측하지 마세요`,
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
      sources: similarPosts.map((post: any) => ({
        title: post.title,
        slug: post.slug,
      })),
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
