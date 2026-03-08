'use client';

// Admin Dashboard
import { useEffect, useState } from 'react';
import type { DashboardStats } from '@/types/database';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats', {
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--color-primary)' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--text-secondary)' }}>
          {error || 'Failed to load dashboard'}
        </p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Posts',
      value: stats.total_posts,
      icon: '📝',
      color: '#0c8bc9',
    },
    {
      title: 'Published Posts',
      value: stats.published_posts,
      icon: '✅',
      color: '#10b981',
    },
    {
      title: 'Draft Posts',
      value: stats.draft_posts,
      icon: '📄',
      color: '#f59e0b',
    },
    {
      title: 'Categories',
      value: stats.total_categories,
      icon: '📁',
      color: '#8b5cf6',
    },
    {
      title: 'Media Files',
      value: stats.total_media,
      icon: '🖼️',
      color: '#ec4899',
    },
    {
      title: 'Storage Used',
      value: formatBytes(stats.storage_used),
      icon: '💾',
      color: '#6366f1',
    },
  ];

  return (
    <div>
      <h1
        className="text-3xl font-bold mb-8"
        style={{ color: 'var(--text-primary)' }}
      >
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="card p-6 transition-all"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = card.color;
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">{card.icon}</span>
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: card.color + '20' }}
              >
                <span style={{ color: card.color, fontSize: '1.5rem' }}>
                  {card.icon}
                </span>
              </div>
            </div>

            <h3
              className="text-sm font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {card.title}
            </h3>

            <p
              className="text-3xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/posts/new"
            className="card p-4 flex items-center gap-4 transition-all"
            style={{ textDecoration: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <span className="text-3xl">➕</span>
            <div>
              <h3
                className="font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                New Post
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Create a new blog post
              </p>
            </div>
          </a>

          <a
            href="/admin/media"
            className="card p-4 flex items-center gap-4 transition-all"
            style={{ textDecoration: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <span className="text-3xl">📤</span>
            <div>
              <h3
                className="font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Upload Media
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Upload images and files
              </p>
            </div>
          </a>

          <a
            href="/admin/categories"
            className="card p-4 flex items-center gap-4 transition-all"
            style={{ textDecoration: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <span className="text-3xl">📂</span>
            <div>
              <h3
                className="font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Manage Categories
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Organize your content
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
