'use client';

import { useAuth } from '@/lib/auth-context';
import { adminApi, exchangeRateApi, ErrorLogItem } from '@/lib/api';
import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/format';

type Tab = 'general' | 'admin';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('general');
  const [exchangeRate, setExchangeRate] = useState<{ usdToKrw: number; fetchedAt: string } | null>(null);

  useEffect(() => {
    exchangeRateApi.current().then((r) => setExchangeRate(r.data)).catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>설정</h1>
      </div>

      {user?.role === 'admin' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['general', 'admin'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                fontFamily: 'var(--font-sans)', cursor: 'pointer', transition: 'all 150ms',
                border: tab === t ? '1px solid var(--color-orange-500)' : '1px solid var(--border-default)',
                background: tab === t ? 'var(--color-orange-500)' : 'transparent',
                color: tab === t ? 'white' : 'var(--fg-secondary)',
              }}>
              {t === 'general' ? '일반' : '관리자'}
            </button>
          ))}
        </div>
      )}

      {tab === 'general' && (
        <>
          <Section title="계정 정보">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-orange-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', overflow: 'hidden', flexShrink: 0 }}>
                {user?.profileImage
                  ? <img src={user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : user?.name?.[0] ?? 'U'}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-primary)' }}>
                  {user?.name}
                  {user?.role === 'admin' && (
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: 'var(--color-orange-500)', color: 'white', borderRadius: 4, padding: '2px 6px' }}>관리자</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginTop: 2 }}>{user?.email}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>Google 계정으로 연결됨</div>
              </div>
            </div>
          </Section>

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
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>소스: ExchangeRate-API · 1시간 주기 캐시</div>
              </div>
            ) : (
              <div style={{ padding: '16px 0', fontSize: 13, color: 'var(--fg-muted)' }}>환율 정보를 불러오는 중...</div>
            )}
          </Section>

          <Section title="데이터 소스">
            <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              <InfoRow label="주식 가격" value="Yahoo Finance API · 5분 주기 캐시" />
              <InfoRow label="환율" value="ExchangeRate-API · 1시간 주기 캐시" />
              <InfoRow label="인증" value="Google OAuth 2.0" />
            </div>
          </Section>

          <Section title="계정 관리">
            <div style={{ padding: '16px 0' }}>
              <button onClick={logout}
                style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--fg-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 150ms' }}>
                로그아웃
              </button>
            </div>
          </Section>
        </>
      )}

      {tab === 'admin' && user?.role === 'admin' && <AdminTab />}
    </div>
  );
}

function AdminTab() {
  const [logs, setLogs] = useState<ErrorLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.errorLogs(100)
      .then((r) => setLogs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Section title="에러 로그 (최근 100건)">
      <div style={{ padding: '12px 0' }}>
        {loading ? (
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', padding: '8px 0' }}>불러오는 중...</div>
        ) : logs.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', padding: '8px 0' }}>에러 로그가 없습니다.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {logs.map((log) => (
              <ErrorLogRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

function ErrorLogRow({ log }: { log: ErrorLogItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ border: '1px solid var(--border-muted)', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'var(--fg-primary)', fontWeight: 500, wordBreak: 'break-all' }}>{log.message}</div>
          <div style={{ color: 'var(--fg-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
            <span>{formatDate(log.createdAt)}</span>
            {log.path && <span style={{ fontFamily: 'var(--font-mono)' }}>{log.path}</span>}
          </div>
        </div>
        {log.stack && (
          <button onClick={() => setExpanded((v) => !v)}
            style={{ flexShrink: 0, fontSize: 11, color: 'var(--fg-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {expanded ? '접기' : '스택'}
          </button>
        )}
      </div>
      {expanded && log.stack && (
        <pre style={{ marginTop: 8, fontSize: 11, color: 'var(--fg-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'var(--bg-muted)', borderRadius: 4, padding: '8px', overflowX: 'auto' }}>
          {log.stack}
        </pre>
      )}
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
