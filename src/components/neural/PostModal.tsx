'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Post } from '@/types/database';

interface PostModalProps {
  slug: string | null;
  onClose: () => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
        const posts = Array.isArray(data) ? data : data.posts;
        if (posts && posts.length > 0) {
          setPost(posts[0]);
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

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (slug) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [slug, onClose]);

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
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Modal — neural-center-card 스타일 (채팅 박스와 동일) */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          className="relative w-full max-w-3xl max-h-[85vh] neural-center-card rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 p-2 rounded-lg hover:bg-[rgba(0,255,200,0.1)] transition-colors"
          >
            <X size={20} style={{ color: 'var(--neural-accent)' }} />
          </button>

          {/* Scrollable content */}
          <div
            className="overflow-y-auto max-h-[85vh] p-10 pt-8"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,255,200,0.3) transparent',
            }}
          >
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00FFC8] animate-pulse" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00FFC8] animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00FFC8] animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center justify-center h-64">
                <p style={{ color: 'var(--neural-text-muted)' }}>{error}</p>
              </div>
            )}

            {/* Post content */}
            {post && !loading && !error && (
              <article>
                {/* Title */}
                <h1
                  className="text-3xl mb-4 pr-8"
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    color: 'var(--neural-text-primary)',
                    fontWeight: 600,
                    lineHeight: 1.3,
                  }}
                >
                  {post.title}
                </h1>

                {/* Meta */}
                <div
                  className="flex items-center gap-4 mb-6 pb-6 text-sm"
                  style={{
                    borderBottom: '1px solid rgba(0,255,200,0.15)',
                    color: 'var(--neural-text-muted)',
                  }}
                >
                  <time dateTime={post.created_at}>
                    {formatDate(post.created_at)}
                  </time>
                </div>

                {/* Excerpt */}
                {post.excerpt && (
                  <p
                    className="text-base mb-8"
                    style={{
                      color: 'var(--neural-text-muted)',
                      lineHeight: 1.7,
                      fontStyle: 'italic',
                    }}
                  >
                    {post.excerpt}
                  </p>
                )}

                {/* Body — ReactMarkdown + post-prose 스타일 */}
                <div className="post-prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {post.content}
                  </ReactMarkdown>
                </div>
              </article>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
