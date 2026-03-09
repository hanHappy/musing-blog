'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { NeuralNode } from '@/lib/neural-graph-builder';
import type { DragHandlers } from '@/hooks/useD3ForceSimulation';

interface NetworkNodeProps {
  node: NeuralNode;
  isActive: boolean;
  isDimmed: boolean;
  isHighlighted: boolean;
  isVisible: boolean;
  onClick: () => void;
  onHover: () => void;
  dragHandlers: DragHandlers;
}

const NetworkNodeComponent = ({
  node,
  isActive,
  isDimmed,
  isHighlighted,
  isVisible,
  onClick,
  onHover,
  dragHandlers,
}: NetworkNodeProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  // Use D3-calculated position
  const x = node.x || 0;
  const y = node.y || 0;

  // Use calculated node size or defaults
  const width = node.w || 60;
  const height = node.h || 28;

  // Determine node style based on type
  const getNodeStyle = () => {
    if (node.type === 'category') {
      return {
        className: 'rounded-full border',
        color: 'var(--neural-node-cat)',
        size: 'medium',
      };
    } else if (node.type === 'subcategory') {
      return {
        className: 'rounded-full border',
        color: 'var(--neural-node-sub)',
        size: 'small',
      };
    } else {
      return {
        className: 'w-2 h-2 rounded-full',
        color: 'var(--neural-node-leaf)',
        size: 'tiny',
      };
    }
  };

  const style = getNodeStyle();

  // Calculate opacity based on state
  let opacity = 0.4;
  if (isDimmed) opacity = 0.1;
  if (isActive) opacity = 1;
  if (isHighlighted) opacity = 0.9;

  // Apply edge expansion dimming
  if (!isVisible) {
    opacity = 0.2;
  }

  // Calculate scale
  let scale = 1;
  if (isActive) scale = 1.1;
  if (isHighlighted) scale = 1.15;

  // Apply edge expansion scaling
  if (!isVisible) {
    scale = 0.9;
  }

  // Handle drag events
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    dragHandlers.onDragStart(node.id, e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      dragHandlers.onDrag(node.id, e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      dragHandlers.onDragEnd(node.id);
      setIsDragging(false);

      // Prevent click if dragged more than 5px (threshold)
      const distance = Math.sqrt(
        Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
      );
      if (distance < 5) {
        onClick();
      }
    }
  };

  return (
    <motion.div
      className="absolute select-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        fontFamily: 'var(--font-ibm-plex-mono), monospace',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity,
        scale,
      }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={onHover}
    >
      <div
        className={style.className}
        style={{
          borderColor: style.color,
          backgroundColor: isActive ? `${style.color}20` : 'transparent',
          color: 'var(--neural-text-primary)',
          fontSize: node.type === 'post' ? '10px' : '13px',
          boxShadow: isHighlighted
            ? `0 0 20px ${style.color}`
            : `0 0 10px ${style.color}40`,
          width: node.type !== 'post' ? `${width}px` : undefined,
          height: node.type !== 'post' ? `${height}px` : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: node.type === 'category' ? '0 1rem' : node.type === 'subcategory' ? '0 0.75rem' : undefined,
        }}
      >
        {node.type !== 'post' && node.label}
      </div>

      {isHighlighted && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${style.color}`,
          }}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.div>
  );
};

// Memoize with custom comparison
export const NetworkNode = React.memo(
  NetworkNodeComponent,
  (prev, next) => {
    const posChanged =
      Math.abs((prev.node.x || 0) - (next.node.x || 0)) > 1 ||
      Math.abs((prev.node.y || 0) - (next.node.y || 0)) > 1;

    return (
      !posChanged &&
      prev.isActive === next.isActive &&
      prev.isDimmed === next.isDimmed &&
      prev.isHighlighted === next.isHighlighted &&
      prev.isVisible === next.isVisible
    );
  }
);
