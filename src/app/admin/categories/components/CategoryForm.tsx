'use client';

import { useState, useEffect } from 'react';
import type { Category } from '@/types/database';

interface CategoryFormProps {
  initialData?: {
    name: string;
    slug: string;
    description: string;
    parent_id: string | null;
    level: 1 | 2 | 3;
  };
  allCategories: Category[];
  onSubmit: (data: {
    name: string;
    slug: string;
    description: string;
    parent_id: string | null;
    level: 1 | 2 | 3;
  }) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export default function CategoryForm({
  initialData,
  allCategories,
  onSubmit,
  onCancel,
  submitLabel = 'Create',
}: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [parentId, setParentId] = useState<string>(initialData?.parent_id ?? '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setSlug(generated);
    }
  }, [name, slugManuallyEdited]);

  // Determine available parents based on level constraints
  const availableParents = allCategories.filter((cat) => {
    // Can't be parent of self
    if (initialData && cat.id === (initialData as Category & { id?: string }).id) return false;
    // Only level 1 and 2 can be parents (max level 3)
    return cat.level <= 2;
  });

  const computeLevel = (pid: string | null): 1 | 2 | 3 => {
    if (!pid) return 1;
    const parent = allCategories.find((c) => c.id === pid);
    if (!parent) return 1;
    return Math.min(parent.level + 1, 3) as 1 | 2 | 3;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pid = parentId || null;
    onSubmit({
      name,
      slug,
      description,
      parent_id: pid,
      level: computeLevel(pid),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

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
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugManuallyEdited(true);
          }}
          required
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          Parent
        </label>
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">None (Top Level)</option>
          {availableParents.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {'—'.repeat(cat.level - 1)} {cat.name}
            </option>
          ))}
        </select>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Level: {computeLevel(parentId || null)}
        </p>
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="px-6 py-3 rounded-lg font-medium transition-all"
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-lg font-medium transition-all"
          style={{
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
