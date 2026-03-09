import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import type { BlogNode } from '../data/blogData';

interface PostModalProps {
  post: BlogNode | null;
  onClose: () => void;
}

export function PostModal({ post, onClose }: PostModalProps) {
  if (!post) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-8"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl"
          style={{
            background: 'var(--card-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-glow)',
            boxShadow: '0 0 40px rgba(0, 255, 200, 0.3), inset 0 0 30px rgba(0, 255, 200, 0.05)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <X size={24} style={{ color: 'var(--text-primary)' }} />
          </button>

          {/* Content */}
          <div 
            className="overflow-y-auto max-h-[80vh] p-12"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--border-glow) transparent',
            }}
          >
            {/* Meta info */}
            <div className="mb-6">
              <span 
                className="inline-block px-3 py-1 rounded-full text-xs border mb-4"
                style={{
                  borderColor: 'var(--node-sub)',
                  color: 'var(--node-sub)',
                  fontFamily: 'IBM Plex Mono, monospace',
                }}
              >
                {post.slug}
              </span>
            </div>

            {/* Title */}
            <h1 
              className="text-4xl mb-8"
              style={{
                fontFamily: 'Space Grotesk, Noto Sans KR, sans-serif',
                color: 'var(--text-primary)',
                fontWeight: 600,
              }}
            >
              {post.label}
            </h1>

            {/* Content */}
            <div 
              className="prose prose-invert max-w-none"
              style={{
                fontFamily: 'Inter, Noto Sans KR, sans-serif',
                color: 'var(--text-primary)',
                lineHeight: 1.8,
              }}
            >
              {post.content?.split('\n').map((line, index) => {
                if (line.startsWith('# ')) {
                  return (
                    <h1 key={index} className="text-3xl mt-8 mb-4" style={{ fontWeight: 600 }}>
                      {line.replace('# ', '')}
                    </h1>
                  );
                } else if (line.startsWith('## ')) {
                  return (
                    <h2 key={index} className="text-2xl mt-6 mb-3" style={{ fontWeight: 600 }}>
                      {line.replace('## ', '')}
                    </h2>
                  );
                } else if (line.startsWith('- ')) {
                  return (
                    <li key={index} className="ml-6 mb-2" style={{ color: 'var(--text-muted)' }}>
                      {line.replace('- ', '')}
                    </li>
                  );
                } else if (line.trim() === '') {
                  return <div key={index} className="h-4" />;
                } else {
                  return (
                    <p key={index} className="mb-4" style={{ color: 'var(--text-muted)' }}>
                      {line}
                    </p>
                  );
                }
              })}
            </div>
          </div>

          {/* Glow effect */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(0, 255, 200, 0.1), transparent 50%)',
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
