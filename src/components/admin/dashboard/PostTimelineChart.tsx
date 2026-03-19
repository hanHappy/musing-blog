'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type ViewMode = 'daily' | 'weekly' | 'monthly';

interface Props {
  data: { date: string; count: number }[];
}

function aggregateWeekly(data: { date: string; count: number }[]) {
  const weeks = new Map<string, number>();
  for (const item of data) {
    const d = new Date(item.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    weeks.set(key, (weeks.get(key) || 0) + item.count);
  }
  return Array.from(weeks.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function aggregateMonthly(data: { date: string; count: number }[]) {
  const months = new Map<string, number>();
  for (const item of data) {
    const key = item.date.slice(0, 7); // YYYY-MM
    months.set(key, (months.get(key) || 0) + item.count);
  }
  return Array.from(months.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function formatLabel(date: string, mode: ViewMode): string {
  if (mode === 'monthly') {
    const [y, m] = date.split('-');
    return `${y}.${m}`;
  }
  if (mode === 'weekly') {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}/${day}~`;
  }
  // daily
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function PostTimelineChart({ data }: Props) {
  const [mode, setMode] = useState<ViewMode>('daily');

  const chartData = useMemo(() => {
    let processed: { date: string; count: number }[];
    switch (mode) {
      case 'weekly':
        processed = aggregateWeekly(data);
        break;
      case 'monthly':
        processed = aggregateMonthly(data);
        break;
      default:
        processed = data;
    }
    return processed.map((d) => ({
      label: formatLabel(d.date, mode),
      count: d.count,
    }));
  }, [data, mode]);

  const modes: { value: ViewMode; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Post Upload Timeline
        </h3>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--bg-tertiary)' }}>
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className="px-3 py-1 rounded-md text-sm font-medium transition-colors"
              style={{
                background: mode === m.value ? 'var(--color-primary)' : 'transparent',
                color: mode === m.value ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[250px]" style={{ color: 'var(--text-secondary)' }}>
          No posts in the last 90 days
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-color)' }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-color)' }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            />
            <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
