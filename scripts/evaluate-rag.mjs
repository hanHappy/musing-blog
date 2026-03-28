/**
 * RAG 평가 스크립트
 * 10개 테스트 질문에 대한 유사도 점수를 측정한다.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// .env.local 파싱
const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim();
}

const OPENAI_API_KEY = env.OPENAI_API_KEY;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const questions = [
  { id: 1, q: 'Lambda cold start 해결 방법이 뭐임?', type: '특정 글' },
  { id: 2, q: 'RDS에서 Supabase로 마이그레이션하는 방법?', type: '특정 글' },
  { id: 3, q: 'API Gateway에 커스텀 도메인 연결하려면?', type: '특정 글' },
  { id: 4, q: 'ECS Fargate 대신 Lambda를 선택한 이유?', type: '특정 글' },
  { id: 5, q: '블로그 왜 시작했음?', type: '에세이' },
  { id: 6, q: 'AWS 인프라 구축 과정을 정리좀', type: '크로스' },
  { id: 7, q: '서버리스 관련 글 있음?', type: '추상적' },
  { id: 8, q: 'MSA에서 데이터 정합성을 어떻게 보장할 수 있음?', type: '무관' },
  { id: 9, q: '양자 컴퓨팅의 원리가 뭐임?', type: '무관' },
  { id: 10, q: '뭐 재밌는 글 있음?', type: '모호' },
];

async function getEmbedding(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });
  const data = await res.json();
  return data.data[0].embedding;
}

async function searchChunks(embedding) {
  const { data, error } = await supabase.rpc('search_chunks', {
    query_embedding: embedding,
    match_threshold: 0.0,
    match_count: 5,
  });
  if (error) throw new Error(error.message);
  return data || [];
}

console.log('RAG 평가 시작...\n');

const results = [];

for (const { id, q, type } of questions) {
  const embedding = await getEmbedding(q);
  const chunks = await searchChunks(embedding);
  const top1 = chunks[0]?.similarity ?? 0;
  const topChunks = chunks.slice(0, 3).map(c => `${c.similarity.toFixed(3)} [${c.heading || '(없음)'}] ${c.title}`);
  results.push({ id, q, type, top1, topChunks });

  const flag = top1 >= 0.3 ? (type === '무관' || type === '모호' ? '—' : '✅') : (type === '무관' || type === '모호' ? '—' : '❌');
  console.log(`#${id} [${type}] ${q}`);
  console.log(`  Top-1: ${top1.toFixed(3)} ${flag}`);
  topChunks.forEach(c => console.log(`    ${c}`));
  console.log();
}

console.log('=== 요약 ===');
const relevant = results.filter(r => ['특정 글', '에세이', '크로스'].includes(r.type));
const irrelevant = results.filter(r => r.type === '무관');
const avgRelevant = relevant.reduce((s, r) => s + r.top1, 0) / relevant.length;
const avgIrrelevant = irrelevant.reduce((s, r) => s + r.top1, 0) / irrelevant.length;
console.log(`관련 질문 평균 Top-1: ${avgRelevant.toFixed(3)}`);
console.log(`무관 질문 평균 Top-1: ${avgIrrelevant.toFixed(3)}`);
console.log(`분리 갭: ${(avgRelevant - avgIrrelevant).toFixed(3)}`);
