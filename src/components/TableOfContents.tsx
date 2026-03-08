/**
 * Table of Contents component for blog posts
 * Extracts headings from markdown content and provides scroll spy navigation
 */

'use client';

import { useEffect, useState } from 'react';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/constants';
import type { TocItem } from '@/types/category';

interface TableOfContentsProps {
  content: string; // Markdown content
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    STORAGE_KEYS.TOC_COLLAPSED,
    false
  );
  const activeId = useScrollSpy(items.map((item) => item.id));

  useEffect(() => {
    // Extract headings from markdown (## and ### only)
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(headingRegex));

    const extracted = matches.map((match) => ({
      id: match[2]
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-'),
      text: match[2],
      level: match[1].length as 2 | 3,
    }));

    setItems(extracted);
  }, [content]);

  if (items.length === 0) return null;

  return (
    <aside className="hidden w-full border-l border-[var(--border-color)] pl-6 lg:block lg:w-1/4">
      <div className="sticky top-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            On This Page
          </h2>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            aria-label="Toggle table of contents"
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? '▶' : '▼'}
          </button>
        </div>

        {!isCollapsed && (
          <nav className="toc-container" aria-label="Table of contents">
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`toc-item block level-${item.level} ${
                      activeId === item.id ? 'active' : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(item.id)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </aside>
  );
}
