/**
 * 마크다운 청킹 유틸리티
 *
 * 블로그 마크다운 글을 의미 단위로 분할하고,
 * 각 청크에 메타데이터를 부착하여 임베딩 품질을 높인다.
 *
 * 전략:
 * 1차: 헤딩(# / ## / ###) 단위로 분할
 * 2차: 800토큰 초과 시 문단(\n\n) 단위로 재분할
 * 메타데이터(제목, 카테고리, 태그)를 임베딩 입력에 포함
 */

export interface ChunkMeta {
  category?: string;
  tags?: string[];
  excerpt?: string;
}

export interface Chunk {
  chunk_index: number;
  chunk_text: string;
  heading: string | null;
  metadata: ChunkMeta;
}

export interface ChunkInput {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  excerpt?: string;
}

// 대략적인 토큰 추정: 영어 ~4자/토큰, 한국어 ~2자/토큰
// 보수적으로 2.5자/토큰으로 계산
const CHARS_PER_TOKEN = 2.5;
const MAX_CHUNK_TOKENS = 800;
const MAX_CHUNK_CHARS = MAX_CHUNK_TOKENS * CHARS_PER_TOKEN; // 2000자

/**
 * 대략적인 토큰 수 추정
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * 마크다운을 헤딩 단위로 1차 분할
 */
function splitByHeadings(content: string): { heading: string | null; body: string }[] {
  // #, ## 또는 ### 단위로 분할
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const sections: { heading: string | null; body: string }[] = [];

  let lastIndex = 0;
  let lastHeading: string | null = null;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    // 이전 섹션의 본문 추출
    const body = content.slice(lastIndex, match.index).trim();
    if (body.length > 0 || sections.length === 0) {
      sections.push({ heading: lastHeading, body });
    }

    lastHeading = match[2].trim();
    lastIndex = match.index + match[0].length;
  }

  // 마지막 섹션
  const remainingBody = content.slice(lastIndex).trim();
  if (remainingBody.length > 0) {
    sections.push({ heading: lastHeading, body: remainingBody });
  }

  // 빈 body만 있는 섹션 제거
  return sections.filter((s) => s.body.length > 0);
}

/**
 * 긴 섹션을 문단(\n\n) 단위로 재분할
 */
function splitByParagraphs(
  text: string,
  heading: string | null,
  maxChars: number
): { heading: string | null; body: string }[] {
  if (text.length <= maxChars) {
    return [{ heading, body: text }];
  }

  const paragraphs = text.split(/\n\n+/);
  const result: { heading: string | null; body: string }[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if (currentChunk.length + para.length + 2 > maxChars && currentChunk.length > 0) {
      result.push({ heading, body: currentChunk.trim() });
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  if (currentChunk.trim().length > 0) {
    result.push({ heading, body: currentChunk.trim() });
  }

  return result;
}

/**
 * 청크의 임베딩 입력 텍스트를 구성한다.
 * 메타데이터를 접두사로 붙여 임베딩 벡터가 도메인 방향으로 인코딩되게 한다.
 */
export function buildEmbeddingInput(chunk: Chunk, title: string): string {
  const parts: string[] = [];

  parts.push(`[제목] ${title}`);

  if (chunk.metadata.category) {
    parts.push(`[카테고리] ${chunk.metadata.category}`);
  }

  if (chunk.metadata.tags && chunk.metadata.tags.length > 0) {
    parts.push(`[태그] ${chunk.metadata.tags.join(', ')}`);
  }

  if (chunk.heading) {
    parts.push(`[섹션] ${chunk.heading}`);
  }

  parts.push('');
  parts.push(chunk.chunk_text);

  return parts.join('\n');
}

/**
 * 마크다운 글을 청크로 분할한다.
 */
export function chunkMarkdown(input: ChunkInput): Chunk[] {
  const { title, content, category, tags, excerpt } = input;

  const metadata: ChunkMeta = {
    category: category || undefined,
    tags: tags && tags.length > 0 ? tags : undefined,
    excerpt: excerpt || undefined,
  };

  // 빈 콘텐츠 처리
  if (!content || content.trim().length === 0) {
    return [];
  }

  // 1차: 헤딩 기반 분할
  let sections = splitByHeadings(content);

  // 헤딩이 없는 문서: 전체를 하나의 섹션으로
  if (sections.length === 0) {
    sections = [{ heading: null, body: content.trim() }];
  }

  // 2차: 긴 섹션을 문단 단위로 재분할
  const refinedSections: { heading: string | null; body: string }[] = [];
  for (const section of sections) {
    refinedSections.push(...splitByParagraphs(section.body, section.heading, MAX_CHUNK_CHARS));
  }

  // Chunk 객체 생성
  const chunks: Chunk[] = refinedSections.map((section, index) => ({
    chunk_index: index,
    chunk_text: section.body,
    heading: section.heading,
    metadata,
  }));

  return chunks;
}
