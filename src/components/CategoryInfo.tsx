/**
 * Category information sidebar
 * Displays category description, post count, and subcategories
 */

import Link from 'next/link';

interface CategoryInfoProps {
  description?: string | null;
  postCount: number;
  subcategories?: { name: string; slug: string }[];
}

export default function CategoryInfo({
  description,
  postCount,
  subcategories,
}: CategoryInfoProps) {
  return (
    <aside className="hidden w-full border-l border-[var(--border-color)] pl-6 lg:block lg:w-1/4">
      <div className="sticky top-4">
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            About this Category
          </h2>

          {description && (
            <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          )}

          <div className="mb-4 text-xs text-[var(--text-muted)]">
            {postCount} {postCount === 1 ? 'post' : 'posts'}
          </div>

          {subcategories && subcategories.length > 0 && (
            <>
              <h3 className="mb-2 text-xs font-semibold text-[var(--text-primary)]">
                Subcategories
              </h3>
              <ul className="space-y-1">
                {subcategories.map((child) => (
                  <li key={child.slug}>
                    <Link
                      href={`/category/${child.slug}`}
                      className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--color-primary)]"
                    >
                      • {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
