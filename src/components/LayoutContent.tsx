'use client'

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 헤더/푸터를 숨길 경로들
  // 홈페이지(neural network UI), 로그인, 어드민 페이지에서 숨김
  const hideLayout =
    pathname === '/' ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/posts/') ||
    pathname?.startsWith('/category/') ||
    pathname?.startsWith('/tags/');

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
