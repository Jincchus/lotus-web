'use client';

import { useAuth } from '@/lib/auth-context';
import { exchangeRateApi } from '@/lib/api';
import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/format';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [exchangeRate, setExchangeRate] = useState<{ usdToKrw: number; fetchedAt: string } | null>(null);

  useEffect(() => {
    exchangeRateApi.current().then((r) => setExchangeRate(r.data)).catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>설정</h1>
      </div>

      {/* Account */}
      <Section title="계정 정보">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-orange-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', overflow: 'hidden', flexShrink: 0 }}>
            {user?.profileImage
              ? <img src={user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user?.name?.[0] ?? 'U'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-primary)' }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginTop: 2 }}>{user?.email}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>Google 계정으로 연결됨</div>
          </div>
        </div>
      </Section>

      {/* Exchange Rate */}
      <Section title="환율 현황">
        {exchangeRate ? (
          <div style={{ padding: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>USD / KRW</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: 'var(--fg-primary)' }}>
                {exchangeRate.usdToKrw.toLocaleString('ko-KR')}원
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>마지막 갱신: {formatDate(exchangeRate.fetchedAt)}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
              소스: ExchangeRate-API · 1시간 주기 캐시
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px 0', fontSize: 13, color: 'var(--fg-muted)' }}>환율 정보를 불러오는 중...</div>
        )}
      </Section>

      {/* API Info */}
      <Section title="데이터 소스">
        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          <InfoRow label="주식 가격" value="Yahoo Finance API · 5분 주기 캐시" />
          <InfoRow label="환율" value="ExchangeRate-API · 1시간 주기 캐시" />
          <InfoRow label="인증" value="Google OAuth 2.0" />
        </div>
      </Section>

      {/* Logout */}
      <Section title="계정 관리">
        <div style={{ padding: '16px 0' }}>
          <button onClick={logout}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--fg-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 150ms' }}>
            로그아웃
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '0 20px', boxShadow: 'var(--shadow-md)', marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-secondary)', padding: '14px 0 10px', borderBottom: '1px solid var(--border-muted)' }}>{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--fg-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
