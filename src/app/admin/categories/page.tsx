'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Category, CategoryWithChildren } from '@/types/database';
import CategoryTree from './components/CategoryTree';
import CategoryFormDialog from './components/CategoryFormDialog';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';

function flattenCategories(nodes: CategoryWithChildren[]): Category[] {
  return nodes.flatMap((node) => [
    node as Category,
    ...flattenCategories(node.children ?? []),
  ]);
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );

  const allFlat = useMemo(() => flattenCategories(categories), [categories]);

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // --- Handlers ---

  const handleEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setDefaultParentId(null);
    setFormOpen(true);
  }, []);

  const handleAddChild = useCallback((parentId: string) => {
    setEditingCategory(null);
    setDefaultParentId(parentId);
    setFormOpen(true);
  }, []);

  const handleNewCategory = useCallback(() => {
    setEditingCategory(null);
    setDefaultParentId(null);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((category: Category) => {
    setDeletingCategory(category);
    setDeleteOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: {
      name: string;
      slug: string;
      description: string;
      parent_id: string | null;
      level: 1 | 2 | 3;
    }) => {
      try {
        if (editingCategory) {
          const res = await fetch('/api/categories', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingCategory.id, ...data }),
          });
          if (!res.ok) throw new Error('Failed to update category');
        } else {
          const res = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to create category');
        }
        await fetchCategories();
      } catch (error) {
        console.error(error);
        alert(editingCategory ? 'Failed to update category' : 'Failed to create category');
      }
    },
    [editingCategory, fetchCategories]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingCategory) return;
    try {
      const res = await fetch(`/api/categories?id=${deletingCategory.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete category');
      await fetchCategories();
    } catch (error) {
      console.error(error);
      alert('Failed to delete category');
    }
  }, [deletingCategory, fetchCategories]);

  const handleReorder = useCallback(
    async (
      updates: Array<{
        id: string;
        parent_id: string | null;
        level: 1 | 2 | 3;
        order: number;
      }>
    ) => {
      try {
        const res = await fetch('/api/categories/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        });
        if (!res.ok) throw new Error('Failed to reorder');
        await fetchCategories();
      } catch (error) {
        console.error(error);
        alert('Failed to reorder categories');
      }
    },
    [fetchCategories]
  );

  const handleInlineRename = useCallback(
    async (id: string, newName: string) => {
      try {
        const res = await fetch('/api/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, name: newName }),
        });
        if (!res.ok) throw new Error('Failed to rename category');
        await fetchCategories();
      } catch (error) {
        console.error(error);
        alert('Failed to rename category');
      }
    },
    [fetchCategories]
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
          onClick={handleNewCategory}
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
          + New Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div
          className="card p-12 text-center"
          style={{ color: 'var(--text-secondary)' }}
        >
          <p>No categories yet.</p>
        </div>
      ) : (
        <CategoryTree
          categories={categories}
          allFlat={allFlat}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddChild={handleAddChild}
          onReorder={handleReorder}
          onInlineRename={handleInlineRename}
        />
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
        allCategories={allFlat}
        onSubmit={handleFormSubmit}
        defaultParentId={defaultParentId}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        categoryName={deletingCategory?.name ?? ''}
        hasChildren={
          deletingCategory
            ? allFlat.some((c) => c.parent_id === deletingCategory.id)
            : false
        }
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
