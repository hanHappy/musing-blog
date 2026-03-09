'use client';

import { useState } from 'react';
import { NeuralNetwork } from './NeuralNetwork';
import { CenterCard } from './CenterCard';
import { PostModal } from './PostModal';
import type { NeuralGraphData, NeuralNode } from '@/lib/neural-graph-builder';

interface NeuralHomePageProps {
  initialGraph: NeuralGraphData;
}

export function NeuralHomePage({ initialGraph }: NeuralHomePageProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [highlightedPosts, setHighlightedPosts] = useState<string[]>([]);
  const [selectedPostSlug, setSelectedPostSlug] = useState<string | null>(null);

  const handleNodeClick = (node: NeuralNode) => {
    if (node.type === 'post') {
      if (node.slug) {
        setSelectedPostSlug(node.slug);
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
    setSelectedPostSlug(slug);
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

      <PostModal slug={selectedPostSlug} onClose={() => setSelectedPostSlug(null)} />
    </div>
  );
}
