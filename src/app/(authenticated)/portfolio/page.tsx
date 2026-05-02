'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { lotsApi, Lot } from '@/lib/api';
import { formatKrw, formatRate, rateColor } from '@/lib/format';

interface StockGroup {
  symbol: string;
  name: string;
  market: 'KR' | 'US';
  currency: 'KRW' | 'USD';
  lots: Lot[];
  totalValue: number;
  totalInvestment: number;
  returnRate: number;
  totalQuantity: number;
}

export default function PortfolioPage() {
  const [groups, setGroups] = useState<StockGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'KR' | 'US'>('ALL');

  useEffect(() => {
    lotsApi.list().then((res) => {
      const lots = res.data.filter((l) => l.remainingQuantity > 0);
      // Group by symbol+market
      const map = new Map<string, StockGroup>();
      for (const lot of lots) {
        const key = `${lot.symbol}:${lot.market}`;
        if (!map.has(key)) {
          map.set(key, { symbol: lot.symbol, name: lot.stockName, market: lot.market, currency: lot.currency, lots: [], totalValue: 0, totalInvestment: 0, returnRate: 0, totalQuantity: 0 });
        }
        const g = map.get(key)!;
        g.lots.push(lot);
        g.totalValue += lot.evaluationAmount ?? 0;
        g.totalInvestment += lot.purchasePrice * lot.remainingQuantity;
        g.totalQuantity += lot.remainingQuantity;
      }
      for (const g of map.values()) {
        g.returnRate = g.totalInvestment > 0 ? ((g.totalValue - g.totalInvestment) / g.totalInvestment) * 100 : 0;
      }
      setGroups(Array.from(map.values()));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? groups : groups.filter((g) => g.market === filter);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>포트폴리오</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-secondary)', marginTop: 2 }}>{groups.length}개 종목 보유 중</p>
        </div>
        <Link href="/search" style={btnStyle}>+ Lot 추가</Link>
      </div>

      {/* Market filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['ALL', 'KR', 'US'] as const).map((m) => (
          <button key={m} onClick={() => setFilter(m)} style={{ ...tabStyle, ...(filter === m ? tabActiveStyle : {}) }}>
            {m === 'ALL' ? '전체' : m === 'KR' ? '국내' : '해외'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--fg-muted)', fontSize: 13 }}>로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--fg-muted)', fontSize: 13 }}>
          보유 종목이 없습니다. <Link href="/search" style={{ color: 'var(--color-orange-500)' }}>종목을 추가하세요.</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((g) => (
            <StockCard key={`${g.symbol}:${g.market}`} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function StockCard({ group }: { group: StockGroup }) {
  const isKr = group.market === 'KR';
  return (
    <Link href={`/portfolio/${group.symbol}?market=${group.market}`} style={{ textDecoration: 'none' }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ ...iconStyle, ...(isKr ? { background: 'rgba(59,130,246,0.1)', color: 'var(--color-blue-600)' } : { background: 'rgba(255,107,53,0.1)', color: 'var(--color-orange-600)' }) }}>
            {isKr ? 'KR' : 'US'}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-primary)' }}>{group.name}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>{group.symbol} · {group.lots.length}개 Lot</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' as const }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: 'var(--fg-primary)' }}>
              {group.currency === 'KRW' ? formatKrw(group.totalValue) : `$${group.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: rateColor(group.returnRate), marginTop: 3 }}>
              {formatRate(group.returnRate)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 3 }}>
              보유 {group.totalQuantity % 1 === 0 ? group.totalQuantity : group.totalQuantity.toFixed(4)}주
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'var(--color-orange-500)', color: 'white',
  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
};
const tabStyle: React.CSSProperties = {
  padding: '6px 16px', borderRadius: 8, border: '1px solid var(--border-default)',
  background: 'var(--bg-surface)', color: 'var(--fg-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};
const tabActiveStyle: React.CSSProperties = {
  background: 'var(--color-orange-500)', borderColor: 'transparent', color: 'white',
};
const cardStyle: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
  borderRadius: 12, padding: '16px 20px', boxShadow: 'var(--shadow-md)',
  transition: 'box-shadow 150ms', cursor: 'pointer',
};
const iconStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
};
