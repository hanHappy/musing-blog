import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { NetworkNode } from './NetworkNode';
import type { BlogNode } from '../data/blogData';

interface NeuralNetworkProps {
  data: BlogNode;
  activeCategory: string | null;
  highlightedPosts: string[];
  onNodeClick: (node: BlogNode) => void;
  expandedEdge: 'top' | 'bottom' | 'left' | 'right' | null;
}

export function NeuralNetwork({ 
  data, 
  activeCategory, 
  highlightedPosts,
  onNodeClick,
  expandedEdge
}: NeuralNetworkProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Flatten all nodes for rendering
  const flattenNodes = (node: BlogNode, parentPos = { x: 0, y: 0 }): BlogNode[] => {
    const nodes: BlogNode[] = [];
    
    if (node.type !== 'root') {
      nodes.push(node);
    }
    
    if (node.children) {
      node.children.forEach(child => {
        nodes.push(...flattenNodes(child, node.position || parentPos));
      });
    }
    
    return nodes;
  };

  const allNodes = flattenNodes(data);

  // Render connection lines
  const renderConnections = () => {
    const lines: JSX.Element[] = [];
    
    const addLine = (from: { x: number; y: number }, to: { x: number; y: number }, id: string, isHighlighted = false) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const x1 = centerX + from.x;
      const y1 = centerY + from.y;
      const x2 = centerX + to.x;
      const y2 = centerY + to.y;
      
      lines.push(
        <motion.line
          key={id}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isHighlighted ? '#00FFC8' : '#00FFC880'}
          strokeWidth={isHighlighted ? 2 : 1}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHighlighted ? 0.8 : 0.2 }}
          transition={{ duration: 0.3 }}
        />
      );
    };

    const traverseAndConnect = (node: BlogNode, parentPos = { x: 0, y: 0 }) => {
      if (node.children) {
        node.children.forEach(child => {
          const childPos = child.position || parentPos;
          const nodePos = node.position || parentPos;
          
          const isHighlighted = highlightedPosts.includes(child.id) || 
                                (activeCategory && 
                                 (child.id === activeCategory || node.id === activeCategory));
          
          addLine(nodePos, childPos, `${node.id}-${child.id}`, isHighlighted);
          traverseAndConnect(child, childPos);
        });
      }
    };

    traverseAndConnect(data);
    return lines;
  };

  // Check if node should be visible based on edge expansion
  const isNodeVisible = (node: BlogNode) => {
    if (!expandedEdge) return true;
    
    const pos = node.position;
    if (!pos) return false;
    
    if (expandedEdge === 'left' && pos.x < -200) return true;
    if (expandedEdge === 'right' && pos.x > 200) return true;
    if (expandedEdge === 'top' && pos.y < -100) return true;
    if (expandedEdge === 'bottom' && pos.y > 100) return true;
    
    return false;
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* SVG for connection lines */}
      <svg className="absolute inset-0 w-full h-full">
        {renderConnections()}
      </svg>
      
      {/* Nodes */}
      <div className="absolute inset-0 pointer-events-auto">
        {allNodes.map(node => {
          const isActive = activeCategory === node.id;
          const isDimmed = activeCategory !== null && !isActive && 
                          !highlightedPosts.includes(node.id) &&
                          !(node.children?.some(c => c.id === activeCategory));
          const isHighlighted = highlightedPosts.includes(node.id);
          
          return (
            <NetworkNode
              key={node.id}
              node={node}
              isActive={isActive}
              isDimmed={isDimmed}
              isHighlighted={isHighlighted}
              onClick={() => onNodeClick(node)}
              onHover={() => setHoveredNode(node.id)}
            />
          );
        })}
      </div>

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(8, 11, 16, 0.7) 70%, rgba(8, 11, 16, 0.95) 100%)'
        }}
      />
    </div>
  );
}
