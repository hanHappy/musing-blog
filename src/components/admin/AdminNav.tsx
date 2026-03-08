'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Posts', href: '/admin/posts', icon: '📝' },
  { name: 'Categories', href: '/admin/categories', icon: '📁' },
  { name: 'Media', href: '/admin/media', icon: '🖼️' },
  { name: 'RAG Settings', href: '/admin/rag', icon: '🤖' },
  { name: 'Blog Settings', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="card p-4"
      style={{
        position: 'sticky',
        top: '2rem',
      }}
    >
      <ul className="space-y-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                style={{
                  background: isActive
                    ? 'var(--color-primary)'
                    : 'transparent',
                  color: isActive ? 'white' : 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
