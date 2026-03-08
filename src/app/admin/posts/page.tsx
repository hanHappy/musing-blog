'use client';

// Posts management page
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PostWithCategory } from '@/types/database';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PostWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--color-primary)' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Posts
        </h1>

        <Link
          href="/admin/posts/new"
          className="px-6 py-3 rounded-lg font-medium transition-all"
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-primary-light)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ➕ New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div
          className="card p-12 text-center"
          style={{ color: 'var(--text-secondary)' }}
        >
          <p className="text-lg mb-4">No posts yet.</p>
          <Link
            href="/admin/posts/new"
            style={{ color: 'var(--color-primary)' }}
          >
            Create your first post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="card p-6 flex justify-between items-center transition-all"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2
                    className="text-xl font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {post.title}
                  </h2>

                  {post.published ? (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: '#10b98120',
                        color: '#10b981',
                      }}
                    >
                      Published
                    </span>
                  ) : (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: '#f59e0b20',
                        color: '#f59e0b',
                      }}
                    >
                      Draft
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center gap-4 text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span>📁 {post.category?.name || 'Uncategorized'}</span>
                  <span>📅 {formatDate(post.created_at)}</span>
                  <span>🔗 /{post.slug}</span>
                </div>

                {post.excerpt && (
                  <p
                    className="mt-2 text-sm line-clamp-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {post.excerpt}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="px-4 py-2 rounded-lg transition-all"
                  style={{
                    color: 'var(--color-primary)',
                    border: '1px solid var(--color-primary)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                >
                  Edit
                </Link>

                <button
                  className="px-4 py-2 rounded-lg transition-all"
                  style={{
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onClick={() => {
                    if (
                      confirm(
                        `Are you sure you want to delete "${post.title}"?`
                      )
                    ) {
                      fetch(`/api/posts?id=${post.id}`, {
                        method: 'DELETE',
                      }).then(() => {
                        window.location.reload();
                      });
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
