'use client';

import { useState, useEffect } from 'react';
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
  const [expandedEdge, setExpandedEdge] = useState<
    'top' | 'bottom' | 'left' | 'right' | null
  >(null);

  // Track mouse position for edge detection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {

      const edgeThreshold = 120;
      const { innerWidth, innerHeight } = window;

      // Detect edge proximity
      if (e.clientY < edgeThreshold) {
        setExpandedEdge('top');
      } else if (e.clientY > innerHeight - edgeThreshold) {
        setExpandedEdge('bottom');
      } else if (e.clientX < edgeThreshold) {
        setExpandedEdge('left');
      } else if (e.clientX > innerWidth - edgeThreshold) {
        setExpandedEdge('right');
      } else {
        setExpandedEdge(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleNodeClick = (node: NeuralNode) => {
    if (node.type === 'post') {
      // Open post modal
      if (node.slug) {
        setSelectedPostSlug(node.slug);
      }
    } else if (node.type === 'category' || node.type === 'subcategory') {
      // Toggle category activation (night view effect)
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
    // Convert slugs to node IDs
    const nodeIds: string[] = [];
    slugs.forEach((slug) => {
      const node = initialGraph.postMap.get(slug);
      if (node) {
        nodeIds.push(node.id);
      }
    });
    setHighlightedPosts(nodeIds);

    // Auto-clear highlights after 5 seconds
    setTimeout(() => {
      setHighlightedPosts([]);
    }, 5000);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden neural-bg">
      {/* Neural Network Background */}
      <NeuralNetwork
        data={initialGraph.root}
        activeCategory={activeCategory}
        highlightedPosts={highlightedPosts}
        onNodeClick={handleNodeClick}
        expandedEdge={expandedEdge}
      />

      {/* Center Card - now positioned absolutely within itself */}
      <CenterCard
        onSlugClick={handleSlugClick}
        onHighlightPosts={handleHighlightPosts}
      />

      {/* Post Modal */}
      <PostModal slug={selectedPostSlug} onClose={() => setSelectedPostSlug(null)} />
    </div>
  );
}
