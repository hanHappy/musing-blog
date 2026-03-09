export interface BlogNode {
  id: string;
  type: 'root' | 'category' | 'subcategory' | 'post';
  label: string;
  slug?: string;
  children?: BlogNode[];
  position?: { x: number; y: number };
  content?: string;
}

export const blogData: BlogNode = {
  id: 'root',
  type: 'root',
  label: 'muse.log',
  children: [
    {
      id: 'it',
      type: 'category',
      label: 'IT',
      position: { x: -450, y: -200 },
      children: [
        {
          id: 'backend',
          type: 'subcategory',
          label: 'Backend',
          position: { x: -550, y: -280 },
          children: [
            {
              id: 'test-post-1',
              type: 'post',
              label: '테스트 게시글 1',
              slug: 'test-post-1',
              position: { x: -650, y: -340 },
              content: `# 테스트 게시글 1

백엔드 개발에 대한 첫 번째 글입니다. 여기서는 서버 아키텍처와 데이터베이스 설계에 대해 다룹니다.

## 주요 내용
- 마이크로서비스 아키텍처
- REST API 설계 원칙
- 데이터베이스 최적화

새로운 프로젝트를 시작할 때마다 항상 고민하는 부분들을 정리했습니다.`
            },
            {
              id: 'test-post-2',
              type: 'post',
              label: '테스트 게시글 2',
              slug: 'test-post-2',
              position: { x: -650, y: -220 },
              content: `# 테스트 게시글 2

Node.js와 TypeScript를 활용한 백엔드 개발 경험을 공유합니다.

## 배운 점
- TypeScript의 타입 안전성
- Express vs Fastify 성능 비교
- 에러 핸들링 best practices

실제 프로젝트에서 겪은 문제들과 해결 방법을 기록했습니다.`
            }
          ]
        },
        {
          id: 'frontend',
          type: 'subcategory',
          label: 'Frontend',
          position: { x: -550, y: -120 },
          children: [
            {
              id: 'test-post-3',
              type: 'post',
              label: '테스트 게시글 3',
              slug: 'test-post-3',
              position: { x: -650, y: -80 },
              content: `# 테스트 게시글 3

React와 Tailwind CSS를 활용한 모던 웹 개발에 대한 글입니다.

## 핵심 주제
- React Hooks 패턴
- Tailwind CSS 유틸리티 클래스
- 컴포넌트 재사용성

사용자 경험을 개선하기 위한 다양한 시도들을 기록했습니다.`
            }
          ]
        }
      ]
    },
    {
      id: 'idea',
      type: 'category',
      label: '아이디어',
      position: { x: 450, y: -200 },
      children: [
        {
          id: 'owning-thoughts',
          type: 'post',
          label: '생각을 소유하는 것',
          slug: 'owning-thoughts',
          position: { x: 600, y: -240 },
          content: `# 생각을 소유하는 것

우리는 얼마나 많은 생각을 정말 '소유'하고 있을까?

## 타인의 생각
SNS와 미디어를 통해 우리는 하루에도 수백 가지 생각을 접합니다. 그중 몇 개나 정말 내 생각이 될까요?

## 기록의 힘
생각을 기록하는 것은 단순히 메모하는 것이 아니라, 그 생각을 온전히 내 것으로 만드는 과정입니다.

블로그를 쓰는 이유도 여기에 있습니다. 떠오른 생각을 글로 정리하면서 비로소 그 생각을 소유하게 됩니다.`
        }
      ]
    },
    {
      id: 'stock',
      type: 'category',
      label: '주식',
      position: { x: 450, y: 100 },
      children: [
        {
          id: 'recording-loss',
          type: 'post',
          label: '손실을 기록하는 것',
          slug: 'recording-loss',
          position: { x: 600, y: 140 },
          content: `# 손실을 기록하는 것

투자에서 손실은 피할 수 없습니다. 중요한 건 그것을 어떻게 대하느냐입니다.

## 기록하지 않는 손실
많은 투자자들이 수익은 자랑하지만 손실은 숨깁니다. 심지어 자기 자신에게도.

## 배움의 기회
- 어떤 판단이 잘못되었는지
- 감정이 어떻게 작용했는지
- 다음엔 무엇을 다르게 할지

손실을 기록하고 분석하는 것이야말로 진정한 투자 공부입니다.

이 블로그에는 나의 성공뿐 아니라 실패도 솔직하게 기록합니다.`
        }
      ]
    },
    {
      id: 'life',
      type: 'category',
      label: '생활',
      position: { x: -450, y: 200 },
      children: []
    },
    {
      id: 'relationship',
      type: 'category',
      label: '관계',
      position: { x: 0, y: 300 },
      children: []
    }
  ]
};

// Helper function to get all posts
export function getAllPosts(node: BlogNode = blogData): BlogNode[] {
  const posts: BlogNode[] = [];
  
  if (node.type === 'post') {
    posts.push(node);
  }
  
  if (node.children) {
    for (const child of node.children) {
      posts.push(...getAllPosts(child));
    }
  }
  
  return posts;
}

// Helper function to find a post by slug
export function findPostBySlug(slug: string, node: BlogNode = blogData): BlogNode | null {
  if (node.type === 'post' && node.slug === slug) {
    return node;
  }
  
  if (node.children) {
    for (const child of node.children) {
      const found = findPostBySlug(slug, child);
      if (found) return found;
    }
  }
  
  return null;
}

// Helper function to search posts by keywords
export function searchPosts(query: string): BlogNode[] {
  const allPosts = getAllPosts();
  const keywords = query.toLowerCase().split(' ');
  
  return allPosts.filter(post => {
    const searchText = `${post.label} ${post.content || ''}`.toLowerCase();
    return keywords.some(keyword => searchText.includes(keyword));
  });
}
