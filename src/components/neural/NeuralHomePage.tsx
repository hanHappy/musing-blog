'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NeuralNetwork } from './NeuralNetwork';
import { CenterCard } from './CenterCard';
import type { NeuralGraphData, NeuralNode } from '@/lib/neural-graph-builder';

interface NeuralHomePageProps {
  initialGraph: NeuralGraphData;
}

export function NeuralHomePage({ initialGraph }: NeuralHomePageProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [highlightedPosts, setHighlightedPosts] = useState<string[]>([]);

  const handleNodeClick = (node: NeuralNode) => {
    if (node.type === 'post') {
      if (node.slug) {
        router.push(`/posts/${node.slug}`);
      }
    } else if (node.type === 'category' || node.type === 'subcategory') {
      if (activeCategory === node.id) {
        setActiveCategory(null);
      } else {
        setActiveCategory(node.id);
      }
    }
  };

  const handleSlugClick = (slug: string) => {
    router.push(`/posts/${slug}`);
  };

  const handleHighlightPosts = (slugs: string[]) => {
    const nodeIds: string[] = [];
    slugs.forEach((slug) => {
      const node = initialGraph.postMap.get(slug);
      if (node) {
        nodeIds.push(node.id);
      }
    });
    setHighlightedPosts(nodeIds);

    setTimeout(() => {
      setHighlightedPosts([]);
    }, 5000);
  };

  const handleBackgroundClick = () => {
    setActiveCategory(null);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden neural-bg">
      <NeuralNetwork
        data={initialGraph.root}
        activeCategory={activeCategory}
        highlightedPosts={highlightedPosts}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
      />

      <CenterCard
        onSlugClick={handleSlugClick}
        onHighlightPosts={handleHighlightPosts}
      />
    </div>
  );
}
