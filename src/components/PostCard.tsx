import Link from 'next/link';

interface PostCardProps {
  title: string;
  excerpt: string;
  slug: string;
  date: string;
  category: string;
}

export default function PostCard({
  title,
  excerpt,
  slug,
  date,
  category,
}: PostCardProps) {
  return (
    <article className="card mb-6 transition-all">
      {/* Header with category and date */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-primary)]">
          {category}
        </span>
        <span className="text-xs text-[var(--text-muted)]">{date}</span>
      </div>

      {/* Title */}
      <Link href={`/posts/${slug}`}>
        <h3 className="mb-3 text-xl font-semibold leading-tight text-[var(--text-primary)] transition-colors hover:text-[var(--color-primary)]">
          {title}
        </h3>
      </Link>

      {/* Excerpt */}
      <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">
        {excerpt}
      </p>

      {/* Read more link */}
      <Link
        href={`/posts/${slug}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-light)]"
      >
        Read more
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      </Link>
    </article>
  );
}
