/**
 * Custom hook for scroll spy functionality
 * Tracks which heading is currently in the viewport
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks the currently visible heading ID using IntersectionObserver
 *
 * @param headingIds - Array of heading IDs to track
 * @param root - Optional scroll container element for IntersectionObserver root
 * @returns The ID of the currently active heading
 */
export function useScrollSpy(
  headingIds: string[],
  root?: HTMLElement | null
): string {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (headingIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        root: root ?? null,
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0.1,
      }
    );

    headingIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headingIds, root]);

  return activeId;
}
