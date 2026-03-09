'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Post } from '@/types/database';

interface PostModalProps {
  slug: string | null;
  onClose: () => void;
}

export function PostModal({ slug, onClose }: PostModalProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setPost(null);
      return;
    }

    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/posts?slug=${slug}`);
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }

        const data = await response.json();
        if (data.posts && data.posts.length > 0) {
          setPost(data.posts[0]);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (!slug) return null;

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
          className="relative w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl neural-center-card"
          style={{
            boxShadow:
              '0 0 40px rgba(0, 255, 200, 0.3), inset 0 0 30px rgba(0, 255, 200, 0.05)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <X size={24} style={{ color: 'var(--neural-text-primary)' }} />
          </button>

          {/* Content */}
          <div
            className="overflow-y-auto max-h-[80vh] p-12"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--neural-border-glow) transparent',
            }}
          >
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#00FFC8] animate-pulse" />
                  <div
                    className="w-3 h-3 rounded-full bg-[#00FFC8] animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <div
                    className="w-3 h-3 rounded-full bg-[#00FFC8] animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-64">
                <p style={{ color: 'var(--neural-text-muted)' }}>{error}</p>
              </div>
            )}

            {post && !loading && !error && (
              <>
                {/* Meta info */}
                <div className="mb-6">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs border mb-4"
                    style={{
                      borderColor: 'var(--neural-node-sub)',
                      color: 'var(--neural-node-sub)',
                      fontFamily: 'var(--font-ibm-plex-mono), monospace',
                    }}
                  >
                    {post.slug}
                  </span>
                </div>

                {/* Title */}
                <h1
                  className="text-4xl mb-8"
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    color: 'var(--neural-text-primary)',
                    fontWeight: 600,
                  }}
                >
                  {post.title}
                </h1>

                {/* Excerpt */}
                {post.excerpt && (
                  <p
                    className="text-lg mb-8"
                    style={{
                      color: 'var(--neural-text-muted)',
                      fontFamily: 'var(--font-inter), sans-serif',
                    }}
                  >
                    {post.excerpt}
                  </p>
                )}

                {/* Content - Simple markdown rendering */}
                <div
                  className="prose prose-invert max-w-none post-prose"
                  style={{
                    fontFamily: 'var(--font-inter), sans-serif',
                    color: 'var(--neural-text-primary)',
                    lineHeight: 1.8,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: post.content
                      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em>$1</em>')
                      .replace(/\n\n/g, '</p><p>')
                      .replace(/^(.)/gm, '<p>$1')
                      .replace(/(.)\n/g, '$1</p>'),
                  }}
                />
              </>
            )}
          </div>

          {/* Glow effect */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgba(0, 255, 200, 0.1), transparent 50%)',
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
