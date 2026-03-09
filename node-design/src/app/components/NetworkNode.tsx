import { motion } from 'motion/react';
import type { BlogNode } from '../data/blogData';

interface NetworkNodeProps {
  node: BlogNode;
  isActive: boolean;
  isDimmed: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onHover: () => void;
}

export function NetworkNode({ 
  node, 
  isActive, 
  isDimmed, 
  isHighlighted,
  onClick,
  onHover 
}: NetworkNodeProps) {
  const position = node.position || { x: 0, y: 0 };
  
  // Determine node style based on type
  const getNodeStyle = () => {
    if (node.type === 'category') {
      return {
        className: 'px-4 py-2 rounded-full border',
        color: '#00FFC8',
        size: 'medium'
      };
    } else if (node.type === 'subcategory') {
      return {
        className: 'px-3 py-1.5 rounded-full border',
        color: '#A78BFA',
        size: 'small'
      };
    } else {
      return {
        className: 'w-2 h-2 rounded-full',
        color: '#FFFFFF',
        size: 'tiny'
      };
    }
  };

  const style = getNodeStyle();
  
  // Calculate opacity based on state
  let opacity = 0.4;
  if (isDimmed) opacity = 0.1;
  if (isActive) opacity = 1;
  if (isHighlighted) opacity = 0.9;
  
  // Calculate scale
  let scale = 1;
  if (isActive) scale = 1.1;
  if (isHighlighted) scale = 1.15;

  return (
    <motion.div
      className="absolute cursor-pointer select-none"
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
        fontFamily: 'IBM Plex Mono, monospace',
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity,
        scale,
        y: [0, -3, 0],
      }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
        y: {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      }}
      onClick={onClick}
      onMouseEnter={onHover}
    >
      <div
        className={style.className}
        style={{
          borderColor: style.color,
          backgroundColor: isActive ? `${style.color}20` : 'transparent',
          color: '#F0F0F0',
          fontSize: node.type === 'post' ? '10px' : '13px',
          boxShadow: isHighlighted ? `0 0 20px ${style.color}` : `0 0 10px ${style.color}40`,
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
            ease: 'easeOut'
          }}
        />
      )}
    </motion.div>
  );
}
