'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { lotsApi, positionRulesApi, sellApi, strategiesApi, brokersApi, Lot, PositionRule, SellHistory, Strategy, Broker } from '@/lib/api';
import { formatKrw, formatRate, formatDate, rateColor } from '@/lib/format';

export default function LotDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const symbol = decodeURIComponent(params.symbol as string);
  const lotId = params.lotId as string;
  const market = searchParams.get('market') ?? 'KR';

  const [lot, setLot] = useState<Lot | null>(null);
  const [rules, setRules] = useState<PositionRule[]>([]);
  const [sellHistories, setSellHistories] = useState<SellHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellModal, setSellModal] = useState<{ rule?: PositionRule; manual?: boolean } | null>(null);
  const [applyModal, setApplyModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const [lotRes, rulesRes, sellRes] = await Promise.all([
        lotsApi.get(lotId),
        positionRulesApi.byLot(lotId),
        sellApi.byLot(lotId),
      ]);
      setLot(lotRes.data);
      setRules(rulesRes.data);
      setSellHistories(sellRes.data);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await lotsApi.delete(lotId);
      router.replace(`/portfolio/${symbol}?market=${market}`);
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  useEffect(() => { load(); }, [lotId]);

  if (loading || !lot) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--fg-muted)', fontSize: 13 }}>{loading ? '로딩 중...' : 'Lot을 찾을 수 없습니다.'}</div>;
  }

  const rate = lot.returnRate ?? 0;
  const progress = lot.initialQuantity > 0 ? (lot.remainingQuantity / lot.initialQuantity) * 100 : 0;
  const unrealizedProfit = lot.currentPrice != null
    ? (lot.currentPrice - lot.purchasePrice) * lot.remainingQuantity
    : 0;
  const realizedProfit = sellHistories.reduce((s, h) => s + h.realizedProfit, 0);

  const executedCount = rules.filter((r) => r.isExecuted).length;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <Link href={`/portfolio/${symbol}?market=${market}`} style={{ fontSize: 13, color: 'var(--fg-secondary)', textDecoration: 'none' }}>
          ← {lot.stockName}
        </Link>
      </div>

      {/* Hero */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '22px 24px', boxShadow: 'var(--shadow-md)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700 }}>{lot.stockName}</h1>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: lot.market === 'KR' ? 'rgba(59,130,246,0.1)' : 'rgba(255,107,53,0.1)', color: lot.market === 'KR' ? 'var(--color-blue-600)' : 'var(--color-orange-600)' }}>{lot.market}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{lot.symbol} · {lot.broker?.name} · {formatDate(lot.purchaseDate)}</div>
            {lot.memo && <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 4 }}>{lot.memo}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditModal(true)} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--fg-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                수정
              </button>
              <button onClick={() => setDeleteConfirm(true)} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: 'var(--color-red-500)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                삭제
              </button>
            </div>
            <div style={{ textAlign: 'right' as const }}>
            {lot.currentPrice != null && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: 'var(--fg-primary)' }}>
                {lot.currency === 'USD' ? `$${lot.currentPrice.toFixed(2)}` : formatKrw(lot.currentPrice)}
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: rateColor(rate), marginTop: 4 }}>
              {formatRate(rate)}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
        <StatBox label="매수가" value={lot.currency === 'USD' ? `$${lot.purchasePrice}` : formatKrw(lot.purchasePrice)} />
        <StatBox label="초기 수량" value={`${lot.initialQuantity}주`} />
        <StatBox label="잔여 수량" value={`${lot.remainingQuantity}주`} extra={
          <div style={{ height: 4, background: 'var(--border-muted)', borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-orange-500)', borderRadius: 2 }} />
          </div>
        } />
        <StatBox label="미실현 수익" value={lot.currency === 'USD' ? `$${unrealizedProfit.toFixed(2)}` : formatKrw(unrealizedProfit)} valueColor={rateColor(unrealizedProfit)} />
        <StatBox label="실현 수익" value={lot.currency === 'USD' ? `$${realizedProfit.toFixed(2)}` : formatKrw(realizedProfit)} valueColor={rateColor(realizedProfit)} />
        <StatBox label="전략 진행" value={`${executedCount}/${rules.length}`} />
      </div>

      {/* Position Rules */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-md)', marginBottom: 16 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>매도 전략 (PositionRule)</span>
          <button onClick={() => setApplyModal(true)} style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--color-orange-500)', color: 'white', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            전략 적용
          </button>
        </div>
        {rules.length === 0 ? (
          <div style={{ padding: '24px 18px', textAlign: 'center' as const, fontSize: 13, color: 'var(--fg-muted)' }}>
            적용된 전략이 없습니다.
          </div>
        ) : (
          rules.map((rule, i) => {
            const targetPrice = lot.purchasePrice * (1 + rule.targetProfitRate / 100);
            const reachable = (lot.returnRate ?? 0) >= rule.targetProfitRate;
            return (
              <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 18px', borderBottom: i < rules.length - 1 ? '1px solid var(--border-muted)' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                    목표 {rule.targetProfitRate}% 달성 시 {rule.sellRatio}% 매도
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 2 }}>
                    목표가: {lot.currency === 'USD' ? `$${targetPrice.toFixed(2)}` : formatKrw(targetPrice)}
                    {rule.isExecuted && rule.executedAt && ` · 실행: ${formatDate(rule.executedAt)}`}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {rule.isExecuted ? (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'var(--color-green-50)', color: 'var(--color-green-700)' }}>실행 완료</span>
                  ) : reachable ? (
                    // 목표 수익률 달성 — 알림 표시 (자동/버튼 매도 비활성화)
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,107,53,0.12)', color: 'var(--color-orange-500)', border: '1px solid rgba(255,107,53,0.3)' }}>🔔 목표 달성</span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'var(--bg-muted)', color: 'var(--fg-muted)' }}>대기 중</span>
                  )}
                </div>
              </div>
            );
          })
        )}
        {lot.remainingQuantity > 0 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-muted)' }}>
            <button onClick={() => setSellModal({ manual: true })} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--fg-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              수동 매도
            </button>
          </div>
        )}
      </div>

      {/* Sell History */}
      {sellHistories.length > 0 && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-default)', fontSize: 13, fontWeight: 600 }}>매도 기록</div>
          {sellHistories.map((h, i) => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < sellHistories.length - 1 ? '1px solid var(--border-muted)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-primary)' }}>{formatDate(h.sellDate)} · {h.sellQuantity}주</div>
                <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 1 }}>
                  매도가 {lot.currency === 'USD' ? `$${h.sellPrice}` : formatKrw(h.sellPrice)} · {h.sellType === 'STRATEGY' ? '전략 매도' : '수동 매도'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' as const }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: rateColor(h.realizedProfit) }}>
                  {h.realizedProfit >= 0 ? '+' : ''}{lot.currency === 'USD' ? `$${h.realizedProfit.toFixed(2)}` : formatKrw(h.realizedProfit)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sell Modal */}
      {sellModal && (
        <SellModal
          lot={lot}
          onClose={() => setSellModal(null)}
          onSuccess={() => { setSellModal(null); load(); }}
        />
      )}

      {/* Edit Modal */}
      {editModal && (
        <EditLotModal
          lot={lot}
          onClose={() => setEditModal(false)}
          onSuccess={() => { setEditModal(false); load(); }}
        />
      )}

      {/* Apply Strategy Modal */}
      {applyModal && (
        <ApplyStrategyModal
          lotId={lot.id}
          onClose={() => setApplyModal(false)}
          onSuccess={() => { setApplyModal(false); load(); }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: '28px 28px 24px', width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Lot 삭제</div>
            <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 8 }}>
              <strong>{lot.stockName}</strong> Lot을 삭제하시겠습니까?
            </div>
            {lot.remainingQuantity > 0 && (
              <div style={{ fontSize: 12, color: 'var(--color-red-500)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                잔여 수량({lot.remainingQuantity}주)이 남아 있습니다. 삭제 후에도 매도 기록은 유지됩니다.
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 20 }}>삭제된 Lot은 복구할 수 없습니다.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(false)} disabled={deleting} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--fg-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                취소
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--color-red-500)', color: 'white', fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1, fontFamily: 'var(--font-sans)' }}>
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplyStrategyModal({ lotId, onClose, onSuccess }: {
  lotId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    strategiesApi.list().then((res) => {
      setStrategies(res.data);
      if (res.data.length > 0) setSelected(res.data[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const handleApply = async () => {
    if (!selected) { setError('전략을 선택해주세요.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await strategiesApi.applyToLot(lotId, selected);
      onSuccess();
    } catch {
      setError('전략 적용에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStrategy = strategies.find((s) => s.id === selected);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>전략 적용</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 20 }}>×</button>
        </div>

        {error && <div style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--color-red-200)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--color-red-600)' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--fg-muted)' }}>불러오는 중...</div>
        ) : strategies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--fg-muted)' }}>
            등록된 전략이 없습니다. 먼저 <a href="/strategies" style={{ color: 'var(--color-orange-500)', textDecoration: 'none' }}>매도 전략</a>을 만들어주세요.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 20 }}>
              {strategies.map((s) => (
                <button key={s.id} onClick={() => setSelected(s.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10, border: `2px solid ${selected === s.id ? 'var(--color-orange-500)' : 'var(--border-default)'}`, background: selected === s.id ? 'rgba(255,107,53,0.06)' : 'var(--bg-muted)', cursor: 'pointer', textAlign: 'left' as const, width: '100%', fontFamily: 'var(--font-sans)' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${selected === s.id ? 'var(--color-orange-500)' : 'var(--border-default)'}`, background: selected === s.id ? 'var(--color-orange-500)' : 'transparent', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>{s.name}</div>
                    {s.description && <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{s.description}</div>}
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                      {[...s.rules].sort((a, b) => a.targetProfitRate - b.targetProfitRate).map((r) => (
                        <span key={r.id} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', color: 'var(--fg-secondary)' }}>
                          +{r.targetProfitRate}% → {r.sellRatio}% 매도
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedStrategy && (
              <div style={{ background: 'var(--bg-muted)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 12, color: 'var(--fg-secondary)' }}>
                전략 규칙이 이 Lot의 PositionRule로 복사됩니다. 이후 전략을 수정해도 이 Lot에 영향을 주지 않습니다.
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--border-default)', background: 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--fg-secondary)' }}>취소</button>
              <button onClick={handleApply} disabled={submitting || !selected} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'var(--color-orange-500)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? '적용 중...' : '적용'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SellModal({ lot, onClose, onSuccess }: {
  lot: Lot; onClose: () => void; onSuccess: () => void;
}) {
  const todayLocal = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const remaining = lot.remainingQuantity;

  const [inputMode, setInputMode] = useState<'qty' | 'pct'>('qty');
  const [sellPrice, setSellPrice] = useState(lot.currentPrice?.toString() ?? '');
  const [sellQuantity, setSellQuantity] = useState('');
  const [sellPct, setSellPct] = useState('');
  const [sellDate, setSellDate] = useState(todayLocal);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleQtyChange = (value: string) => {
    setSellQuantity(value);
    const q = parseFloat(value);
    if (!isNaN(q) && q > 0 && remaining > 0) {
      setSellPct(((q / remaining) * 100).toFixed(2));
    } else {
      setSellPct('');
    }
  };

  const handlePctChange = (value: string) => {
    setSellPct(value);
    const p = parseFloat(value);
    if (!isNaN(p) && p > 0 && remaining > 0) {
      const q = remaining * (p / 100);
      setSellQuantity(String(Math.round(q * 10000) / 10000));
    } else {
      setSellQuantity('');
    }
  };

  const qty = parseFloat(sellQuantity) || 0;
  const price = parseFloat(sellPrice) || 0;
  const expectedProfit = (price - lot.purchasePrice) * qty;

  const handleSubmit = async () => {
    if (!sellPrice || price <= 0) {
      setError('매도가는 0보다 커야 합니다.');
      return;
    }
    if (qty <= 0 || qty > remaining) {
      setError(`수량은 0 초과 ${remaining} 이하여야 합니다.`);
      return;
    }
    if (sellDate > todayLocal) {
      setError('매도일은 오늘 이전 날짜여야 합니다.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await sellApi.execute(lot.id, {
        sellPrice: price,
        sellQuantity: qty,
        sellDate,
        sellType: 'MANUAL',
      });
      onSuccess();
    } catch {
      setError('매도 처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabBase: React.CSSProperties = { flex: 1, padding: '7px 0', fontSize: 13, fontWeight: 600, border: '1px solid var(--border-default)', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 120ms' };
  const tabActive: React.CSSProperties = { background: 'var(--color-orange-500)', color: 'white', borderColor: 'var(--color-orange-500)' };
  const tabInactive: React.CSSProperties = { background: 'var(--bg-surface)', color: 'var(--fg-secondary)' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>수동 매도</div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>잔여 {remaining}주</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 20 }}>×</button>
        </div>

        {/* 수량 / % 탭 */}
        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
          <button onClick={() => setInputMode('qty')} style={{ ...tabBase, borderRadius: '8px 0 0 8px', ...(inputMode === 'qty' ? tabActive : tabInactive) }}>수량 입력</button>
          <button onClick={() => setInputMode('pct')} style={{ ...tabBase, borderRadius: '0 8px 8px 0', borderLeft: 'none', ...(inputMode === 'pct' ? tabActive : tabInactive) }}>% 입력</button>
        </div>

        {error && <div style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--color-red-200)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--color-red-600)' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          <Field label="매도가">
            <input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} style={inputStyle} />
          </Field>

          {inputMode === 'qty' ? (
            <Field label={`수량 (최대 ${remaining}주)`}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" value={sellQuantity} onChange={(e) => handleQtyChange(e.target.value)} min={0} max={remaining} step="any" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => handleQtyChange(String(remaining))}
                  style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border-default)', background: parseFloat(sellQuantity) === remaining ? 'var(--color-orange-500)' : 'var(--bg-muted)', color: parseFloat(sellQuantity) === remaining ? 'white' : 'var(--fg-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
                  전체
                </button>
              </div>
              {sellPct !== '' && (
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 5 }}>
                  잔여 수량의 <strong style={{ color: 'var(--color-orange-500)' }}>{sellPct}%</strong> 매도
                </div>
              )}
            </Field>
          ) : (
            <Field label="매도 비율 (%)">
              <div style={{ position: 'relative' }}>
                <input type="number" value={sellPct} onChange={(e) => handlePctChange(e.target.value)} min={0} max={100} step="any" style={{ ...inputStyle, paddingRight: 32 }} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--fg-muted)', pointerEvents: 'none' }}>%</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[25, 50, 75].map((p) => (
                  <button key={p} onClick={() => handlePctChange(String(p))}
                    style={{ flex: 1, padding: '5px 0', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border-default)', background: parseFloat(sellPct) === p ? 'var(--color-orange-500)' : 'var(--bg-muted)', color: parseFloat(sellPct) === p ? 'white' : 'var(--fg-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                    {p}%
                  </button>
                ))}
                <button onClick={() => handlePctChange('100')}
                  style={{ flex: 1, padding: '5px 0', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border-default)', background: parseFloat(sellPct) === 100 ? 'var(--color-orange-500)' : 'var(--bg-muted)', color: parseFloat(sellPct) === 100 ? 'white' : 'var(--fg-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  전체
                </button>
              </div>
              {sellQuantity !== '' && (
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 5 }}>
                  <strong style={{ color: 'var(--color-orange-500)' }}>{sellQuantity}주</strong> 매도
                </div>
              )}
            </Field>
          )}

          <Field label="매도일">
            <input type="date" value={sellDate} max={todayLocal} onChange={(e) => setSellDate(e.target.value)} style={inputStyle} />
          </Field>
        </div>

        {price > 0 && qty > 0 && (
          <div style={{ background: 'var(--bg-muted)', borderRadius: 10, padding: '12px 14px', marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>예상 실현 수익</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: rateColor(expectedProfit) }}>
              {expectedProfit >= 0 ? '+' : ''}{lot.currency === 'USD' ? `$${expectedProfit.toFixed(2)}` : formatKrw(expectedProfit)}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--border-default)', background: 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--fg-secondary)' }}>취소</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'var(--color-orange-500)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {submitting ? '처리 중...' : '매도 실행'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, valueColor, extra }: { label: string; value: string; valueColor?: string; extra?: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: 'var(--fg-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: valueColor ?? 'var(--fg-primary)' }}>{value}</div>
      {extra}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function EditLotModal({ lot, onClose, onSuccess }: {
  lot: Lot; onClose: () => void; onSuccess: () => void;
}) {
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const soldQty = Number(lot.initialQuantity) - Number(lot.remainingQuantity);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [form, setForm] = useState({
    purchasePrice: String(lot.purchasePrice),
    purchaseDate: lot.purchaseDate,
    initialQuantity: String(lot.initialQuantity),
    brokerId: lot.broker?.id ?? '',
    memo: lot.memo ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    brokersApi.list().then((res) => setBrokers(res.data));
  }, []);

  const handleSubmit = async () => {
    const purchasePrice = parseFloat(form.purchasePrice);
    const initialQuantity = parseFloat(form.initialQuantity);
    if (!purchasePrice || purchasePrice <= 0) { setError('매수가는 0보다 커야 합니다.'); return; }
    if (!initialQuantity || initialQuantity <= 0) { setError('수량은 0보다 커야 합니다.'); return; }
    if (initialQuantity < soldQty) { setError(`이미 ${soldQty}주 매도됐습니다. 수량은 ${soldQty}주 이상이어야 합니다.`); return; }
    if (!form.purchaseDate) { setError('매수일을 입력해주세요.'); return; }
    if (form.purchaseDate > todayStr) { setError('매수일은 오늘 이전 날짜여야 합니다.'); return; }
    if (!form.brokerId) { setError('증권사를 선택해주세요.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await lotsApi.update(lot.id, {
        purchasePrice,
        purchaseDate: form.purchaseDate,
        initialQuantity,
        brokerId: form.brokerId,
        memo: form.memo || undefined,
      });
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Lot 수정</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{lot.stockName} · {lot.symbol}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 20 }}>×</button>
        </div>

        {error && <div style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--color-red-200)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--color-red-600)' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          <Field label={`매수가 (${lot.currency})`}>
            <input type="number" value={form.purchasePrice} onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))} min={0} step="any" style={inputStyle} />
          </Field>

          <Field label={`수량${soldQty > 0 ? ` (최소 ${soldQty}주 — 이미 매도됨)` : ''}`}>
            <input type="number" value={form.initialQuantity} onChange={(e) => setForm((f) => ({ ...f, initialQuantity: e.target.value }))} min={soldQty} step="any" style={inputStyle} />
            {soldQty > 0 && (
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 5 }}>
                매도 수량 {soldQty}주 포함 · 잔여 수량은 자동 계산됩니다
              </div>
            )}
          </Field>

          <Field label="매수일">
            <input type="date" value={form.purchaseDate} max={todayStr} onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))} style={inputStyle} />
          </Field>

          <Field label="증권사">
            <select value={form.brokerId} onChange={(e) => setForm((f) => ({ ...f, brokerId: e.target.value }))} style={{ ...inputStyle, appearance: 'none' as const }}>
              {brokers.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>

          <Field label="메모 (선택)">
            <textarea value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--border-default)', background: 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--fg-secondary)' }}>취소</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'var(--color-orange-500)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 13px', borderRadius: 8, border: '1px solid var(--border-default)',
  background: 'var(--bg-surface)', fontSize: 14, color: 'var(--fg-primary)', outline: 'none', fontFamily: 'var(--font-sans)',
};
