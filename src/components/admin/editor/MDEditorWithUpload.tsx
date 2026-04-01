'use client';

import {
  useRef,
  useState,
  useCallback,
  useMemo,
  useImperativeHandle,
  forwardRef,
  DragEvent,
  ClipboardEvent,
} from 'react';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });
const MermaidPreview = dynamic(() => import('@/components/MermaidDiagram'), { ssr: false });

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface MDEditorWithUploadRef {
  /** submit 시 호출: blob URL → 실제 URL로 교체된 content 반환 */
  uploadPendingImages: (content: string) => Promise<string>;
  /** 취소 시 호출: blob URL revoke */
  cleanup: () => void;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

// blobUrl → File 매핑
type PendingImage = { blobUrl: string; file: File; altText: string };

const MDEditorWithUpload = forwardRef<MDEditorWithUploadRef, Props>(
  ({ value, onChange, height = 500 }, ref) => {
    const [dragOver, setDragOver] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingRef = useRef<PendingImage[]>([]);

    const extractText = (node: React.ReactNode): string => {
      if (typeof node === 'string') return node;
      if (typeof node === 'number') return String(node);
      if (Array.isArray(node)) return node.map(extractText).join('');
      if (node && typeof node === 'object' && 'props' in node) {
        return extractText((node as React.ReactElement<{ children?: React.ReactNode }>).props.children);
      }
      return '';
    };

    const previewComponents = useMemo(() => ({
      pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
        const child = Array.isArray(children) ? children[0] : children;
        if (
          child &&
          typeof child === 'object' &&
          'props' in child
        ) {
          const codeEl = child as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
          if (codeEl.props.className?.includes('language-mermaid')) {
            return <MermaidPreview chart={extractText(codeEl.props.children)} />;
          }
        }
        return <pre {...props}>{children}</pre>;
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), []);

    const insertMarkdown = useCallback(
      (markdown: string) => {
        const textarea = editorRef.current?.querySelector('textarea');
        if (textarea) {
          const start = textarea.selectionStart ?? value.length;
          const end = textarea.selectionEnd ?? value.length;
          const newValue = value.slice(0, start) + markdown + value.slice(end);
          onChange(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = start + markdown.length;
            textarea.selectionEnd = start + markdown.length;
            textarea.focus();
          });
        } else {
          onChange(value + '\n' + markdown);
        }
      },
      [value, onChange]
    );

    const addImage = useCallback(
      (file: File) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          alert('지원하지 않는 형식입니다. (jpg, png, gif, webp만 가능)');
          return;
        }
        if (file.size > MAX_SIZE) {
          alert('파일 크기가 5MB를 초과합니다.');
          return;
        }
        const blobUrl = URL.createObjectURL(file);
        const altText = file.name.replace(/\.[^/.]+$/, '');
        pendingRef.current.push({ blobUrl, file, altText });
        insertMarkdown(`![${altText}](${blobUrl})`);
      },
      [insertMarkdown]
    );

    useImperativeHandle(ref, () => ({
      async uploadPendingImages(content: string): Promise<string> {
        const pending = pendingRef.current;
        if (pending.length === 0) return content;

        let result = content;
        for (const { blobUrl, file, altText } of pending) {
          if (!result.includes(blobUrl)) {
            // 에디터에서 삭제된 이미지 — revoke만
            URL.revokeObjectURL(blobUrl);
            continue;
          }
          const formData = new FormData();
          formData.append('file', file);
          formData.append('alt_text', altText);
          const res = await fetch('/api/media', { method: 'POST', body: formData });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '이미지 업로드 실패');
          }
          const data = await res.json();
          result = result.replaceAll(blobUrl, data.url);
          URL.revokeObjectURL(blobUrl);
        }
        pendingRef.current = [];
        return result;
      },
      cleanup() {
        for (const { blobUrl } of pendingRef.current) {
          URL.revokeObjectURL(blobUrl);
        }
        pendingRef.current = [];
      },
    }));

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) addImage(file);
      e.target.value = '';
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) addImage(file);
    };

    const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          e.preventDefault();
          addImage(file);
        }
      }
    };

    return (
      <div
        ref={editorRef}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onPaste={handlePaste}
        style={{
          position: 'relative',
          outline: dragOver ? '2px dashed var(--color-primary)' : 'none',
          borderRadius: '8px',
        }}
      >
        {/* Upload toolbar */}
        <div
          className="flex items-center gap-2 px-3 py-2 mb-1 rounded-t-lg text-sm"
          style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            이미지 첨부
          </button>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>
            드래그&드롭 또는 Ctrl+V로도 첨부 가능 · 글 저장 시 업로드됩니다
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        {dragOver && (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(var(--color-primary-rgb, 99,102,241), 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '8px', pointerEvents: 'none',
            }}
          >
            <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 16 }}>
              이미지를 놓으세요
            </span>
          </div>
        )}

        <div data-color-mode="light">
          <MDEditor
            value={value}
            onChange={(val) => onChange(val || '')}
            height={height}
            previewOptions={{ components: previewComponents }}
          />
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
);

MDEditorWithUpload.displayName = 'MDEditorWithUpload';

export default MDEditorWithUpload;
