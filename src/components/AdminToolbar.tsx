'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Pencil } from 'lucide-react';

interface AdminToolbarProps {
  slug: string;
}

export default function AdminToolbar({ slug }: AdminToolbarProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="fixed right-8 bottom-8 z-30 flex flex-col gap-2"
    >
      <Link
        href={`/admin/posts/${slug}/edit`}
        className="flex items-center justify-center w-11 h-11 rounded-xl transition-all hover:scale-110"
        style={{
          background: 'rgba(8, 11, 16, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--neural-border-glow)',
          boxShadow: '0 0 15px rgba(0, 255, 200, 0.2)',
          color: 'var(--neural-accent)',
        }}
        title="글 수정"
      >
        <Pencil size={18} />
      </Link>
    </motion.div>
  );
}
