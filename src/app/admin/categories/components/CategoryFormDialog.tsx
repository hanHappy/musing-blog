'use client';

import * as Dialog from '@radix-ui/react-dialog';
import CategoryForm from './CategoryForm';
import type { Category } from '@/types/database';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  allCategories: Category[];
  onSubmit: (data: {
    name: string;
    slug: string;
    description: string;
    parent_id: string | null;
    level: 1 | 2 | 3;
  }) => void;
  /** If set, pre-fill parent_id for "add child" flow */
  defaultParentId?: string | null;
}

export default function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  allCategories,
  onSubmit,
  defaultParentId,
}: CategoryFormDialogProps) {
  const isEdit = !!category;

  const initialData = category
    ? {
        ...category,
        description: category.description ?? '',
      }
    : defaultParentId !== undefined
      ? {
          name: '',
          slug: '',
          description: '',
          parent_id: defaultParentId,
          level: (allCategories.find((c) => c.id === defaultParentId)
            ? Math.min(allCategories.find((c) => c.id === defaultParentId)!.level + 1, 3)
            : 1) as 1 | 2 | 3,
        }
      : undefined;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 50,
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            maxWidth: '500px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '1.5rem',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 51,
          }}
        >
          <Dialog.Title
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            {isEdit ? 'Edit Category' : 'New Category'}
          </Dialog.Title>

          <CategoryForm
            initialData={initialData}
            allCategories={allCategories}
            onSubmit={(data) => {
              onSubmit(data);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
            submitLabel={isEdit ? 'Save' : 'Create'}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
