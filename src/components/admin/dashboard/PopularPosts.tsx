'use client';

interface Props {
  data: { title: string; slug: string; view_count: number }[];
}

export default function PopularPosts({ data }: Props) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Popular Posts
      </h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[200px]" style={{ color: 'var(--text-secondary)' }}>
          No view data yet
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((post, i) => (
            <a
              key={post.slug}
              href={`/admin/posts/${post.slug}/edit`}
              className="flex items-center gap-3 p-3 rounded-lg transition-colors"
              style={{
                background: 'var(--bg-tertiary)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: i < 3 ? 'var(--color-primary)' : 'var(--bg-secondary)',
                  color: i < 3 ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {i + 1}
              </span>
              <span
                className="text-sm truncate flex-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {post.title}
              </span>
              <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                {post.view_count.toLocaleString()} views
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
