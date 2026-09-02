'use client';

import { useState, useEffect, useRef } from 'react';
import { generateSlug } from '@/lib/slug';
import { useRouter } from 'next/navigation';
import type { Category, CategoryWithChildren } from '@/types/database';
import TagSelector from '@/components/admin/TagSelector';
import dynamic from 'next/dynamic';
import type { MDEditorWithUploadRef } from '@/components/admin/editor/MDEditorWithUpload';

const MDEditorWithUpload = dynamic(
  () => import('@/components/admin/editor/MDEditorWithUpload'),
  { ssr: false }
);

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [published, setPublished] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<MDEditorWithUploadRef>(null);

  useEffect(() => {
    // Fetch categories
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data: CategoryWithChildren[]) => {
        // Flatten tree to list
        const flattenCategories = (cats: CategoryWithChildren[]): Category[] => {
          return cats.flatMap((cat) => [
            cat,
            ...(cat.children ? flattenCategories(cat.children) : []),
          ]);
        };
        setCategories(flattenCategories(data));
      });
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (title) {
      setSlug(generateSlug(title));
    }
  }, [title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalContent = await (editorRef.current?.uploadPendingImages(content) ?? Promise.resolve(content));

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          content: finalContent,
          excerpt,
          category_id: categoryId || null,
          published,
          tag_ids: tagIds,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create post');
      }

      router.push('/admin/posts');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create post');
      setLoading(false);
    }
  };

  return (
    <div>
      <h1
        className="text-3xl font-bold mb-8"
        style={{ color: 'var(--text-primary)' }}
      >
        New Post
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border outline-none transition-all"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.boxShadow = 'var(--shadow-md)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Slug */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Slug *
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border outline-none transition-all"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.boxShadow = 'var(--shadow-md)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Category */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border outline-none transition-all"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.boxShadow = 'var(--shadow-md)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="">Uncategorized</option>
            {categories
              .filter((cat) => cat.level === 1)
              .map((level1) => {
                const children = categories.filter(
                  (cat) => cat.parent_id === level1.id
                );
                const grandchildren = categories.filter((cat) =>
                  children.some((c) => c.id === cat.parent_id)
                );
                return (
                  <optgroup key={level1.id} label={level1.name}>
                    <option value={level1.id}>{level1.name}</option>
                    {children.map((level2) => (
                      <>
                        <option key={level2.id} value={level2.id}>
                          {'\u2003'}{level2.name}
                        </option>
                        {grandchildren
                          .filter((cat) => cat.parent_id === level2.id)
                          .map((level3) => (
                            <option key={level3.id} value={level3.id}>
                              {'\u2003\u2003'}{level3.name}
                            </option>
                          ))}
                      </>
                    ))}
                  </optgroup>
                );
              })}
          </select>
        </div>

        {/* Tags */}
        <TagSelector selectedTagIds={tagIds} onChange={setTagIds} />

        {/* Excerpt */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Excerpt
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border outline-none transition-all"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.boxShadow = 'var(--shadow-md)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Content */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Content (Markdown) *
          </label>
          <MDEditorWithUpload
            ref={editorRef}
            value={content}
            onChange={setContent}
            height={500}
          />
        </div>

        {/* Published */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-5 h-5"
          />
          <label
            htmlFor="published"
            className="text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Publish immediately
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              background: loading ? 'var(--bg-tertiary)' : 'var(--color-primary)',
              color: 'white',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'var(--color-primary-light)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'var(--color-primary)';
              }
            }}
          >
            {loading ? 'Creating...' : 'Create Post'}
          </button>

          <button
            type="button"
            onClick={() => { editorRef.current?.cleanup(); router.back(); }}
            className="px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
