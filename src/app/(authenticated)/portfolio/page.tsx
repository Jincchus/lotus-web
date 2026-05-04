'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { lotsApi, Lot } from '@/lib/api';
import { formatKrw, formatRate, rateColor } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';

type MarketFilter = 'ALL' | 'KR' | 'US';
type GroupBy = 'stock' | 'theme' | 'broker' | 'strategy';
type SortBy = 'date_desc' | 'date_asc' | 'rate_desc' | 'rate_asc' | 'value_desc';

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
  latestPurchaseDate: string;
}

interface Section {
  key: string;
  label: string;
  stockGroups: StockGroup[];
}

function buildStockGroups(lots: Lot[]): StockGroup[] {
  const map = new Map<string, StockGroup>();
  for (const lot of lots) {
    const key = `${lot.symbol}:${lot.market}`;
    if (!map.has(key)) {
      map.set(key, {
        symbol: lot.symbol, name: lot.stockName, market: lot.market,
        currency: lot.currency, lots: [], totalValue: 0, totalInvestment: 0,
        returnRate: 0, totalQuantity: 0, latestPurchaseDate: lot.purchaseDate,
      });
    }
    const g = map.get(key)!;
    g.lots.push(lot);
    g.totalValue += lot.evaluationAmount ?? 0;
    g.totalInvestment += lot.purchasePrice * lot.remainingQuantity;
    g.totalQuantity += lot.remainingQuantity;
    if (lot.purchaseDate > g.latestPurchaseDate) g.latestPurchaseDate = lot.purchaseDate;
  }
  for (const g of map.values()) {
    g.returnRate = g.totalInvestment > 0
      ? ((g.totalValue - g.totalInvestment) / g.totalInvestment) * 100
      : 0;
  }
  return Array.from(map.values());
}

function sortGroups(groups: StockGroup[], sortBy: SortBy): StockGroup[] {
  return [...groups].sort((a, b) => {
    switch (sortBy) {
      case 'date_desc': return b.latestPurchaseDate.localeCompare(a.latestPurchaseDate);
      case 'date_asc':  return a.latestPurchaseDate.localeCompare(b.latestPurchaseDate);
      case 'rate_desc': return b.returnRate - a.returnRate;
      case 'rate_asc':  return a.returnRate - b.returnRate;
      case 'value_desc': return b.totalValue - a.totalValue;
    }
  });
}

function buildSections(lots: Lot[], groupBy: GroupBy, sortBy: SortBy): Section[] {
  if (groupBy === 'stock') {
    return [{ key: '__all__', label: '', stockGroups: sortGroups(buildStockGroups(lots), sortBy) }];
  }

  const buckets = new Map<string, { label: string; lots: Lot[] }>();

  for (const lot of lots) {
    let key: string;
    let label: string;

    if (groupBy === 'theme') {
      key = lot.themeId ?? '__none__';
      label = lot.themeName ?? '테마 없음';
    } else if (groupBy === 'broker') {
      key = lot.broker.id;
      label = lot.broker.name;
    } else {
      key = lot.appliedStrategyName ?? '__none__';
      label = lot.appliedStrategyName ?? '전략 없음';
    }

    if (!buckets.has(key)) buckets.set(key, { label, lots: [] });
    buckets.get(key)!.lots.push(lot);
  }

  const sections: Section[] = Array.from(buckets.entries()).map(([key, { label, lots: bl }]) => ({
    key,
    label,
    stockGroups: sortGroups(buildStockGroups(bl), sortBy),
  }));

  // 미분류(없음) 섹션은 항상 맨 아래
  sections.sort((a, b) => {
    if (a.key === '__none__') return 1;
    if (b.key === '__none__') return -1;
    return a.label.localeCompare(b.label, 'ko');
  });

  return sections;
}

export default function PortfolioPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MarketFilter>('ALL');
  const [groupBy, setGroupBy] = useState<GroupBy>('stock');
  const [sortBy, setSortBy] = useState<SortBy>('date_desc');

  useEffect(() => {
    lotsApi.list()
      .then((res) => setLots(res.data.filter((l) => l.remainingQuantity > 0)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredLots = filter === 'ALL' ? lots : lots.filter((l) => l.market === filter);

  const sections = useMemo(
    () => buildSections(filteredLots, groupBy, sortBy),
    [filteredLots, groupBy, sortBy],
  );

  const totalStockCount = useMemo(
    () => new Set(filteredLots.map((l) => `${l.symbol}:${l.market}`)).size,
    [filteredLots],
  );

  function handleCsvDownload() {
    const today = new Date().toISOString().split('T')[0];
    const header = ['종목명', '심볼', '시장', '통화', '증권사', '테마', '전략', '매수가', '매수일', '초기수량', '잔여수량', '현재가', '수익률(%)', '평가금액'];
    const rows: string[][] = [header];
    for (const lot of filteredLots) {
      rows.push([
        lot.stockName, lot.symbol, lot.market, lot.currency,
        lot.broker?.name ?? '', lot.themeName ?? '', lot.appliedStrategyName ?? '',
        String(lot.purchasePrice), lot.purchaseDate,
        String(lot.initialQuantity), String(lot.remainingQuantity),
        lot.currentPrice != null ? String(lot.currentPrice) : '',
        lot.returnRate != null ? lot.returnRate.toFixed(2) : '',
        lot.evaluationAmount != null ? String(Math.round(lot.evaluationAmount)) : '',
      ]);
    }
    downloadCsv(`portfolio_${today}.csv`, rows);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>포트폴리오</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-secondary)', marginTop: 2 }}>{totalStockCount}개 종목 보유 중</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleCsvDownload} disabled={filteredLots.length === 0} style={csvBtnStyle}>CSV 저장</button>
          <Link href="/search" style={btnStyle}>+ Lot 추가</Link>
        </div>
      </div>

      {/* Controls: market filter + groupBy + sortBy */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        {/* Market tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['ALL', 'KR', 'US'] as const).map((m) => (
            <button key={m} onClick={() => setFilter(m)} style={{ ...tabStyle, ...(filter === m ? tabActiveStyle : {}) }}>
              {m === 'ALL' ? '전체' : m === 'KR' ? '국내' : '해외'}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-default)', margin: '0 4px' }} />

        {/* GroupBy dropdown */}
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          style={selectStyle}
        >
          <option value="stock">종목별</option>
          <option value="theme">테마별</option>
          <option value="broker">증권사별</option>
          <option value="strategy">전략별</option>
        </select>

        {/* SortBy dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          style={selectStyle}
        >
          <option value="date_desc">매수일 최신순</option>
          <option value="date_asc">매수일 오래된순</option>
          <option value="rate_desc">수익률 높은순</option>
          <option value="rate_asc">수익률 낮은순</option>
          <option value="value_desc">평가금액 높은순</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--fg-muted)', fontSize: 13 }}>로딩 중...</div>
      ) : filteredLots.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--fg-muted)', fontSize: 13 }}>
          보유 종목이 없습니다. <Link href="/search" style={{ color: 'var(--color-orange-500)' }}>종목을 추가하세요.</Link>
        </div>
      ) : groupBy === 'stock' ? (
        // 종목별: 섹션 헤더 없이 flat list
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sections[0].stockGroups.map((g) => (
            <StockCard key={`${g.symbol}:${g.market}`} group={g} />
          ))}
        </div>
      ) : (
        // 테마/증권사/전략별: 섹션 헤더 포함
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {sections.map((section) => (
            <div key={section.key}>
              <div style={sectionHeaderStyle}>
                <span style={sectionLabelStyle}>{section.label}</span>
                <span style={sectionCountStyle}>{section.stockGroups.length}종목</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.stockGroups.map((g) => (
                  <StockCard key={`${g.symbol}:${g.market}:${section.key}`} group={g} />
                ))}
              </div>
            </div>
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
              {group.currency === 'KRW'
                ? formatKrw(group.totalValue)
                : `$${group.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
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
  padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-default)',
  background: 'var(--bg-surface)', color: 'var(--fg-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};
const tabActiveStyle: React.CSSProperties = {
  background: 'var(--color-orange-500)', borderColor: 'transparent', color: 'white',
};
const selectStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-default)',
  background: 'var(--bg-surface)', color: 'var(--fg-primary)', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'var(--font-sans)', outline: 'none',
};
const cardStyle: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
  borderRadius: 12, padding: '16px 20px', boxShadow: 'var(--shadow-md)',
  transition: 'box-shadow 150ms', cursor: 'pointer',
};
const csvBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'var(--bg-surface)', color: 'var(--fg-secondary)',
  border: '1px solid var(--border-default)',
  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};
const iconStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
};
const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
  paddingBottom: 8, borderBottom: '1px solid var(--border-default)',
};
const sectionLabelStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)',
};
const sectionCountStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)',
  background: 'var(--bg-muted)', padding: '2px 8px', borderRadius: 20,
};
