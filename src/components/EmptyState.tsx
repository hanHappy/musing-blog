/**
 * Empty state component for pages with no content
 * Displays a message and optional navigation link
 */

import Link from 'next/link';

interface EmptyStateProps {
  message?: string;
  linkText?: string;
  linkHref?: string;
}

export default function EmptyState({
  message = 'No posts yet in this category',
  linkText = 'Browse all posts',
  linkHref = '/',
}: EmptyStateProps) {
  return (
    <div className="card py-12 text-center">
      <p className="mb-4 text-lg text-[var(--text-secondary)]">{message}</p>
      <Link
        href={linkHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-light)]"
      >
        {linkText}
      </Link>
    </div>
  );
}
