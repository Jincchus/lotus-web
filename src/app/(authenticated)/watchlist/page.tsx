'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { watchlistApi, WatchlistItem } from '@/lib/api';
import { formatRate, rateColor } from '@/lib/format';

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    watchlistApi.list()
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (id: string) => {
    await watchlistApi.remove(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>관심종목</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-secondary)', marginTop: 2 }}>{items.length}개 종목</p>
        </div>
        <Link href="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-orange-500)', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          + 종목 추가
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--fg-muted)', fontSize: 13 }}>로딩 중...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--fg-muted)', fontSize: 13 }}>
          관심종목이 없습니다. <Link href="/search" style={{ color: 'var(--color-orange-500)' }}>종목을 추가하세요.</Link>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
          {items.map((item, i) => (
            <WatchItem key={item.id} item={item} isLast={i === items.length - 1} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}

function WatchItem({ item, isLast, onRemove }: { item: WatchlistItem; isLast: boolean; onRemove: (id: string) => void }) {
  const isKr = item.market === 'KR';
  const change = item.changeRate ?? 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: isLast ? 'none' : '1px solid var(--border-muted)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, ...(isKr ? { background: 'rgba(59,130,246,0.1)', color: 'var(--color-blue-600)' } : { background: 'rgba(255,107,53,0.1)', color: 'var(--color-orange-600)' }) }}>
        {item.market}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-primary)' }}>{item.stockName}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 1 }}>{item.symbol}</div>
      </div>
      {item.currentPrice != null && (
        <div style={{ textAlign: 'right' as const, marginRight: 12 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: 'var(--fg-primary)' }}>
            {item.currency === 'USD' ? `$${item.currentPrice.toFixed(2)}` : `${item.currentPrice.toLocaleString('ko-KR')}원`}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: rateColor(change), marginTop: 2 }}>
            {formatRate(change)}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Link href={`/search?symbol=${item.symbol}&market=${item.market}`}
          style={{ padding: '6px 12px', borderRadius: 7, background: 'var(--color-orange-500)', color: 'white', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
          매수
        </Link>
        <button onClick={() => onRemove(item.id)}
          style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--fg-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          삭제
        </button>
      </div>
    </div>
  );
}
