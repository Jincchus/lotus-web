'use client';

import { useEffect, useState } from 'react';
import { sellApi, SellHistory, MonthlyStats } from '@/lib/api';
import { formatKrw, formatDate, formatRate } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';

interface GroupedSells {
  yearMonth: string;
  label: string;
  items: SellHistory[];
  totalProfitKrw: number;
}

export default function SellHistoryPage() {
  const [histories, setHistories] = useState<SellHistory[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'KR' | 'US'>('ALL');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    Promise.all([
      sellApi.history(),
      sellApi.monthlyStats({ year: yearFilter }),
    ])
      .then(([h, m]) => { setHistories(h.data); setMonthlyStats(m.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [yearFilter]);

  const availableYears = Array.from(
    new Set(histories.map((h) => new Date(h.sellDate).getFullYear()))
  ).sort((a, b) => b - a);

  if (!availableYears.includes(yearFilter)) {
    availableYears.unshift(yearFilter);
  }

  const filtered = histories.filter((h) => {
    const year = new Date(h.sellDate).getFullYear();
    if (year !== yearFilter) return false;
    if (marketFilter !== 'ALL' && h.market !== marketFilter) return false;
    return true;
  });

  const groups = groupByMonth(filtered);

  function handleCsvDownload() {
    const today = new Date().toISOString().split('T')[0];
    const marketLabel = marketFilter === 'ALL' ? '전체' : marketFilter;
    const header = ['종목명', '심볼', '시장', '통화', '매도일', '매도수량', '매도가', '실현수익(원화)', '원화매도금액', '트리거수익률(%)', '매도유형'];
    const rows: string[][] = [header];
    for (const h of filtered) {
      rows.push([
        h.stockName,
        h.symbol,
        h.market,
        h.currency,
        h.sellDate,
        String(h.sellQuantity),
        String(h.sellPrice),
        String(Math.round(h.realizedProfitKrw ?? h.realizedProfit)),
        String(Math.round(h.sellAmountKrw ?? 0)),
        h.triggerProfitRate != null ? h.triggerProfitRate.toFixed(2) : '',
        h.sellType === 'STRATEGY' ? '전략매도' : '수동매도',
      ]);
    }
    downloadCsv(`sell-history_${yearFilter}_${marketLabel}_${today}.csv`, rows);
  }

  // 월별 통계는 백엔드 monthlyStats 기준 (KRW 환산 완료)
  const totalRealized = monthlyStats.reduce((sum, m) => sum + m.realizedProfit, 0);
  const totalSell = monthlyStats.reduce((sum, m) => sum + m.totalSellAmount, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>매도 히스토리</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-secondary)', marginTop: 2 }}>{yearFilter}년 · {filtered.length}건 / 전체 {histories.length}건</p>
        </div>
        <button onClick={handleCsvDownload} disabled={filtered.length === 0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', color: 'var(--fg-secondary)', border: '1px solid var(--border-default)', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: filtered.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', opacity: filtered.length === 0 ? 0.5 : 1 }}>
          CSV 저장
        </button>
      </div>

      {/* Stats summary — monthlyStats 기준 KRW 환산 합계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="총 매도 금액" value={formatKrw(totalSell)} />
        <StatCard label="총 실현 수익" value={formatKrw(totalRealized)} valueColor={totalRealized >= 0 ? 'var(--color-green-600)' : 'var(--color-red-500)'} />
        <StatCard label="매도 횟수" value={`${histories.length}건`} />
      </div>

      {/* Year Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {availableYears.map((y) => (
          <button key={y} onClick={() => { setYearFilter(y); setLoading(true); }}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-default)', background: yearFilter === y ? 'var(--fg-primary)' : 'var(--bg-surface)', color: yearFilter === y ? 'var(--bg-surface)' : 'var(--fg-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {y}년
          </button>
        ))}
      </div>

      {/* Market Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['ALL', 'KR', 'US'] as const).map((m) => (
          <button key={m} onClick={() => setMarketFilter(m)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-default)', background: marketFilter === m ? 'var(--color-orange-500)' : 'var(--bg-surface)', color: marketFilter === m ? 'white' : 'var(--fg-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {m === 'ALL' ? '전체' : m === 'KR' ? '국내' : '해외'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--fg-muted)', fontSize: 13 }}>로딩 중...</div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--fg-muted)', fontSize: 13 }}>매도 기록이 없습니다.</div>
      ) : (
        groups.map((g) => (
          <div key={g.yearMonth} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-secondary)' }}>{g.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: g.totalProfitKrw >= 0 ? 'var(--color-green-600)' : 'var(--color-red-500)' }}>
                실현 수익 {formatKrw(g.totalProfitKrw)}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              {g.items.map((sell, i) => (
                <SellRow key={sell.id} sell={sell} isLast={i === g.items.length - 1} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SellRow({ sell, isLast }: { sell: SellHistory; isLast: boolean }) {
  const isUsd = sell.currency === 'USD';
  const profitKrw = sell.realizedProfitKrw ?? sell.realizedProfit;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: isLast ? 'none' : '1px solid var(--border-muted)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: profitKrw >= 0 ? 'var(--color-green-50)' : 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: profitKrw >= 0 ? 'var(--color-green-600)' : 'var(--color-red-500)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M7 17l10-10M17 7H7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
          {sell.stockName || `Lot #${sell.lotId.slice(-6)}`}
          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
            background: sell.market === 'KR' ? 'rgba(59,130,246,0.1)' : 'rgba(255,107,53,0.1)',
            color: sell.market === 'KR' ? 'var(--color-blue-600)' : 'var(--color-orange-600)' }}>
            {sell.market}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 1 }}>
          {formatDate(sell.sellDate)} · {sell.sellQuantity}주 · {sell.sellType === 'STRATEGY' ? '전략 매도' : '수동 매도'}
          {sell.triggerProfitRate != null && ` · 트리거 ${formatRate(sell.triggerProfitRate)}`}
        </div>
      </div>
      <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
        {/* 실현 수익: 항상 KRW로 표시 */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: profitKrw >= 0 ? 'var(--color-green-600)' : 'var(--color-red-500)' }}>
          {profitKrw >= 0 ? '+' : ''}{formatKrw(profitKrw)}
        </div>
        {/* USD 종목은 원화 매도가 + 원본 USD 수익 함께 표시 */}
        {isUsd ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>
            매도 {formatKrw(sell.sellAmountKrw ?? 0)} · ${sell.sellPrice.toFixed(2)}
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>
            매도가 {formatKrw(sell.sellPrice)}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '16px 20px', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: 'var(--fg-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: valueColor ?? 'var(--fg-primary)' }}>{value}</div>
    </div>
  );
}

function groupByMonth(sells: SellHistory[]): GroupedSells[] {
  const map = new Map<string, GroupedSells>();
  for (const sell of sells) {
    const d = new Date(sell.sellDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) {
      map.set(key, {
        yearMonth: key,
        label: `${d.getFullYear()}년 ${d.getMonth() + 1}월`,
        items: [],
        totalProfitKrw: 0,
      });
    }
    const g = map.get(key)!;
    g.items.push(sell);
    // realizedProfitKrw 사용 — KRW/USD 모두 원화 환산 합계
    g.totalProfitKrw += sell.realizedProfitKrw ?? sell.realizedProfit;
  }
  return Array.from(map.values()).sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
}
