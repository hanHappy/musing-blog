'use client';

interface Props {
  data: { title: string; slug: string; published: boolean; created_at: string; view_count: number }[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentPosts({ data }: Props) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Recent Posts
      </h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[200px]" style={{ color: 'var(--text-secondary)' }}>
          No posts yet
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((post) => (
            <a
              key={post.slug}
              href={`/admin/posts/${post.slug}/edit`}
              className="flex items-center justify-between p-3 rounded-lg transition-colors"
              style={{
                background: 'var(--bg-tertiary)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: post.published ? '#10b981' : '#f59e0b' }}
                />
                <span
                  className="text-sm truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {post.title}
                </span>
              </div>
              <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-secondary)' }}>
                {timeAgo(post.created_at)}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
