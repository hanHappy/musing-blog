import Link from 'next/link';
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
  const paddingClass = level === 0 ? 'pl-0' : level === 1 ? 'pl-4' : 'pl-8';

  return (
    <div className={paddingClass}>
      <Link
        href={`/category/${category.slug}`}
        className="category-item group flex items-center justify-between py-2 text-sm transition-colors"
      >
        <span className="flex-1">{category.name}</span>
        {category.count && (
          <span className="text-xs text-[var(--text-muted)]">
            {category.count}
          </span>
        )}
      </Link>
      {category.children && category.children.length > 0 && (
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
