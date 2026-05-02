'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardApi, lotsApi, sellApi, exchangeRateApi, noticesApi, DashboardSummary, Lot, SellHistory, ExchangeRate, ActionableLot, Notice } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatKrw, formatRate, rateColor, formatDate } from '@/lib/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [recentSells, setRecentSells] = useState<SellHistory[]>([]);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [actionableLots, setActionableLots] = useState<ActionableLot[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [dismissedNotices, setDismissedNotices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      dashboardApi.summary(),
      lotsApi.list(),
      sellApi.history(),
      exchangeRateApi.current(),
      dashboardApi.actionableLots(),
      noticesApi.active(),
    ])
      .then(([sumRes, lotsRes, sellsRes, fxRes, actionRes, noticesRes]) => {
        setSummary(sumRes.data);
        setLots(lotsRes.data.filter((l) => l.remainingQuantity > 0).slice(0, 5));
        setRecentSells(sellsRes.data.slice(0, 4));
        setExchangeRate(fxRes.data);
        setActionableLots(actionRes.data.slice(0, 5));
        setNotices(noticesRes.data);
      })
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const totalReturn = summary?.totalReturnRate ?? 0;
  const unrealized = summary?.unrealizedProfitKrw ?? 0;
  const realized = summary?.realizedProfitKrw ?? 0;

  const visibleNotices = notices.filter((n) => !dismissedNotices.has(n.id));

  return (
    <div>
      {/* Notices */}
      {visibleNotices.map((notice) => (
        <div key={notice.id} style={s.noticeBanner}>
          <div style={s.noticeIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={s.noticeContent}>
            <span style={s.noticeTitle}>{notice.title}</span>
            {notice.content && <span style={s.noticeText}>{notice.content}</span>}
          </div>
          <button
            onClick={() => setDismissedNotices((prev) => new Set([...prev, notice.id]))}
            style={s.noticeDismiss}
            aria-label="닫기"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ))}

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.greeting}>안녕하세요, {user?.name?.split(' ')[0]}님 👋</div>
          <div style={s.date}>{today}</div>
        </div>
        <Link href="/search" style={s.btnPrimary}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Lot 추가
        </Link>
      </div>

      {/* KPI Grid */}
      <div style={s.kpiGrid}>
        <KpiCard
          label="총 평가금액"
          value={formatKrw(summary?.totalValueKrw ?? 0)}
          sub={`투자원금 ${formatKrw(summary?.totalInvestmentKrw ?? 0)}`}
          accent
        />
        <KpiCard
          label="전체 수익률"
          value={formatRate(totalReturn)}
          valueColor={totalReturn >= 0 ? 'var(--color-green-600)' : 'var(--color-red-500)'}
          sub={`보유 ${summary?.holdingStockCount ?? 0}개 종목 · ${summary?.activeLotCount ?? 0}개 Lot`}
        />
        <KpiCard
          label="미실현 수익"
          value={formatKrw(unrealized)}
          valueColor={unrealized >= 0 ? 'var(--color-green-600)' : 'var(--color-red-500)'}
        />
        <KpiCard
          label="실현 수익"
          value={formatKrw(realized)}
          valueColor={realized >= 0 ? 'var(--color-green-600)' : 'var(--color-red-500)'}
        />
        <KpiCard
          label="환율 (USD/KRW)"
          value={(summary?.exchangeRate ?? exchangeRate?.usdToKrw ?? 0).toLocaleString('ko-KR') + '원'}
          sub={exchangeRate ? `기준 ${formatDate(exchangeRate.fetchedAt)}` : ''}
        />
      </div>

      {/* Two-column sections */}
      <div style={s.sectionGrid}>
        {/* Holdings */}
        <SectionCard
          title="보유 종목 현황"
          linkText="전체 보기"
          linkHref="/portfolio"
        >
          {lots.length === 0 ? (
            <EmptyRow message="보유 종목이 없습니다." />
          ) : (
            lots.map((lot) => (
              <HoldingRow key={lot.id} lot={lot} />
            ))
          )}
        </SectionCard>

        {/* Recent sells */}
        <SectionCard
          title="최근 매도 내역"
          linkText="전체 보기"
          linkHref="/sell-history"
        >
          {recentSells.length === 0 ? (
            <EmptyRow message="매도 내역이 없습니다." />
          ) : (
            recentSells.map((sell) => (
              <SellRow key={sell.id} sell={sell} />
            ))
          )}
        </SectionCard>
      </div>

      {/* Actionable lots + Exchange rate */}
      <div style={s.sectionGrid}>
        <SectionCard title="매도 가능 알림" linkText="포트폴리오로" linkHref="/portfolio">
          {actionableLots.length === 0 ? (
            <EmptyRow message="목표 수익률에 도달한 Lot이 없습니다." />
          ) : (
            actionableLots.map((lot) => (
              <AlertRow key={lot.lotId} lot={lot} />
            ))
          )}
        </SectionCard>

        <SectionCard title="환율 현황">
          <div style={s.fxRow}>
            <div>
              <div style={s.fxPair}>USD / KRW</div>
              <div style={s.fxValue}>
                {(summary?.exchangeRate ?? exchangeRate?.usdToKrw ?? 0).toLocaleString('ko-KR')}
                <span style={{ fontSize: 13, marginLeft: 4, color: 'var(--fg-secondary)' }}>원</span>
              </div>
            </div>
            {exchangeRate && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>기준 시간</div>
                <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>
                  {new Date(exchangeRate.fetchedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function KpiCard({ label, value, sub, accent, valueColor }: {
  label: string; value: string; sub?: string; accent?: boolean; valueColor?: string;
}) {
  return (
    <div style={{ ...s.kpiCard, ...(accent ? s.kpiCardAccent : {}) }}>
      <div style={{ ...s.kpiLabel, ...(accent ? { color: 'rgba(255,255,255,0.65)' } : {}) }}>{label}</div>
      <div style={{ ...s.kpiValue, ...(accent ? { color: 'white' } : valueColor ? { color: valueColor } : {}) }}>
        {value}
      </div>
      {sub && <div style={{ ...s.kpiSub, ...(accent ? { color: 'rgba(255,255,255,0.6)' } : {}) }}>{sub}</div>}
    </div>
  );
}

function SectionCard({ title, linkText, linkHref, children }: {
  title: string; linkText?: string; linkHref?: string; children: React.ReactNode;
}) {
  return (
    <div style={s.sectionCard}>
      <div style={s.sectionHeader}>
        <span style={s.sectionTitle}>{title}</span>
        {linkText && linkHref && (
          <Link href={linkHref} style={s.sectionLink}>{linkText} →</Link>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function HoldingRow({ lot }: { lot: Lot }) {
  const rate = lot.returnRate ?? 0;
  const isKr = lot.market === 'KR';
  return (
    <Link href={`/portfolio/${lot.symbol}?market=${lot.market}`} style={{ ...s.holdingRow, textDecoration: 'none' }}>
      <div style={{ ...s.holdingIcon, ...(isKr ? s.holdingIconKr : s.holdingIconUs) }}>
        {isKr ? 'KR' : 'US'}
      </div>
      <div>
        <div style={s.holdingName}>{lot.stockName}</div>
        <div style={s.holdingMeta}>{lot.symbol} · Lot #{lot.id.slice(-4)}</div>
      </div>
      <div style={s.holdingRight}>
        <div style={s.holdingValue}>
          {lot.currency === 'KRW'
            ? formatKrw(lot.evaluationAmount ?? 0)
            : `$${(lot.evaluationAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
        </div>
        <div style={{ fontSize: 11, color: rateColor(rate), marginTop: 2, fontFamily: 'var(--font-mono)' }}>
          {formatRate(rate)}
        </div>
      </div>
    </Link>
  );
}

function SellRow({ sell }: { sell: SellHistory }) {
  return (
    <div style={s.sellRow}>
      <div style={s.sellIcon}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M7 17l10-10M17 7H7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <div style={s.sellName}>{sell.stockName || '—'}</div>
        <div style={s.sellMeta}>{sell.sellQuantity}주 · {sell.sellType === 'STRATEGY' ? '전략' : '수동'}</div>
      </div>
      <div style={s.sellRight}>
        <div style={s.sellAmount}>+{formatKrw(sell.realizedProfitKrw)}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{formatDate(sell.sellDate)}</div>
      </div>
    </div>
  );
}

function AlertRow({ lot }: { lot: ActionableLot }) {
  const topRule = lot.triggeredRules[0];
  return (
    <Link href={`/portfolio/${lot.symbol}?market=${lot.market}`} style={{ ...s.alertRow, textDecoration: 'none' }}>
      <div style={s.alertDot} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {lot.stockName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 1 }}>
          {lot.symbol} · 목표 {topRule?.targetProfitRate}% 도달
          {lot.triggeredRules.length > 1 && ` 외 ${lot.triggeredRules.length - 1}건`}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--color-green-600)' }}>
          {formatRate(lot.returnRate)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 1 }}>
          {topRule && `${topRule.sellRatio}% 매도`}
        </div>
      </div>
    </Link>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div style={{ padding: '24px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border-default)', borderTopColor: 'var(--color-orange-500)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--fg-muted)' }}>대시보드 로딩 중...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: 'var(--color-red-500)', marginBottom: 16 }}>{message}</div>
      <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-surface)', cursor: 'pointer', fontSize: 13 }}>
        다시 시도
      </button>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
    flexWrap: 'wrap',
  },
  greeting: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg-primary)' },
  date: { fontSize: 13, color: 'var(--fg-secondary)', marginTop: 3 },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--color-orange-500)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 12,
    padding: '18px 20px',
    boxShadow: 'var(--shadow-md)',
  },
  kpiCardAccent: {
    background: 'var(--color-orange-500)',
    border: 'none',
    boxShadow: '0 8px 24px rgba(255,107,53,0.25)',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    color: 'var(--fg-muted)',
    marginBottom: 10,
  },
  kpiValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: '-0.025em',
    color: 'var(--fg-primary)',
    lineHeight: 1,
  },
  kpiSub: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--fg-muted)',
    marginTop: 6,
  },
  sectionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 16,
  },
  sectionCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-md)',
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid var(--border-default)',
  },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' },
  sectionLink: { fontSize: 12, color: 'var(--color-orange-500)', fontWeight: 500, textDecoration: 'none' },
  holdingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 18px',
    borderBottom: '1px solid var(--border-muted)',
    transition: 'background 150ms',
  },
  holdingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  holdingIconKr: { background: 'rgba(59,130,246,0.1)', color: 'var(--color-blue-600)' },
  holdingIconUs: { background: 'rgba(255,107,53,0.1)', color: 'var(--color-orange-600)' },
  holdingName: { fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' },
  holdingMeta: { fontSize: 11, color: 'var(--fg-secondary)', marginTop: 1 },
  holdingRight: { marginLeft: 'auto', textAlign: 'right' as const, flexShrink: 0 },
  holdingValue: { fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: 'var(--fg-primary)' },
  sellRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 18px',
    borderBottom: '1px solid var(--border-muted)',
  },
  sellIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: 'var(--color-green-50)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'var(--color-green-600)',
  },
  sellName: { fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' },
  sellMeta: { fontSize: 11, color: 'var(--fg-secondary)', marginTop: 1 },
  sellRight: { marginLeft: 'auto', textAlign: 'right' as const, flexShrink: 0 },
  sellAmount: { fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: 'var(--color-green-600)' },
  alertRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '11px 18px',
    borderBottom: '1px solid var(--border-muted)',
  },
  alertDot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--color-orange-500)', flexShrink: 0 },
  fxRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 18px',
  },
  fxPair: { fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 },
  fxValue: { fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: 'var(--fg-primary)' },
  noticeBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'rgba(255,107,53,0.08)',
    border: '1px solid rgba(255,107,53,0.25)',
    borderRadius: 10,
    padding: '12px 16px',
    marginBottom: 12,
  },
  noticeIcon: {
    color: 'var(--color-orange-500)',
    flexShrink: 0,
    marginTop: 1,
  },
  noticeContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--fg-primary)',
  },
  noticeText: {
    fontSize: 12,
    color: 'var(--fg-secondary)',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap' as const,
  },
  noticeDismiss: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--fg-muted)',
    padding: 2,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
};
