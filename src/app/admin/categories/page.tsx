'use client';

import { useState, useEffect } from 'react';
import type { CategoryWithChildren } from '@/types/database';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parent_id: '',
    level: 1 as 1 | 2 | 3,
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to create category');

      await fetchCategories();
      setShowForm(false);
      setFormData({
        name: '',
        slug: '',
        parent_id: '',
        level: 1,
        description: '',
      });
    } catch (_error) {
      console.error('Failed to create category:', _error);
      alert('Failed to create category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will also delete child categories.'))
      return;

    try {
      await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      await fetchCategories();
    } catch (_error) {
      console.error('Failed to delete category:', _error);
      alert('Failed to delete category');
    }
  };

  const renderCategory = (cat: CategoryWithChildren, depth = 0) => (
    <div key={cat.id} style={{ marginLeft: `${depth * 2}rem` }}>
      <div
        className="card p-4 mb-2 flex justify-between items-center transition-all"
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        <div>
          <h3
            className="font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {cat.name}
          </h3>
          <p
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            /{cat.slug} • Level {cat.level}
          </p>
        </div>

        <button
          onClick={() => handleDelete(cat.id)}
          className="px-4 py-2 rounded-lg transition-all text-sm"
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
        >
          Delete
        </button>
      </div>

      {cat.children?.map((child) => renderCategory(child, depth + 1))}
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Categories
        </h1>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 rounded-lg font-medium transition-all"
          style={{
            background: 'var(--color-primary)',
            color: 'white',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-primary-light)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-primary)';
          }}
        >
          {showForm ? 'Cancel' : '➕ New Category'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-8">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Create Category
          </h2>

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
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
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
                Level *
              </label>
              <select
                value={formData.level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    level: parseInt(e.target.value) as 1 | 2 | 3,
                  })
                }
                className="w-full px-4 py-3 rounded-lg border"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-lg font-medium transition-all"
              style={{
                background: 'var(--color-primary)',
                color: 'white',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'var(--color-primary-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-primary)';
              }}
            >
              Create
            </button>
          </form>
        </div>
      )}

      <div>
        {categories.length === 0 ? (
          <div
            className="card p-12 text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            <p>No categories yet.</p>
          </div>
        ) : (
          categories.map((cat) => renderCategory(cat))
        )}
      </div>
    </div>
  );
}
