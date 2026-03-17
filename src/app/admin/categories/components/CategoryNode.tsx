'use client';

import { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Category } from '@/types/database';
import {
  GripVertical,
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';

export interface FlatNode {
  id: string;
  category: Category;
  depth: number;
  hasChildren: boolean;
  childCount: number;
}

interface CategoryNodeProps {
  node: FlatNode;
  collapsed: boolean;
  onToggle: (id: string) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddChild: (parentId: string) => void;
  onInlineRename: (id: string, newName: string) => void;
  isOver: boolean;
}

export default function CategoryNode({
  node,
  collapsed,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
  onInlineRename,
  isOver,
}: CategoryNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginLeft: `${node.depth * 2}rem`,
  };

  const cat = node.category;

  function handleDoubleClick() {
    if (isDragging) return;
    setEditValue(cat.name);
    setIsEditing(true);
  }

  function commitEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== cat.name) {
      onInlineRename(cat.id, trimmed);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      {isOver && (
        <div
          style={{
            height: 2,
            background: 'var(--color-primary)',
            borderRadius: 1,
            marginBottom: 2,
          }}
        />
      )}
      <div
        className="card p-3 mb-2 flex items-center gap-3 transition-all"
        style={{
          borderColor: isDragging ? 'var(--color-primary)' : undefined,
        }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded"
          style={{ color: 'var(--text-muted)', touchAction: 'none' }}
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>

        {/* Expand/collapse */}
        {node.hasChildren ? (
          <button
            onClick={() => onToggle(node.id)}
            className="p-1 rounded transition-all"
            style={{ color: 'var(--text-secondary)' }}
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
        ) : (
          <span style={{ width: 24 }} />
        )}

        {/* Category info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="font-semibold bg-transparent border-b outline-none"
              style={{
                color: 'var(--text-primary)',
                borderColor: 'var(--color-primary)',
                minWidth: 0,
                width: 'auto',
              }}
            />
          ) : (
            <span
              className="font-semibold"
              style={{ color: 'var(--text-primary)', cursor: 'pointer' }}
              onDoubleClick={handleDoubleClick}
              title="Double-click to rename"
            >
              {cat.name}
            </span>
          )}
          <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
            /{cat.slug}
          </span>
          <span
            className="text-xs ml-2 px-2 py-0.5 rounded-full"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
          >
            L{cat.level}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {cat.level < 3 && (
            <button
              onClick={() => onAddChild(cat.id)}
              className="p-2 rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
              title="Add child"
            >
              <Plus size={16} />
            </button>
          )}
          <button
            onClick={() => onEdit(cat)}
            className="p-2 rounded-lg transition-all"
            style={{ color: 'var(--text-secondary)' }}
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(cat)}
            className="p-2 rounded-lg transition-all"
            style={{ color: '#ef4444' }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
