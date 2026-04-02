import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | muse.log',
  description: '사유하고 기록하는 개발자 한상민의 소개입니다.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
