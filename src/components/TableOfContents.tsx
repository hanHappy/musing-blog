'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import type { TocItem } from '@/types/category';

interface TableOfContentsProps {
  content: string;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

export default function TableOfContents({
  scrollContainerRef,
}: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const activeId = useScrollSpy(
    items.map((item) => item.id),
    scrollContainerRef?.current
  );

  const extractHeadingsFromDOM = useCallback(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;

    const prose = container.querySelector('.post-prose');
    if (!prose) return;

    const headings = prose.querySelectorAll('h1[id], h2[id], h3[id]');
    const extracted: TocItem[] = Array.from(headings).map((el) => ({
      id: el.id,
      text: el.textContent || '',
      level: (el.tagName === 'H1' ? 1 : el.tagName === 'H2' ? 2 : 3) as 1 | 2 | 3,
    }));

    if (extracted.length > 0) {
      setItems(extracted);
    }
  }, [scrollContainerRef]);

  useEffect(() => {
    // DOM 렌더링 완료 후 헤딩 추출
    const timer = setTimeout(extractHeadingsFromDOM, 500);
    return () => clearTimeout(timer);
  }, [extractHeadingsFromDOM]);

  if (items.length === 0) return null;

  // 상대 레벨 계산: 글에서 실제 사용된 최소 헤딩 레벨을 기준으로 정규화
  const minLevel = Math.min(...items.map((item) => item.level));
  const getRelativeLevel = (level: number) =>
    Math.min(level - minLevel, 2) as 0 | 1 | 2;

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && scrollContainerRef?.current) {
      const offsetTop = element.offsetTop - 150;
      scrollContainerRef.current.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    } else if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-20 w-[220px] hidden xl:block"
    >
      <div
        className="p-4 rounded-2xl"
        style={{
          background: 'rgba(8, 11, 16, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '0.5px solid #00ffc880',
          boxShadow: '0 0 12px rgba(0, 255, 200, 0.2)',
          maxHeight: '60vh',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--neural-border-glow) transparent',
        }}
      >
        <div className="space-y-0.5">
            {items.map((item, index) => (
              <div key={item.id}>
                <motion.button
                  onClick={() => scrollToSection(item.id)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="block w-full text-left px-2 py-1.5 rounded-lg transition-colors"
                  style={{
                    paddingLeft: `${0.5 + getRelativeLevel(item.level) * 0.75}rem`,
                    backgroundColor:
                      activeId === item.id
                        ? 'rgba(0, 255, 200, 0.15)'
                        : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (activeId !== item.id) {
                      e.currentTarget.style.backgroundColor =
                        'rgba(0, 255, 200, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeId !== item.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span
                    className="block truncate"
                    style={{
                      color:
                        activeId === item.id
                          ? 'var(--neural-accent)'
                          : 'var(--neural-text-primary)',
                      fontFamily: 'var(--font-ibm-plex-mono), sans-serif',
                      fontWeight: getRelativeLevel(item.level) === 0 ? 700 : 500,
                      fontSize: getRelativeLevel(item.level) === 0 ? '13px' : '12px',
                      opacity: 1,
                    }}
                  >
                    {item.text}
                  </span>
                </motion.button>
              </div>
            ))}
          </div>
      </div>
    </motion.div>
  );
}
