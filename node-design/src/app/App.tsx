import { useState, useEffect } from 'react';
import { CenterCard } from './components/CenterCard';
import { NeuralNetwork } from './components/NeuralNetwork';
import { PostModal } from './components/PostModal';
import { blogData, findPostBySlug } from './data/blogData';
import type { BlogNode } from './data/blogData';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [highlightedPosts, setHighlightedPosts] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogNode | null>(null);
  const [expandedEdge, setExpandedEdge] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position for edge detection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      const threshold = 120;
      const { innerWidth, innerHeight } = window;

      // Detect edge proximity
      if (e.clientX < threshold) {
        setExpandedEdge('left');
      } else if (e.clientX > innerWidth - threshold) {
        setExpandedEdge('right');
      } else if (e.clientY < threshold) {
        setExpandedEdge('top');
      } else if (e.clientY > innerHeight - threshold) {
        setExpandedEdge('bottom');
      } else {
        setExpandedEdge(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleNodeClick = (node: BlogNode) => {
    if (node.type === 'category') {
      setActiveCategory(prev => prev === node.id ? null : node.id);
      setHighlightedPosts([]);
    } else if (node.type === 'post') {
      setSelectedPost(node);
    }
  };

  const handleSlugClick = (slug: string) => {
    const post = findPostBySlug(slug);
    if (post) {
      setSelectedPost(post);
    }
  };

  const handleHighlightPosts = (slugs: string[]) => {
    setHighlightedPosts(slugs);
    // Auto-clear highlights after 5 seconds
    setTimeout(() => {
      setHighlightedPosts([]);
    }, 5000);
  };

  const handleBackgroundClick = () => {
    if (activeCategory) {
      setActiveCategory(null);
    }
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{ 
        background: 'var(--bg)',
        fontFamily: 'Inter, Noto Sans KR, sans-serif',
      }}
      onClick={handleBackgroundClick}
    >
      {/* Neural Network Background */}
      <NeuralNetwork
        data={blogData}
        activeCategory={activeCategory}
        highlightedPosts={highlightedPosts}
        onNodeClick={handleNodeClick}
        expandedEdge={expandedEdge}
      />

      {/* Center Card */}
      <div 
        className="relative z-10 min-h-screen flex items-center justify-center p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <CenterCard
          onSlugClick={handleSlugClick}
          onHighlightPosts={handleHighlightPosts}
        />
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {/* Ambient pulse animation overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 255, 200, 0.03), transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: var(--border-glow);
          border-radius: 3px;
          opacity: 0.5;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: var(--accent-color);
        }
      `}</style>
    </div>
  );
}
