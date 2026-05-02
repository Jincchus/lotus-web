import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lotus — 주식 포트폴리오',
  description: '한국/미국 주식 Lot 단위 포트폴리오 관리',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" style={{ height: '100%' }}>
      <body style={{ height: '100%' }}>{children}</body>
    </html>
  );
}
