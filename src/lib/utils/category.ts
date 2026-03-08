import type { Category } from '@/types/database';

// 캐시 구조 타입
interface CategoryCache {
  timestamp: number;
  data: Category[];
}

// 상수 정의
const CACHE_KEY = 'musing_categories' as const;
const CACHE_TTL = 3600000 as const; // 1시간 (ms)

/**
 * 카테고리 배열을 Map으로 변환 (O(1) 조회를 위함)
 * @param categories - 카테고리 배열
 * @returns Map<categoryId, Category>
 */
export function buildCategoryMap(
  categories: Category[]
): Map<string, Category> {
  const map = new Map<string, Category>();
  categories.forEach((cat) => map.set(cat.id, cat));
  return map;
}

/**
 * 카테고리 ID로부터 전체 경로 문자열 생성
 * @param categoryId - 카테고리 ID (null이면 'Uncategorized' 반환)
 * @param categoryMap - buildCategoryMap()으로 생성된 Map
 * @param maxDepth - 순환 참조 방지용 최대 깊이 (기본 10)
 * @returns 'Parent > Child > GrandChild' 형태 문자열
 */
export function getCategoryPath(
  categoryId: string | null,
  categoryMap: Map<string, Category>,
  maxDepth: number = 10
): string {
  if (!categoryId) return 'Uncategorized';

  const category = categoryMap.get(categoryId);
  if (!category) return 'Uncategorized';

  // 순환 참조 방지
  if (maxDepth <= 0) return category.name;

  // 재귀: 부모가 있으면 부모 경로도 포함
  if (category.parent_id) {
    const parentPath = getCategoryPath(
      category.parent_id,
      categoryMap,
      maxDepth - 1
    );
    return `${parentPath} > ${category.name}`;
  }

  return category.name;
}

/**
 * localStorage에서 캐시된 카테고리 데이터 조회
 * @returns 유효한 캐시가 있으면 Category[], 없으면 null
 */
export function getCachedCategories(): Category[] | null {
  // SSR 환경 체크
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as CategoryCache;

    // 데이터 검증
    if (!parsed.timestamp || !Array.isArray(parsed.data)) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // TTL 체크
    const now = Date.now();
    if (now - parsed.timestamp >= CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.data;
  } catch {
    // 에러 시 조용히 실패 (localStorage는 optional)
    return null;
  }
}

/**
 * localStorage에 카테고리 데이터 캐시 저장
 * @param categories - 저장할 카테고리 배열
 */
export function setCachedCategories(categories: Category[]): void {
  // SSR 환경 체크
  if (typeof window === 'undefined') return;

  try {
    const cache: CategoryCache = {
      timestamp: Date.now(),
      data: categories,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage quota 초과 시 무시
  }
}

/**
 * Recursively finds all descendant category IDs for a given category.
 * Uses BFS to avoid infinite loops in case of circular references.
 *
 * @param categoryId - The parent category ID
 * @param categoryMap - Map of all categories
 * @returns Array of category IDs including the parent and all descendants
 */
export function getDescendantCategoryIds(
  categoryId: string,
  categoryMap: Map<string, Category>
): string[] {
  const ids = [categoryId];
  const queue = [categoryId];
  const visited = new Set<string>([categoryId]);
  let depth = 0;

  while (queue.length > 0 && depth < 10) {
    const current = queue.shift()!;
    const children = Array.from(categoryMap.values()).filter(
      (cat) => cat.parent_id === current
    );

    children.forEach((child) => {
      if (!visited.has(child.id)) {
        ids.push(child.id);
        queue.push(child.id);
        visited.add(child.id);
      }
    });

    depth++;
  }

  return ids;
}

/**
 * Finds category slug by category name.
 * Used for breadcrumb navigation.
 *
 * @param name - Category name to search for
 * @param categoryMap - Map of all categories
 * @returns Category slug or empty string if not found
 */
export function getCategorySlugByName(
  name: string,
  categoryMap: Map<string, Category>
): string {
  const category = Array.from(categoryMap.values()).find(
    (cat) => cat.name === name
  );
  return category?.slug || '';
}
