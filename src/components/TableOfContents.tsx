'use client';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  return (
    <aside className="w-full border-l border-[var(--border-color)] pl-6 lg:w-1/4">
      <div className="sticky top-4 space-y-6">
        {/* About Section */}
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            About
          </h2>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            A contemplative space for exploring ideas, technology, and the
            depths of thought.
          </p>
        </div>

        {/* Contact Section */}
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            Contact
          </h2>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Feel free to reach out with questions, ideas, or feedback.
          </p>
        </div>
      </div>
    </aside>
  );
}
