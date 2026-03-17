'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PostData {
  title: string;
  slug: string;
  content: string;
  created_at: string;
}

interface RelatedPost {
  title: string;
  slug: string;
}

interface PostDetailViewProps {
  post: PostData;
  relatedPosts: RelatedPost[];
  prevPost: RelatedPost | null;
  nextPost: RelatedPost | null;
}

export default function PostDetailView({
  post,
  relatedPosts,
  prevPost,
  nextPost,
}: PostDetailViewProps) {
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      if (scrollHeight <= clientHeight) {
        setScrollProgress(0);
        return;
      }
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    const ref = contentRef.current;
    ref?.addEventListener('scroll', handleScroll);
    return () => ref?.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBack = () => {
    router.push('/');
  };

  const handleNavigate = (slug: string) => {
    router.push(`/posts/${slug}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 neural-post-detail"
      style={{ background: 'var(--neural-bg)' }}
    >
      {/* Neural background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <defs>
            <pattern id="post-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="1" fill="#00FFC8" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#post-grid)" />
        </svg>

        {/* Reading progress neural pulse */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: scrollProgress > 0 ? [1, 2, 1] : 0,
            opacity: scrollProgress > 0 ? [0.5, 1, 0.5] : 0,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: '#00FFC8',
              boxShadow: '0 0 20px #00FFC8',
            }}
          />
        </motion.div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-20 px-8 py-6 flex items-center justify-between"
        style={{
          background: 'linear-gradient(180deg, rgba(8, 11, 16, 0.95) 0%, transparent 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
        >
          <ArrowLeft size={20} style={{ color: 'var(--neural-accent)' }} />
          <span
            style={{
              color: 'var(--neural-text-primary)',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
            }}
          >
            돌아가기
          </span>
        </button>

        {/* Progress bar */}
        <div className="flex-1 max-w-md mx-8 h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #00FFC8, #A78BFA)',
              boxShadow: '0 0 10px #00FFC8',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${scrollProgress}%` }}
          />
        </div>

        <div
          className="text-sm"
          style={{
            color: 'var(--neural-text-muted)',
            fontFamily: 'var(--font-ibm-plex-mono), monospace',
          }}
        >
          {Math.round(scrollProgress)}%
        </div>
      </motion.div>

      {/* Main content */}
      <motion.div
        ref={contentRef}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute inset-0 overflow-y-auto pt-32 pb-32"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--neural-border-glow) transparent',
        }}
      >
        <div className="max-w-3xl mx-auto px-8">
          {/* Post slug badge */}
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <span
              className="inline-block px-4 py-2 rounded-full border"
              style={{
                borderColor: 'var(--neural-node-sub)',
                color: 'var(--neural-node-sub)',
                fontFamily: 'var(--font-ibm-plex-mono), monospace',
                backgroundColor: 'rgba(167, 139, 250, 0.1)',
                boxShadow: '0 0 20px rgba(167, 139, 250, 0.2)',
              }}
            >
              {post.slug}
            </span>
          </motion.div>

          {/* Title with glow effect */}
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl mb-12 relative"
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              color: 'var(--neural-text-primary)',
              fontWeight: 700,
              textShadow: '0 0 30px rgba(0, 255, 200, 0.3)',
            }}
          >
            {post.title}
          </motion.h1>

          {/* Content */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="post-prose"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </motion.div>

          {/* Navigation nodes at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-24 flex flex-col sm:flex-row items-stretch justify-between gap-8"
          >
            {prevPost ? (
              <button
                onClick={() => handleNavigate(prevPost.slug)}
                className="flex-1 text-left"
              >
                <div
                  className="p-6 rounded-2xl border transition-all hover:shadow-[0_0_30px_rgba(0,255,200,0.3)]"
                  style={{
                    borderColor: '#00FFC840',
                    background: 'rgba(0, 255, 200, 0.05)',
                    backdropFilter: 'blur(10px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00FFC8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#00FFC840';
                  }}
                >
                  <div
                    className="text-xs mb-2"
                    style={{
                      color: 'var(--neural-text-muted)',
                      fontFamily: 'var(--font-ibm-plex-mono), monospace',
                    }}
                  >
                    ← 이전 글
                  </div>
                  <div
                    className="text-lg"
                    style={{
                      color: 'var(--neural-text-primary)',
                      fontFamily: 'var(--font-space-grotesk), sans-serif',
                    }}
                  >
                    {prevPost.title}
                  </div>
                </div>
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {nextPost ? (
              <button
                onClick={() => handleNavigate(nextPost.slug)}
                className="flex-1 text-right"
              >
                <div
                  className="p-6 rounded-2xl border transition-all hover:shadow-[0_0_30px_rgba(167,139,250,0.3)]"
                  style={{
                    borderColor: '#A78BFA40',
                    background: 'rgba(167, 139, 250, 0.05)',
                    backdropFilter: 'blur(10px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#A78BFA';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#A78BFA40';
                  }}
                >
                  <div
                    className="text-xs mb-2"
                    style={{
                      color: 'var(--neural-text-muted)',
                      fontFamily: 'var(--font-ibm-plex-mono), monospace',
                    }}
                  >
                    다음 글 →
                  </div>
                  <div
                    className="text-lg"
                    style={{
                      color: 'var(--neural-text-primary)',
                      fontFamily: 'var(--font-space-grotesk), sans-serif',
                    }}
                  >
                    {nextPost.title}
                  </div>
                </div>
              </button>
            ) : (
              <div className="flex-1" />
            )}
          </motion.div>

          {/* Related posts */}
          {relatedPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-16"
            >
              <h3
                className="text-xl mb-6"
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  color: 'var(--neural-text-primary)',
                  fontWeight: 600,
                }}
              >
                같은 카테고리의 다른 생각들
              </h3>
              <div className="flex flex-wrap gap-4">
                {relatedPosts.map((related, index) => (
                  <motion.button
                    key={related.slug}
                    onClick={() => handleNavigate(related.slug)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="px-4 py-2 rounded-full border"
                    style={{
                      borderColor: '#A78BFA40',
                      backgroundColor: 'rgba(167, 139, 250, 0.1)',
                      color: '#A78BFA',
                      fontFamily: 'var(--font-ibm-plex-mono), monospace',
                      fontSize: '13px',
                    }}
                  >
                    {related.title}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
