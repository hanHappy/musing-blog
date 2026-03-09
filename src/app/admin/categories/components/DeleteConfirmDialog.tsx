'use client';

import * as Dialog from '@radix-ui/react-dialog';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  hasChildren: boolean;
  onConfirm: () => void;
}

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  categoryName,
  hasChildren,
  onConfirm,
}: DeleteConfirmDialogProps) {
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
            maxWidth: '400px',
            padding: '1.5rem',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 51,
          }}
        >
          <Dialog.Title
            className="text-lg font-semibold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Delete Category
          </Dialog.Title>

          <p style={{ color: 'var(--text-secondary)' }} className="mb-2">
            Are you sure you want to delete <strong>{categoryName}</strong>?
          </p>

          {hasChildren && (
            <p
              className="text-sm mb-4 p-3 rounded-lg"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              This category has child categories. They will also be deleted.
            </p>
          )}

          <div className="flex gap-3 justify-end mt-4">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg transition-all text-sm"
              style={{
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="px-4 py-2 rounded-lg transition-all text-sm font-medium"
              style={{
                background: '#ef4444',
                color: 'white',
              }}
            >
              Delete
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
