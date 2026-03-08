'use client';

import { useState, useEffect } from 'react';
import type { Media } from '@/types/database';

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    const res = await fetch('/api/media');
    const data = await res.json();
    setMedia(data);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      await fetchMedia();
    } catch (error) {
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await fetch(`/api/media?id=${id}`, { method: 'DELETE' });
      await fetchMedia();
    } catch (error) {
      alert('Failed to delete file');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Media Library
        </h1>

        <label
          className="px-6 py-3 rounded-lg font-medium transition-all cursor-pointer"
          style={{
            background: uploading
              ? 'var(--bg-tertiary)'
              : 'var(--color-primary)',
            color: 'white',
            opacity: uploading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              e.currentTarget.style.background = 'var(--color-primary-light)';
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              e.currentTarget.style.background = 'var(--color-primary)';
            }
          }}
        >
          {uploading ? 'Uploading...' : '📤 Upload Image'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {media.length === 0 ? (
        <div
          className="card p-12 text-center"
          style={{ color: 'var(--text-secondary)' }}
        >
          <p className="text-lg mb-4">No media files yet.</p>
          <p>Upload your first image to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {media.map((item) => (
            <div
              key={item.id}
              className="card p-4 transition-all"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={item.url}
                  alt={item.alt_text || item.filename}
                  className="w-full h-full object-cover"
                />
              </div>

              <p
                className="text-sm font-medium mb-2 truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.filename}
              </p>

              <p
                className="text-xs mb-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item.size ? Math.round(item.size / 1024) : 0} KB
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => copyUrl(item.url)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs transition-all"
                  style={{
                    color: 'var(--color-primary)',
                    border: '1px solid var(--color-primary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                >
                  Copy URL
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="px-3 py-2 rounded-lg text-xs transition-all"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
