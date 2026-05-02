'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { lotsApi, exchangeRateApi, Lot } from '@/lib/api';
import { formatKrw, formatRate, formatDate, rateColor } from '@/lib/format';

export default function SymbolPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const symbol = decodeURIComponent(params.symbol as string);
  const market = (searchParams.get('market') ?? 'KR') as 'KR' | 'US';

  const [lots, setLots] = useState<Lot[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      lotsApi.bySymbol(symbol, market),
      exchangeRateApi.current(),
    ])
      .then(([lotsRes, fxRes]) => {
        setLots(lotsRes.data);
        setExchangeRate(fxRes.data.usdToKrw ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol, market]);

  const isUsd = lots[0]?.currency === 'USD';
  const fx = isUsd ? exchangeRate : 1;

  // 수익률은 통화 내에서 계산 (분자·분모 동일 통화이므로 환율 무관)
  const totalValue = lots.reduce((s, l) => s + (l.evaluationAmount ?? 0), 0);
  const totalInvest = lots.reduce((s, l) => s + l.purchasePrice * l.remainingQuantity, 0);
  const overallRate = totalInvest > 0 ? ((totalValue - totalInvest) / totalInvest) * 100 : 0;

  // 표시용 KRW 환산
  const totalValueKrw = totalValue * fx;

  const stockName = lots[0]?.stockName ?? symbol;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link href="/portfolio" style={{ fontSize: 13, color: 'var(--fg-secondary)', textDecoration: 'none' }}>← 포트폴리오</Link>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 10 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{stockName}</h1>
          <span style={{ fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 3 }}>{symbol} · {market}</span>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
        <MiniStat
          label="총 평가금액"
          value={formatKrw(totalValueKrw)}
          sub={isUsd ? `$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : undefined}
        />
        <MiniStat label="전체 수익률" value={formatRate(overallRate)} valueColor={rateColor(overallRate)} />
        <MiniStat label="보유 Lot" value={`${lots.filter(l => l.remainingQuantity > 0).length}개`} />
      </div>

      {/* Lot list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--fg-muted)', fontSize: 13 }}>로딩 중...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      )}
    </div>
  );
}

function LotCard({ lot }: { lot: Lot }) {
  const rate = lot.returnRate ?? 0;
  const progress = lot.initialQuantity > 0 ? (lot.remainingQuantity / lot.initialQuantity) * 100 : 0;
  return (
    <Link href={`/portfolio/${encodeURIComponent(lot.symbol)}/lots/${lot.id}?market=${lot.market}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 2 }}>Lot #{lot.id.slice(-6)}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{formatDate(lot.purchaseDate)} · {lot.broker?.name}</div>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: 'var(--fg-primary)' }}>
              {lot.currency === 'USD' ? `$${(lot.evaluationAmount ?? 0).toFixed(0)}` : formatKrw(lot.evaluationAmount ?? 0)}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: rateColor(rate), marginTop: 3 }}>{formatRate(rate)}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <MiniInfo label="매수가" value={lot.currency === 'USD' ? `$${lot.purchasePrice}` : formatKrw(lot.purchasePrice)} />
          <MiniInfo label="잔여/초기" value={`${lot.remainingQuantity}/${lot.initialQuantity}주`} />
          <MiniInfo label="현재가" value={lot.currentPrice != null ? (lot.currency === 'USD' ? `$${lot.currentPrice}` : formatKrw(lot.currentPrice)) : '—'} />
        </div>

        {/* Remaining progress */}
        <div style={{ height: 4, background: 'var(--border-muted)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-orange-500)', borderRadius: 2, transition: 'width 600ms' }} />
        </div>

        {/* Strategy badges */}
        {lot.positionRules && lot.positionRules.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' as const }}>
            {lot.positionRules.map((rule) => (
              <span key={rule.id} style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 5, ...(rule.isExecuted ? { background: 'var(--color-green-50)', color: 'var(--color-green-700)' } : { background: 'var(--bg-muted)', color: 'var(--fg-secondary)' }) }}>
                {rule.targetProfitRate}% → {rule.sellRatio}%{rule.isExecuted ? ' ✓' : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function MiniStat({ label, value, valueColor, sub }: { label: string; value: string; valueColor?: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: 'var(--fg-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color: valueColor ?? 'var(--fg-primary)' }}>{value}</div>
      {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-primary)', fontWeight: 500 }}>{value}</div>
    </div>
  );
}
