'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useIsMobile } from '@/lib/use-is-mobile';

const NAV_ITEMS = [
  {
    section: '메인',
    items: [
      { href: '/dashboard', label: '대시보드', icon: IconDashboard },
      { href: '/portfolio', label: '포트폴리오', icon: IconPortfolio },
      { href: '/sell-history', label: '매도 히스토리', icon: IconHistory },
    ],
  },
  {
    section: '관리',
    items: [
      { href: '/search', label: '종목 검색', icon: IconSearch },
      { href: '/strategies', label: '매도 전략', icon: IconStrategy },
      { href: '/themes', label: '테마 관리', icon: IconTheme },
      { href: '/watchlist', label: '관심종목', icon: IconWatchlist },
      { href: '/settings', label: '설정', icon: IconSettings },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const w = collapsed ? 64 : 220;

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {mobileOpen && (
          <div
            onClick={onMobileClose}
            style={s.backdrop}
          />
        )}
        {/* Drawer */}
        <aside
          style={{
            ...s.sidebar,
            width: 220,
            minWidth: 220,
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: 200,
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 280ms cubic-bezier(0.4,0,0.2,1)',
            boxShadow: mobileOpen ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
          }}
        >
          {/* Header */}
          <div style={s.header}>
            <div style={s.logo}>
              <div style={s.logoMark}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 17l4-8 4 4 4-6 4 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={s.logoText}>Lotus</span>
            </div>
            {/* Close button */}
            <button onClick={onMobileClose} style={s.toggle} title="닫기">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav style={s.nav}>
            {NAV_ITEMS.map((group) => (
              <div key={group.section} style={s.section}>
                <div style={s.sectionLabel}>{group.section}</div>
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + '/');
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onMobileClose}
                      style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}
                    >
                      <Icon active={active} />
                      <span style={s.navLabel}>{label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div style={s.footer}>
            {user && (
              <div style={s.userRow}>
                <div style={s.avatar}>
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                  ) : (
                    <span style={s.avatarInitial}>{user.name?.[0] ?? 'U'}</span>
                  )}
                </div>
                <div style={s.userInfo}>
                  <div style={s.userName}>{user.name}</div>
                  <div style={s.userEmail}>{user.email}</div>
                </div>
              </div>
            )}
            <button onClick={logout} style={s.logoutBtn} title="로그아웃">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>로그아웃</span>
            </button>
          </div>
        </aside>
      </>
    );
  }

  // Desktop
  return (
    <aside style={{ ...s.sidebar, width: w, minWidth: w }}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>
          <div style={s.logoMark}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 17l4-8 4 4 4-6 4 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {!collapsed && <span style={s.logoText}>Lotus</span>}
        </div>
        {/* Collapse toggle */}
        <button onClick={() => setCollapsed((c) => !c)} style={s.toggle} title={collapsed ? '펼치기' : '접기'}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d={collapsed ? 'M4 2l4 4-4 4' : 'M8 2L4 6l4 4'}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        {NAV_ITEMS.map((group) => (
          <div key={group.section} style={s.section}>
            {!collapsed && <div style={s.sectionLabel}>{group.section}</div>}
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link key={href} href={href} style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}>
                  <Icon active={active} />
                  {!collapsed && <span style={s.navLabel}>{label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={s.footer}>
        {user && (
          <div style={s.userRow}>
            <div style={s.avatar}>
              {user.profileImage ? (
                <img src={user.profileImage} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              ) : (
                <span style={s.avatarInitial}>{user.name?.[0] ?? 'U'}</span>
              )}
            </div>
            {!collapsed && (
              <div style={s.userInfo}>
                <div style={s.userName}>{user.name}</div>
                <div style={s.userEmail}>{user.email}</div>
              </div>
            )}
          </div>
        )}
        <button onClick={logout} style={s.logoutBtn} title="로그아웃">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!collapsed && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
  );
}

// ── Icon components ──────────────────────────────────────

function IconDashboard({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2"/>
    </svg>
  );
}

function IconPortfolio({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconHistory({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconSearch({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2"/>
      <path d="m21 21-4.35-4.35" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function IconWatchlist({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconStrategy({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M9 19V6l12-3v13" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="19" r="3" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2"/>
      <circle cx="18" cy="16" r="3" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2"/>
    </svg>
  );
}

function IconTheme({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M7 7h10v10H7z" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 7L5 5M17 7l2-2M17 17l2 2M7 17l-2 2" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function IconSettings({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="3" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={active ? 'var(--color-orange-500)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 199,
  },
  sidebar: {
    background: 'var(--bg-sidebar)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    transition: 'width 300ms var(--ease-out-expo), min-width 300ms var(--ease-out-expo)',
    position: 'relative',
    zIndex: 10,
    flexShrink: 0,
  },
  header: {
    padding: '20px 12px 12px',
    borderBottom: '1px solid var(--border-sidebar)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  logoMark: {
    width: 28,
    height: 28,
    background: 'var(--color-orange-500)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--color-dark-100)',
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap',
  },
  toggle: {
    width: 24,
    height: 24,
    background: 'var(--color-dark-700)',
    border: '1px solid var(--color-dark-600)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--color-dark-300)',
    flexShrink: 0,
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '10px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  section: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-dark-500)',
    padding: '6px 10px 4px',
    whiteSpace: 'nowrap',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    color: 'var(--color-dark-300)',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textDecoration: 'none',
    transition: 'background 150ms, color 150ms',
  },
  navItemActive: {
    background: 'rgba(255,107,53,0.12)',
    color: 'var(--color-orange-500)',
  },
  navLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  footer: {
    borderTop: '1px solid var(--border-sidebar)',
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flexShrink: 0,
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 10px',
    overflow: 'hidden',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--color-orange-500)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: 700,
    color: 'white',
  },
  userInfo: {
    overflow: 'hidden',
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-dark-200)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    fontSize: 11,
    color: 'var(--color-dark-400)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 8,
    background: 'transparent',
    border: 'none',
    color: 'var(--color-dark-400)',
    fontSize: 13,
    cursor: 'pointer',
    width: '100%',
    fontFamily: 'var(--font-sans)',
    transition: 'background 150ms, color 150ms',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
};
