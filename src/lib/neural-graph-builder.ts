import type { Post, CategoryWithChildren } from '@/types/database';

export interface NeuralNode {
  id: string;
  type: 'root' | 'category' | 'subcategory' | 'post';
  label: string;
  slug?: string;
  children?: NeuralNode[];
  position?: { x: number; y: number };
  categoryId?: string;
  level?: number;
  // D3 force simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  // Node size properties
  w?: number;
  h?: number;
  r?: number;
}

export interface NeuralGraphData {
  root: NeuralNode;
  nodeMap: Map<string, NeuralNode>;
  postMap: Map<string, NeuralNode>;
}

// Constants for node size calculation
const NODE_PAD_X = 16;
const NODE_PAD_Y = 10;
const FONT_PX = { 1: 13, 2: 11, 3: 10 } as const;
const CHAR_W = { 1: 8.5, 2: 7.5, 3: 6.8 } as const;

/**
 * Calculate node size based on label and depth
 */
function calculateNodeSize(node: NeuralNode): { w: number; h: number; r: number } {
  const depth = node.level || 0;
  const cw = CHAR_W[depth as keyof typeof CHAR_W] || 6.8;
  const fp = FONT_PX[depth as keyof typeof FONT_PX] || 10;

  let w = node.label.length * cw + NODE_PAD_X * 2;
  let h = fp + NODE_PAD_Y * 2;

  // Apply minimum and maximum constraints
  w = Math.max(60, Math.min(260, w));
  h = Math.max(28, h);

  // Calculate collision radius (diagonal length + margin)
  const r = Math.sqrt((w / 2) ** 2 + (h / 2) ** 2) + 6;

  return { w, h, r };
}

/**
 * Builds a neural network graph structure from categories and posts
 * Assigns positions based on the number of categories and their hierarchy
 */
export function buildNeuralGraph(
  categories: CategoryWithChildren[],
  posts: Post[]
): NeuralGraphData {
  const nodeMap = new Map<string, NeuralNode>();
  const postMap = new Map<string, NeuralNode>();

  // Create root node (always at center)
  const root: NeuralNode = {
    id: 'root',
    type: 'root',
    label: 'muse.log',
    position: { x: 0, y: 0 },
    children: [],
    level: 0,
  };
  const rootSize = calculateNodeSize(root);
  Object.assign(root, rootSize);

  // Get level 1 categories (top-level)
  const level1Categories = categories.filter((cat) => cat.level === 1);
  const categoryCount = level1Categories.length;

  // Calculate positions in a circle around the center
  const radius = 450; // Distance from center
  const angleStep = (2 * Math.PI) / Math.max(categoryCount, 1);

  level1Categories.forEach((category, index) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const categoryNode: NeuralNode = {
      id: category.id,
      type: 'category',
      label: category.name,
      slug: category.slug,
      position: { x, y },
      categoryId: category.id,
      level: 1,
      children: [],
    };
    const categorySize = calculateNodeSize(categoryNode);
    Object.assign(categoryNode, categorySize);

    // Find subcategories (level 2) — use tree children directly
    const subcategories = (category.children || []).filter(
      (cat) => cat.level === 2
    );

    subcategories.forEach((subcat, subIndex) => {
      // Position subcategories slightly further out and spread around parent
      const subAngle = angle + ((subIndex - subcategories.length / 2) * Math.PI) / 6;
      const subRadius = radius + 150;
      const subX = Math.cos(subAngle) * subRadius;
      const subY = Math.sin(subAngle) * subRadius;

      const subcatNode: NeuralNode = {
        id: subcat.id,
        type: 'subcategory',
        label: subcat.name,
        slug: subcat.slug,
        position: { x: subX, y: subY },
        categoryId: subcat.id,
        level: 2,
        children: [],
      };
      const subcatSize = calculateNodeSize(subcatNode);
      Object.assign(subcatNode, subcatSize);

      // Find posts for this subcategory
      const subcatPosts = posts.filter(
        (post) => post.category_id === subcat.id && post.published
      );

      subcatPosts.forEach((post, postIndex) => {
        // Position posts even further out
        const postAngle =
          subAngle + ((postIndex - subcatPosts.length / 2) * Math.PI) / 12;
        const postRadius = subRadius + 120;
        const postX = Math.cos(postAngle) * postRadius;
        const postY = Math.sin(postAngle) * postRadius;

        const postNode: NeuralNode = {
          id: post.id,
          type: 'post',
          label: post.title,
          slug: post.slug,
          position: { x: postX, y: postY },
          categoryId: post.category_id || undefined,
          level: 3,
        };
        const postSize = calculateNodeSize(postNode);
        Object.assign(postNode, postSize);

        subcatNode.children?.push(postNode);
        nodeMap.set(post.id, postNode);
        postMap.set(post.slug, postNode);
      });

      categoryNode.children?.push(subcatNode);
      nodeMap.set(subcat.id, subcatNode);
    });

    // Find posts directly under level 1 category (no subcategory)
    const categoryPosts = posts.filter(
      (post) => post.category_id === category.id && post.published
    );

    categoryPosts.forEach((post, postIndex) => {
      const postAngle = angle + ((postIndex - categoryPosts.length / 2) * Math.PI) / 8;
      const postRadius = radius + 150;
      const postX = Math.cos(postAngle) * postRadius;
      const postY = Math.sin(postAngle) * postRadius;

      const postNode: NeuralNode = {
        id: post.id,
        type: 'post',
        label: post.title,
        slug: post.slug,
        position: { x: postX, y: postY },
        categoryId: post.category_id || undefined,
        level: 3,
      };
      const postSize = calculateNodeSize(postNode);
      Object.assign(postNode, postSize);

      categoryNode.children?.push(postNode);
      nodeMap.set(post.id, postNode);
      postMap.set(post.slug, postNode);
    });

    root.children?.push(categoryNode);
    nodeMap.set(category.id, categoryNode);
  });

  // Handle orphan posts (posts without category)
  const orphanPosts = posts.filter(
    (post) => !post.category_id && post.published
  );

  orphanPosts.forEach((post, index) => {
    const angle = ((index + categoryCount) * angleStep) - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const postNode: NeuralNode = {
      id: post.id,
      type: 'post',
      label: post.title,
      slug: post.slug,
      position: { x, y },
      level: 3,
    };
    const postSize = calculateNodeSize(postNode);
    Object.assign(postNode, postSize);

    root.children?.push(postNode);
    nodeMap.set(post.id, postNode);
    postMap.set(post.slug, postNode);
  });

  return { root, nodeMap, postMap };
}

/**
 * Flatten the neural graph into a list of all nodes
 */
export function flattenNeuralGraph(
  node: NeuralNode,
  parentPos = { x: 0, y: 0 }
): NeuralNode[] {
  const nodes: NeuralNode[] = [];

  if (node.type !== 'root') {
    nodes.push(node);
  }

  if (node.children) {
    node.children.forEach((child) => {
      nodes.push(...flattenNeuralGraph(child, node.position || parentPos));
    });
  }

  return nodes;
}

/**
 * Find node by ID in the graph
 */
export function findNodeById(
  nodeId: string,
  root: NeuralNode
): NeuralNode | null {
  if (root.id === nodeId) return root;

  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(nodeId, child);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Get all ancestor nodes of a given node
 */
export function getAncestors(
  nodeId: string,
  root: NeuralNode,
  ancestors: NeuralNode[] = []
): NeuralNode[] {
  if (root.id === nodeId) {
    return ancestors;
  }

  if (root.children) {
    for (const child of root.children) {
      const result = getAncestors(nodeId, child, [...ancestors, root]);
      if (result.length > 0) return result;
    }
  }

  return [];
}
