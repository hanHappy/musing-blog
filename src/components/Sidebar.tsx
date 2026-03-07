'use client';

import Link from 'next/link';
import { useState } from 'react';
import ProfileCard from './ProfileCard';

interface Category {
  name: string;
  slug: string;
  count?: number;
  children?: Category[];
}

interface SidebarProps {
  categories: Category[];
}

function CategoryItem({
  category,
  level = 0,
}: {
  category: Category;
  level?: number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="relative">
      <div className="flex items-center gap-1" style={{ paddingLeft: `${level * 1}rem` }}>
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            aria-label={isOpen ? 'Collapse category' : 'Expand category'}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
            >
              <path
                d="M4.5 2L8.5 6L4.5 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <Link
          href={`/category/${category.slug}`}
          className={`category-item group flex flex-1 items-center justify-between py-2 text-sm transition-colors ${!hasChildren ? 'ml-7' : ''}`}
        >
          <span className="flex-1">{category.name}</span>
          {category.count !== undefined && (
            <span className="text-xs text-[var(--text-muted)]">
              {category.count}
            </span>
          )}
        </Link>
      </div>
      {hasChildren && isOpen && category.children && (
        <div className="category-tree">
          {category.children.map((child) => (
            <CategoryItem key={child.slug} category={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ categories }: SidebarProps) {
  return (
    <aside className="w-full border-r border-[var(--border-color)] pr-6 lg:w-1/5">
      <div className="sticky top-4">
        <ProfileCard />

        {/* Divider line between profile and categories */}
        <div className="my-6 border-t border-[var(--border-color-light)]" />

        <div>
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Categories
          </h2>
          <nav className="space-y-0.5">
            {categories.map((category) => (
              <CategoryItem key={category.slug} category={category} />
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}
