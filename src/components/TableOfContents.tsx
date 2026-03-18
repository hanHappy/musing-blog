'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/constants';
import type { TocItem } from '@/types/category';

interface TableOfContentsProps {
  content: string;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

export default function TableOfContents({
  content,
  scrollContainerRef,
}: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    STORAGE_KEYS.TOC_COLLAPSED,
    false
  );
  const activeId = useScrollSpy(
    items.map((item) => item.id),
    scrollContainerRef?.current
  );

  useEffect(() => {
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(headingRegex));

    const extracted = matches.map((match) => ({
      id: match[2]
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\w\s-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
      text: match[2],
      level: match[1].length as 2 | 3,
    }));

    setItems(extracted);
  }, [content]);

  if (items.length === 0) return null;

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
      className="fixed right-8 top-1/2 -translate-y-1/2 z-20 max-w-xs hidden xl:block"
    >
      <div
        className="p-4 rounded-2xl border"
        style={{
          background: 'rgba(8, 11, 16, 0.8)',
          backdropFilter: 'blur(20px)',
          borderColor: 'var(--neural-border-glow)',
          boxShadow: '0 0 20px rgba(0, 255, 200, 0.2)',
          maxHeight: '60vh',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--neural-border-glow) transparent',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div
            className="text-xs font-semibold"
            style={{
              color: 'var(--neural-accent)',
              fontFamily: 'var(--font-ibm-plex-mono), monospace',
            }}
          >
            Table of Contents
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-xs transition-colors hover:opacity-80"
            style={{ color: 'var(--neural-text-muted)' }}
            aria-label="Toggle table of contents"
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? '▶' : '▼'}
          </button>
        </div>

        {!isCollapsed && (
          <div className="space-y-1">
            {items.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="block w-full text-left px-2 py-1.5 rounded-lg transition-colors"
                style={{
                  paddingLeft: item.level === 3 ? '1.5rem' : '0.5rem',
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
                  className="text-xs block truncate"
                  style={{
                    color:
                      activeId === item.id
                        ? 'var(--neural-accent)'
                        : item.level === 2
                          ? 'var(--neural-text-primary)'
                          : 'var(--neural-text-muted)',
                    fontFamily: 'var(--font-ibm-plex-mono), sans-serif',
                    fontWeight: item.level === 2 ? 600 : 400,
                  }}
                >
                  {item.text}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
