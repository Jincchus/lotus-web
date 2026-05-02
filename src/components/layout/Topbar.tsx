'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const TITLES: Record<string, string> = {
  '/dashboard': '대시보드',
  '/portfolio': '포트폴리오',
  '/sell-history': '매도 히스토리',
  '/search': '종목 검색',
  '/watchlist': '관심종목',
  '/settings': '설정',
};

export default function Topbar() {
  const pathname = usePathname();
  const title = Object.entries(TITLES).find(([k]) => pathname === k || pathname.startsWith(k + '/'))?.at(1) ?? '';

  return (
    <header style={s.topbar}>
      <div style={s.left}>
        <span style={s.title}>{title}</span>
      </div>
      <div style={s.right}>
        <Link href="/search" style={s.searchBtn} title="종목 검색">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Link>
      </div>
    </header>
  );
}

const s: Record<string, React.CSSProperties> = {
  topbar: {
    height: 'var(--topbar-height)',
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-default)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    zIndex: 5,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--fg-primary)',
    letterSpacing: '-0.01em',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-muted)',
    color: 'var(--fg-secondary)',
    textDecoration: 'none',
    transition: 'background 150ms',
  },
};
