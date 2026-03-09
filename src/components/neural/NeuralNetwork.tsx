'use client';

import { useMemo, useState, useEffect, type ReactElement } from 'react';
import { motion } from 'motion/react';
import { NetworkNode } from './NetworkNode';
import { useD3ForceSimulation } from '@/hooks/useD3ForceSimulation';
import { flattenNeuralGraph } from '@/lib/neural-graph-builder';
import type { NeuralNode } from '@/lib/neural-graph-builder';

interface NeuralNetworkProps {
  data: NeuralNode;
  activeCategory: string | null;
  highlightedPosts: string[];
  onNodeClick: (node: NeuralNode) => void;
  expandedEdge: 'top' | 'bottom' | 'left' | 'right' | null;
}

export function NeuralNetwork({
  data,
  activeCategory,
  highlightedPosts,
  onNodeClick,
}: NeuralNetworkProps) {
  // Edge hover state (for expanding nodes near screen edges)
  const [expandedEdge, setExpandedEdge] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);

  // Track mouse position for edge detection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const edgeThreshold = 120; // px from edge
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      if (clientY < edgeThreshold) {
        setExpandedEdge('top');
      } else if (clientY > innerHeight - edgeThreshold) {
        setExpandedEdge('bottom');
      } else if (clientX < edgeThreshold) {
        setExpandedEdge('left');
      } else if (clientX > innerWidth - edgeThreshold) {
        setExpandedEdge('right');
      } else {
        setExpandedEdge(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Prepare initial nodes and links for D3
  const { initialNodes, links } = useMemo(() => {
    const flatNodes = flattenNeuralGraph(data);
    const linkList: { source: string; target: string; depth: number }[] = [];

    const buildLinks = (node: NeuralNode, depth = 0) => {
      if (node.children) {
        node.children.forEach((child) => {
          linkList.push({
            source: node.id,
            target: child.id,
            depth: child.level || depth + 1,
          });
          buildLinks(child, child.level || depth + 1);
        });
      }
    };

    buildLinks(data);

    return {
      initialNodes: flatNodes,
      links: linkList,
    };
  }, [data]);

  // Viewport dimensions
  const svgWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const svgHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

  // Use D3 force simulation
  const {
    nodes: allNodes,
    dragHandlers,
    transform,
    onWheel,
    onPanStart,
    onPanMove,
    onPanEnd,
    isPanning,
  } = useD3ForceSimulation(initialNodes, links, {
    width: svgWidth,
    height: svgHeight,
    centerX: 0,
    centerY: 0,
  });

  // Helper function to get node direction based on position
  const getNodeDirection = (node: NeuralNode): 'top' | 'bottom' | 'left' | 'right' => {
    const x = (node.x || 0) - svgWidth / 2;
    const y = (node.y || 0) - svgHeight / 2;

    // Calculate angle from center
    const angle = Math.atan2(y, x);

    if (angle >= -Math.PI / 4 && angle < Math.PI / 4) return 'right';
    if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) return 'bottom';
    if (angle >= (-3 * Math.PI) / 4 && angle < -Math.PI / 4) return 'top';
    return 'left';
  };

  // Helper function to check if node should be visible based on expanded edge
  const isNodeVisible = (node: NeuralNode): boolean => {
    if (!expandedEdge) return true; // ambient state

    const direction = getNodeDirection(node);
    return direction === expandedEdge;
  };

  // Render connection lines using D3-updated positions
  const renderConnections = () => {
    const lines: ReactElement[] = [];
    const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

    links.forEach((link) => {
      const sourceNode = nodeMap.get(link.source);
      const targetNode = nodeMap.get(link.target);

      if (!sourceNode || !targetNode) return;

      const x1 = sourceNode.x || 0;
      const y1 = sourceNode.y || 0;
      const x2 = targetNode.x || 0;
      const y2 = targetNode.y || 0;

      const isHighlighted =
        highlightedPosts.includes(targetNode.id) ||
        (activeCategory !== null &&
          (sourceNode.id === activeCategory || targetNode.id === activeCategory));

      // Check if edge should be dimmed based on expandedEdge
      const isEdgeVisible = isNodeVisible(sourceNode) && isNodeVisible(targetNode);

      lines.push(
        <motion.line
          key={`${link.source}-${link.target}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isHighlighted ? '#00FFC8' : '#00FFC880'}
          strokeWidth={isHighlighted ? 2 : 1}
          initial={{ opacity: 0 }}
          animate={{ opacity: isEdgeVisible ? (isHighlighted ? 0.8 : 0.2) : 0.05 }}
          transition={{ duration: 0.3 }}
        />
      );
    });

    return lines;
  };


  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      onWheel={onWheel}
      onPointerDown={onPanStart}
      onPointerMove={onPanMove}
      onPointerUp={onPanEnd}
      onPointerLeave={onPanEnd}
    >
      {/* SVG for connection lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        width={svgWidth}
        height={svgHeight}
      >
        <g transform={`translate(${svgWidth / 2 + transform.x}, ${svgHeight / 2 + transform.y}) scale(${transform.k})`}>
          {renderConnections()}
        </g>
      </svg>

      {/* Nodes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${svgWidth / 2 + transform.x}px, ${svgHeight / 2 + transform.y}px) scale(${transform.k})`,
          transformOrigin: '0 0',
        }}
      >
        {allNodes.map((node) => {
          const isActive = activeCategory === node.id;
          const isDimmed =
            activeCategory !== null &&
            !isActive &&
            !highlightedPosts.includes(node.id) &&
            !node.children?.some((c) => c.id === activeCategory);
          const isHighlighted = highlightedPosts.includes(node.id);
          const visible = isNodeVisible(node);

          return (
            <div key={node.id} className="pointer-events-auto">
              <NetworkNode
                node={node}
                isActive={isActive}
                isDimmed={isDimmed}
                isHighlighted={isHighlighted}
                isVisible={visible}
                onClick={() => onNodeClick(node)}
                onHover={() => {}}
                dragHandlers={dragHandlers}
              />
            </div>
          );
        })}
      </div>

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(8, 11, 16, 0.7) 70%, rgba(8, 11, 16, 0.95) 100%)',
        }}
      />
    </div>
  );
}
