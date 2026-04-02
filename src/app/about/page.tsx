'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import NeuralFooter from '@/components/NeuralFooter';

export default function AboutPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      if (scrollHeight <= clientHeight) { setScrollProgress(0); return; }
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(Math.min(progress, 100));
    };
    const ref = contentRef.current;
    ref?.addEventListener('scroll', handleScroll);
    return () => ref?.removeEventListener('scroll', handleScroll);
  }, []);

  const skills = [
    { category: 'Frontend', items: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS'] },
    { category: 'Backend', items: ['Node.js', 'PostgreSQL', 'Supabase'] },
    { category: 'AI / Infra', items: ['OpenAI API', 'pgvector', 'Vercel'] },
  ];

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: 'var(--neural-bg)', color: 'var(--neural-text-primary)' }}
    >
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
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
        >
          <ArrowLeft size={20} style={{ color: 'var(--neural-accent)' }} />
          <span
            style={{
              color: 'var(--neural-text-muted)',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
            }}
          >
            돌아가기
          </span>
        </Link>

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

      {/* Scrollable content */}
      <div
        ref={contentRef}
        className="absolute inset-0 overflow-y-auto pt-32 pb-8"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--neural-border-glow) transparent',
        }}
      >
        <div className="max-w-2xl mx-auto px-6">

          {/* Profile */}
          <section className="mb-12">
            <div
              className="w-20 h-20 rounded-full mb-6 overflow-hidden border"
              style={{
                borderColor: 'var(--neural-border-glow)',
                boxShadow: '0 0 20px rgba(0, 255, 200, 0.15)',
              }}
            >
              <Image
                src="/avatar.png"
                alt="한상민"
                width={80}
                height={80}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <h1
              className="text-3xl font-semibold mb-3"
              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
            >
              한상민
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--neural-text-muted)' }}>
              사유하고, 기록하고, 연결하는 개발자.
              <br />
              생각의 흔적을 코드와 글로 남깁니다.
            </p>
          </section>

          {/* Divider */}
          <div
            className="mb-12"
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, var(--neural-border-glow), transparent)',
              opacity: 0.3,
            }}
          />

          {/* Skills */}
          <section className="mb-12">
            <h2
              className="text-sm font-medium mb-6 tracking-widest uppercase"
              style={{ color: 'var(--neural-accent)' }}
            >
              Skills
            </h2>
            <div className="flex flex-col gap-5">
              {skills.map(({ category, items }) => (
                <div key={category} className="flex gap-4 items-start">
                  <span
                    className="text-xs pt-0.5 w-20 shrink-0"
                    style={{ color: 'var(--neural-text-muted)' }}
                  >
                    {category}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <span
                        key={item}
                        className="text-xs px-2.5 py-1 rounded-md border"
                        style={{
                          background: 'var(--neural-card)',
                          borderColor: 'rgba(0, 255, 200, 0.2)',
                          color: 'var(--neural-text-primary)',
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        <NeuralFooter />
      </div>
    </div>
  );
}
