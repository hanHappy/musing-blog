'use client';

interface Props {
  storageUsed: number; // bytes
  totalMedia: number;
}

const DB_LIMIT = 500 * 1024 * 1024; // 500MB
const STORAGE_LIMIT = 1024 * 1024 * 1024; // 1GB

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

function GaugeBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100);
  const color = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981';

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {formatBytes(used)} / {formatBytes(limit)} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function StorageGauge({ storageUsed, totalMedia }: Props) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Storage Usage (Supabase Free Tier)
      </h3>
      <div className="space-y-4">
        <GaugeBar label="Media Storage" used={storageUsed} limit={STORAGE_LIMIT} />
        <div className="text-xs pt-1" style={{ color: 'var(--text-secondary)' }}>
          {totalMedia} files uploaded
        </div>
      </div>
    </div>
  );
}
