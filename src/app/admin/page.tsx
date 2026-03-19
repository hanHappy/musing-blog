'use client';

import { useEffect, useState } from 'react';
import type { DashboardData } from '@/types/database';
import PostTimelineChart from '@/components/admin/dashboard/PostTimelineChart';
import CategoryDistribution from '@/components/admin/dashboard/CategoryDistribution';
import PopularTags from '@/components/admin/dashboard/PopularTags';
import RecentPosts from '@/components/admin/dashboard/RecentPosts';
import PopularPosts from '@/components/admin/dashboard/PopularPosts';
import StorageGauge from '@/components/admin/dashboard/StorageGauge';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch dashboard');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
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

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--text-secondary)' }}>
          {error || 'Failed to load dashboard'}
        </p>
      </div>
    );
  }

  const cards = [
    { title: 'Total Posts', value: data.total_posts, icon: '📝', color: '#0c8bc9' },
    { title: 'Published', value: data.published_posts, icon: '✅', color: '#10b981' },
    { title: 'Drafts', value: data.draft_posts, icon: '📄', color: '#f59e0b' },
    { title: 'Categories', value: data.total_categories, icon: '📁', color: '#8b5cf6' },
    { title: 'Media Files', value: data.total_media, icon: '🖼️', color: '#ec4899' },
    { title: 'Storage', value: formatBytes(data.storage_used), icon: '💾', color: '#6366f1' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
        Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.title}
            className="card p-4 transition-all"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = card.color;
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{card.icon}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {card.title}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Post Timeline Chart */}
      <div className="mb-8">
        <PostTimelineChart data={data.post_timeline} />
      </div>

      {/* Category Distribution + Popular Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CategoryDistribution data={data.category_distribution} />
        <PopularTags data={data.popular_tags} />
      </div>

      {/* Recent Posts + Popular Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentPosts data={data.recent_posts} />
        <PopularPosts data={data.popular_posts} />
      </div>

      {/* Storage Gauge */}
      <div className="mb-8">
        <StorageGauge storageUsed={data.storage_used} totalMedia={data.total_media} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/admin/posts/new', icon: '➕', title: 'New Post', desc: 'Create a new blog post' },
            { href: '/admin/media', icon: '📤', title: 'Upload Media', desc: 'Upload images and files' },
            { href: '/admin/categories', icon: '📂', title: 'Manage Categories', desc: 'Organize your content' },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
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
              <span className="text-3xl">{action.icon}</span>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {action.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {action.desc}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
