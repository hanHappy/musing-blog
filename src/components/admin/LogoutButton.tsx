'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm px-4 py-2 rounded-lg transition-all"
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
      Logout
    </button>
  );
}
