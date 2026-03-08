/**
 * Breadcrumb navigation component
 * Displays hierarchical category path with clickable segments
 */

import Link from 'next/link';
import type { BreadcrumbSegment } from '@/types/category';

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
}

export default function Breadcrumb({ segments }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="breadcrumb">
        {segments.map((segment, index) => (
          <li key={index} className="flex items-center gap-2">
            {segment.href ? (
              <Link href={segment.href} className="breadcrumb-link">
                {segment.name}
              </Link>
            ) : (
              <span className="breadcrumb-current">{segment.name}</span>
            )}

            {index < segments.length - 1 && (
              <span className="breadcrumb-separator" aria-hidden="true">
                ›
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
