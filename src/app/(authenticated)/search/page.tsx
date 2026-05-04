'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { stocksApi, brokersApi, lotsApi, watchlistApi, exchangeRateApi, themesApi, StockSearchResult, Broker, PriceData, WatchlistItem, Theme, Lot } from '@/lib/api';
import { formatKrw, rateColor } from '@/lib/format';

const POPULAR_STOCKS: Record<'KR' | 'US', StockSearchResult[]> = {
  KR: [
    { symbol: '005930.KS', name: '삼성전자', market: 'KR', currency: 'KRW', exchange: 'KSC' },
    { symbol: '000660.KS', name: 'SK하이닉스', market: 'KR', currency: 'KRW', exchange: 'KSC' },
    { symbol: '373220.KS', name: 'LG에너지솔루션', market: 'KR', currency: 'KRW', exchange: 'KSC' },
    { symbol: '207940.KS', name: '삼성바이오로직스', market: 'KR', currency: 'KRW', exchange: 'KSC' },
    { symbol: '005380.KS', name: '현대차', market: 'KR', currency: 'KRW', exchange: 'KSC' },
    { symbol: '035420.KS', name: 'NAVER', market: 'KR', currency: 'KRW', exchange: 'KSC' },
    { symbol: '035720.KS', name: '카카오', market: 'KR', currency: 'KRW', exchange: 'KSC' },
    { symbol: '068270.KS', name: '셀트리온', market: 'KR', currency: 'KRW', exchange: 'KSC' },
    { symbol: '005490.KS', name: 'POSCO홀딩스', market: 'KR', currency: 'KRW', exchange: 'KSC' },
    { symbol: '105560.KS', name: 'KB금융', market: 'KR', currency: 'KRW', exchange: 'KSC' },
  ],
  US: [
    { symbol: 'AAPL', name: 'Apple', market: 'US', currency: 'USD', exchange: 'NMS' },
    { symbol: 'MSFT', name: 'Microsoft', market: 'US', currency: 'USD', exchange: 'NMS' },
    { symbol: 'NVDA', name: 'NVIDIA', market: 'US', currency: 'USD', exchange: 'NMS' },
    { symbol: 'AMZN', name: 'Amazon', market: 'US', currency: 'USD', exchange: 'NMS' },
    { symbol: 'TSLA', name: 'Tesla', market: 'US', currency: 'USD', exchange: 'NMS' },
    { symbol: 'GOOGL', name: 'Alphabet', market: 'US', currency: 'USD', exchange: 'NMS' },
    { symbol: 'META', name: 'Meta', market: 'US', currency: 'USD', exchange: 'NMS' },
    { symbol: 'NFLX', name: 'Netflix', market: 'US', currency: 'USD', exchange: 'NMS' },
    { symbol: 'AMD', name: 'AMD', market: 'US', currency: 'USD', exchange: 'NMS' },
    { symbol: 'BRK-B', name: 'Berkshire Hathaway', market: 'US', currency: 'USD', exchange: 'NYQ' },
  ],
};

export default function SearchPage() {
  const searchParams = useSearchParams();

  const [market, setMarket] = useState<'KR' | 'US'>('KR');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [stockPrice, setStockPrice] = useState<PriceData | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchAdding, setWatchAdding] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    brokersApi.list().then((r) => setBrokers(r.data)).catch(() => {});
    watchlistApi.list().then((r) => setWatchlist(r.data)).catch(() => {});
  }, []);

  // 관심종목 "매수" 링크로 진입 시 해당 종목 자동 선택
  useEffect(() => {
    const sym = searchParams.get('symbol');
    const mkt = searchParams.get('market') as 'KR' | 'US' | null;
    if (!sym || !mkt) return;
    const popular = [...POPULAR_STOCKS.KR, ...POPULAR_STOCKS.US].find(
      (s) => s.symbol === sym && s.market === mkt,
    );
    const stock: StockSearchResult = popular ?? { symbol: sym, market: mkt, name: sym, currency: mkt === 'KR' ? 'KRW' : 'USD', exchange: '' };
    setMarket(mkt);
    handleSelectStock(stock);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await stocksApi.search(value.trim(), market);
        setResults(res.data);
        setDropdownOpen(res.data.length > 0);
      } catch {
        setResults([]);
        setDropdownOpen(false);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [market]);

  const handleSelectStock = async (stock: StockSearchResult) => {
    setSelectedStock(stock);
    setDropdownOpen(false);
    setQuery(stock.name);
    setStockPrice(null);
    setPriceLoading(true);
    try {
      const res = await stocksApi.price(stock.symbol, stock.market);
      setStockPrice(res.data);
    } catch {
      setStockPrice(null);
    } finally {
      setPriceLoading(false);
    }
  };

  const handleMarketChange = (m: 'KR' | 'US') => {
    setMarket(m);
    setQuery('');
    setResults([]);
    setSelectedStock(null);
    setStockPrice(null);
    setDropdownOpen(false);
  };

  const handleSelectPopular = (stock: StockSearchResult) => {
    if (stock.market !== market) setMarket(stock.market);
    handleSelectStock(stock);
  };

  const watchlistItem = selectedStock
    ? watchlist.find((w) => w.symbol === selectedStock.symbol && w.market === selectedStock.market)
    : undefined;
  const isInWatchlist = !!watchlistItem;

  const handleToggleWatchlist = async () => {
    if (!selectedStock || watchAdding) return;
    setWatchAdding(true);
    try {
      if (watchlistItem) {
        await watchlistApi.remove(watchlistItem.id);
        setWatchlist((prev) => prev.filter((w) => w.id !== watchlistItem.id));
      } else {
        const item = await watchlistApi.add({
          symbol: selectedStock.symbol,
          market: selectedStock.market,
          stockName: selectedStock.name,
        });
        setWatchlist((prev) => [...prev, item.data]);
      }
    } catch {
    } finally {
      setWatchAdding(false);
    }
  };

  const formatPrice = (price: number, currency: string) =>
    currency === 'USD' ? `$${price.toFixed(2)}` : formatKrw(price);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>종목 검색</h1>
        <p style={{ fontSize: 13, color: 'var(--fg-secondary)', marginTop: 2 }}>
          한국·미국 주식을 검색하고 Lot을 등록하세요.
        </p>
      </div>

      {/* Market tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['KR', 'US'] as const).map((m) => (
          <button key={m} onClick={() => handleMarketChange(m)}
            style={{ padding: '7px 20px', borderRadius: 8, border: '1px solid var(--border-default)', background: market === m ? 'var(--color-orange-500)' : 'var(--bg-surface)', color: market === m ? 'white' : 'var(--fg-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {m === 'KR' ? '국내 (KR)' : '해외 (US)'}
          </button>
        ))}
      </div>

      {/* 검색 입력 + 드롭다운 */}
      <div ref={wrapperRef} style={{ position: 'relative', marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => results.length > 0 && setDropdownOpen(true)}
            placeholder={market === 'KR'
              ? 'English name or code (e.g. Samsung, 005930.KS)'
              : 'Symbol or name (e.g. AAPL, Apple)'}
            style={{ width: '100%', padding: '11px 42px 11px 16px', borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-surface)', fontSize: 14, color: 'var(--fg-primary)', outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
          />
          {searching && (
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, border: '2px solid var(--color-orange-500)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          )}
        </div>

        {market === 'KR' && !selectedStock && (
          <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '6px 0 0 2px' }}>
            국내 주식은 <strong>영문</strong>으로 검색하세요. (예: Samsung, SK Hynix, Kakao, Naver)
          </p>
        )}

        {/* 드롭다운 결과 */}
        {dropdownOpen && results.length > 0 && (
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, boxShadow: 'var(--shadow-xl)', maxHeight: 340, overflowY: 'auto' }}>
            <div style={{ padding: '8px 14px 6px', fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              검색 결과 {results.length}건 (관련도순)
            </div>
            {results.map((r, i) => (
              <div
                key={r.symbol}
                onClick={() => handleSelectStock(r)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderTop: i === 0 ? '1px solid var(--border-muted)' : '1px solid var(--border-muted)', transition: 'background 100ms' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-muted)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, flexShrink: 0, ...(r.market === 'KR' ? { background: 'rgba(59,130,246,0.1)', color: 'var(--color-blue-600)' } : { background: 'rgba(255,107,53,0.1)', color: 'var(--color-orange-600)' }) }}>
                  {r.market}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 1 }}>{r.symbol}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', flexShrink: 0 }}>{r.exchange}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 인기 종목 */}
      {!selectedStock && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 24, marginBottom: 8 }}>
          {(['KR', 'US'] as const).map((mkt) => (
            <div key={mkt}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                  background: mkt === 'KR' ? 'rgba(59,130,246,0.1)' : 'rgba(255,107,53,0.1)',
                  color: mkt === 'KR' ? 'var(--color-blue-600)' : 'var(--color-orange-600)' }}>
                  {mkt}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)' }}>
                  {mkt === 'KR' ? '국내 인기 종목' : '해외 인기 종목'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                {POPULAR_STOCKS[mkt].map((stock) => (
                  <PopularChip key={stock.symbol} stock={stock} onClick={() => handleSelectPopular(stock)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 선택된 종목 카드 */}
      {selectedStock && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '20px 24px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16 }}>
            {/* 종목 정보 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, ...(selectedStock.market === 'KR' ? { background: 'rgba(59,130,246,0.1)', color: 'var(--color-blue-600)' } : { background: 'rgba(255,107,53,0.1)', color: 'var(--color-orange-600)' }) }}>
                {selectedStock.market}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-primary)' }}>{selectedStock.name}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 3 }}>{selectedStock.symbol}{selectedStock.exchange ? ` · ${selectedStock.exchange}` : ''}</div>
              </div>
            </div>

            {/* 현재가 + 등락률 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'right' as const }}>
                {priceLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-muted)', fontSize: 13 }}>
                    <div style={{ width: 14, height: 14, border: '2px solid var(--color-orange-500)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    가격 조회 중...
                  </div>
                ) : stockPrice ? (
                  <>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 600, color: 'var(--fg-primary)', lineHeight: 1 }}>
                      {formatPrice(stockPrice.price, selectedStock.currency)}
                    </div>
                    {stockPrice.changeRate != null && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, fontFamily: 'var(--font-mono)', background: stockPrice.changeRate >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: rateColor(stockPrice.changeRate) }}>
                          {stockPrice.changeRate >= 0 ? '▲' : '▼'} {Math.abs(stockPrice.changeRate).toFixed(2)}% 오늘
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>가격 정보 없음</div>
                )}
              </div>

              <button
                onClick={handleToggleWatchlist}
                disabled={watchAdding}
                style={{
                  padding: '11px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' as const,
                  cursor: watchAdding ? 'default' : 'pointer',
                  border: isInWatchlist ? '1.5px solid #f59e0b' : '1px solid var(--border-default)',
                  background: isInWatchlist ? 'rgba(245,158,11,0.1)' : 'var(--bg-surface)',
                  color: isInWatchlist ? '#d97706' : 'var(--fg-secondary)',
                }}>
                <span style={{ color: isInWatchlist ? '#f59e0b' : 'var(--fg-muted)', marginRight: 5 }}>
                  {isInWatchlist ? '★' : '☆'}
                </span>
                {watchAdding ? '처리 중...' : '관심종목'}
              </button>
              <button
                onClick={() => setModalOpen(true)}
                style={{ padding: '11px 22px', borderRadius: 10, background: 'var(--color-orange-500)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' as const }}>
                Lot 등록
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && selectedStock && (
        <LotRegisterModal
          stock={selectedStock}
          currentPrice={stockPrice?.price ?? null}
          brokers={brokers}
          onClose={() => setModalOpen(false)}
        />
      )}

    </div>
  );
}

function PopularChip({ stock, onClick }: { stock: StockSearchResult; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '10px 12px', borderRadius: 10, textAlign: 'left' as const, cursor: 'pointer',
        fontFamily: 'var(--font-sans)', width: '100%',
        border: `1px solid ${hover ? 'var(--color-orange-500)' : 'var(--border-default)'}`,
        background: hover ? 'rgba(255,107,53,0.04)' : 'var(--bg-surface)',
        transition: 'border-color 150ms, background 150ms',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {stock.name}
      </div>
      <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
        {stock.symbol}
      </div>
    </button>
  );
}

function LotRegisterModal({ stock, currentPrice, brokers, onClose }: {
  stock: StockSearchResult;
  currentPrice: number | null;
  brokers: Broker[];
  onClose: () => void;
}) {
  const isUSD = stock.currency === 'USD';
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const [inputMode, setInputMode] = useState<'qty' | 'amount'>('qty');
  const [form, setForm] = useState({
    buyPrice: currentPrice != null ? String(currentPrice) : '',
    quantity: '',
    totalAmount: '',
    buyDate: todayStr,
    brokerId: brokers[0]?.id ?? '',
    themeId: '',
    memo: '',
  });
  const [exchangeRate, setExchangeRate] = useState('');
  const [exchangeRateSource, setExchangeRateSource] = useState<'db' | 'current' | null>(null);
  const [historicalPrice, setHistoricalPrice] = useState<{ price: number; date: string } | null>(null);
  const [historicalPriceLoading, setHistoricalPriceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [existingLots, setExistingLots] = useState<Lot[]>([]);
  const [themeConflict, setThemeConflict] = useState<{ lots: Lot[]; pendingThemeId: string; pendingThemeName: string } | null>(null);

  useEffect(() => {
    themesApi.list().then((r) => setThemes(r.data)).catch(() => {});
    lotsApi.bySymbol(stock.symbol, stock.market)
      .then((r) => setExistingLots(r.data.filter((l) => l.remainingQuantity > 0)))
      .catch(() => {});
  }, [stock.symbol, stock.market]);

  useEffect(() => {
    if (!isUSD) return;
    exchangeRateApi.byDate(form.buyDate).then((res) => {
      setExchangeRate(String(Math.round(res.data.usdToKrw)));
      setExchangeRateSource(res.data.source);
    }).catch(() => {});
  }, [form.buyDate, isUSD]);

  useEffect(() => {
    if (!form.buyDate) return;
    setHistoricalPrice(null);
    setHistoricalPriceLoading(true);
    stocksApi.priceAtDate(stock.symbol, stock.market, form.buyDate)
      .then((res) => {
        if (res.data) {
          setHistoricalPrice(res.data);
          const rounded = stock.currency === 'KRW'
            ? String(Math.round(res.data.price))
            : String(res.data.price);
          setForm((f) => ({ ...f, buyPrice: rounded }));
        }
      })
      .catch(() => {})
      .finally(() => setHistoricalPriceLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.buyDate]);

  const handleThemeChange = (themeId: string) => {
    if (!themeId) {
      setForm((f) => ({ ...f, themeId: '' }));
      return;
    }
    const conflicting = existingLots.filter((l) => l.themeId && l.themeId !== themeId);
    if (conflicting.length > 0) {
      const themeName = themes.find((t) => t.id === themeId)?.name ?? themeId;
      setThemeConflict({ lots: conflicting, pendingThemeId: themeId, pendingThemeName: themeName });
    } else {
      setForm((f) => ({ ...f, themeId }));
    }
  };

  const buyPriceNum = parseFloat(form.buyPrice) || 0;
  const derivedQty = inputMode === 'amount' && buyPriceNum > 0 ? parseFloat(form.totalAmount) / buyPriceNum : NaN;
  const derivedAmount = inputMode === 'qty' && buyPriceNum > 0 ? buyPriceNum * (parseFloat(form.quantity) || 0) : NaN;
  const finalQty = inputMode === 'qty' ? parseFloat(form.quantity) : derivedQty;

  const handleSubmit = async () => {
    if (!form.brokerId) { setError('증권사는 필수입니다.'); return; }
    if (!form.buyPrice || buyPriceNum <= 0) { setError('매수가는 0보다 커야 합니다.'); return; }
    if (inputMode === 'qty' && !form.quantity) { setError('수량을 입력해 주세요.'); return; }
    if (inputMode === 'amount' && !form.totalAmount) { setError('금액을 입력해 주세요.'); return; }
    if (!isFinite(finalQty) || finalQty <= 0) { setError('유효한 수량이 계산되지 않았습니다.'); return; }
    if (form.buyDate > todayStr) { setError('매수일은 오늘 이전 날짜여야 합니다.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const exchangeRateNum = parseFloat(exchangeRate);
      await lotsApi.create({
        symbol: stock.symbol,
        market: stock.market,
        purchasePrice: buyPriceNum,
        quantity: finalQty,
        purchaseDate: form.buyDate,
        brokerId: form.brokerId,
        exchangeRateAtPurchase: isUSD && exchangeRateNum > 0 ? exchangeRateNum : undefined,
        themeId: form.themeId || undefined,
        memo: form.memo || undefined,
      });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch {
      setError('등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (p: number) =>
    stock.currency === 'USD' ? `$${p.toFixed(2)}` : `${Math.round(p).toLocaleString('ko-KR')}원`;

  const formatAmount = (p: number) =>
    stock.currency === 'USD' ? `$${p.toFixed(2)}` : `${Math.round(p).toLocaleString('ko-KR')}원`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Lot 등록</div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>
              {stock.name} ({stock.symbol})
              {currentPrice != null && (
                <span style={{ marginLeft: 8, color: 'var(--fg-muted)' }}>· 현재가 {formatPrice(currentPrice)}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-green-600)', fontWeight: 600 }}>Lot이 등록되었습니다!</div>
        ) : (
          <>
            {error && <div style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--color-red-200)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--color-red-600)' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label={`매수가 * ${currentPrice != null ? `(현재가: ${formatPrice(currentPrice)})` : ''}`}>
                <input
                  type="number"
                  value={form.buyPrice}
                  onChange={(e) => { setForm((f) => ({ ...f, buyPrice: e.target.value })); setHistoricalPrice(null); }}
                  placeholder={stock.currency === 'USD' ? 'USD' : 'KRW'}
                  style={inputStyle}
                />
                {historicalPriceLoading && (
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 10, height: 10, border: '1.5px solid var(--color-orange-500)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    종가 조회 중...
                  </div>
                )}
                {!historicalPriceLoading && historicalPrice && (
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 5 }}>
                    {historicalPrice.date === form.buyDate
                      ? `📅 ${historicalPrice.date} 종가 자동 입력 · 직접 수정 가능`
                      : `⚠️ ${form.buyDate} 데이터 없음 → ${historicalPrice.date} 종가 사용 · 직접 수정 가능`}
                  </div>
                )}
              </Field>

              {/* 수량 / 금액 탭 */}
              <div>
                <div style={{ display: 'flex', background: 'var(--bg-muted)', borderRadius: 8, padding: 3, marginBottom: 10, width: 'fit-content' }}>
                  {(['qty', 'amount'] as const).map((mode) => (
                    <button key={mode} onClick={() => setInputMode(mode)} style={{
                      padding: '5px 16px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      background: inputMode === mode ? 'var(--bg-surface)' : 'transparent',
                      color: inputMode === mode ? 'var(--fg-primary)' : 'var(--fg-muted)',
                      boxShadow: inputMode === mode ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 150ms',
                    }}>
                      {mode === 'qty' ? '수량' : '금액'}
                    </button>
                  ))}
                </div>
                {inputMode === 'qty' ? (
                  <div>
                    <input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="매수 수량" style={inputStyle} />
                    {isFinite(derivedAmount) && derivedAmount > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 5 }}>
                        총 매수 금액 ≈ <strong style={{ color: 'var(--fg-secondary)' }}>{formatAmount(derivedAmount)}</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input type="number" value={form.totalAmount} onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))} placeholder={stock.currency === 'USD' ? '매수 금액 (USD)' : '매수 금액 (KRW)'} style={inputStyle} />
                    {isFinite(derivedQty) && derivedQty > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 5 }}>
                        환산 수량 ≈ <strong style={{ color: 'var(--fg-secondary)' }}>{derivedQty % 1 === 0 ? derivedQty.toLocaleString() : derivedQty.toFixed(6).replace(/\.?0+$/, '')}주</strong>
                      </div>
                    )}
                    {form.totalAmount && buyPriceNum <= 0 && <div style={{ fontSize: 11, color: 'var(--color-orange-500)', marginTop: 5 }}>매수가를 먼저 입력하세요.</div>}
                  </div>
                )}
              </div>

              <Field label="매수일 *">
                <input type="date" value={form.buyDate} max={todayStr} onChange={(e) => setForm((f) => ({ ...f, buyDate: e.target.value }))} style={inputStyle} />
              </Field>
              {isUSD && (
                <Field label="매수 시점 환율 (USD/KRW)">
                  <input type="number" value={exchangeRate} onChange={(e) => { setExchangeRate(e.target.value); setExchangeRateSource(null); }} placeholder="예: 1380" style={inputStyle} />
                  {exchangeRateSource && (
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 5 }}>
                      {exchangeRateSource === 'db' ? `📅 ${form.buyDate} 저장된 환율` : '⚡ 현재 환율 (해당 날짜 데이터 없음)'}{' · 직접 수정 가능'}
                    </div>
                  )}
                </Field>
              )}
              <Field label="증권사 *">
                <select value={form.brokerId} onChange={(e) => setForm((f) => ({ ...f, brokerId: e.target.value }))} style={inputStyle}>
                  {brokers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="테마">
                <select value={form.themeId} onChange={(e) => handleThemeChange(e.target.value)} style={inputStyle}>
                  <option value="">선택하지 않음</option>
                  {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {themes.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 5 }}>
                    테마 관리 메뉴에서 테마를 먼저 등록해 주세요.
                  </div>
                )}
              </Field>
              <Field label="메모">
                <input value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} placeholder="선택 사항" style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-surface)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--fg-secondary)' }}>취소</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: 11, borderRadius: 10, background: 'var(--color-orange-500)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', fontFamily: 'var(--font-sans)' }}>
                {submitting ? '등록 중...' : 'Lot 등록'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 테마 충돌 경고 다이얼로그 */}
      {themeConflict && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 380, boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>테마 다르게 등록하시겠습니까?</div>
            <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 14 }}>
              <strong>{stock.name}</strong>의 기존 Lot이 다른 테마에 등록되어 있습니다:
            </div>
            <div style={{ background: 'var(--bg-muted)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {themeConflict.lots.map((l, i) => (
                <div key={l.id} style={{ fontSize: 12, color: 'var(--fg-primary)' }}>
                  <span style={{ color: 'var(--fg-muted)' }}>Lot {i + 1} ({l.purchaseDate}): </span>
                  <strong>{l.themeName}</strong>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 20 }}>
              정말 <strong>'{themeConflict.pendingThemeName}'</strong>으로 등록하시겠습니까?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setThemeConflict(null)}
                style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1px solid var(--border-default)', background: 'var(--bg-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--fg-secondary)' }}
              >
                취소
              </button>
              <button
                onClick={() => {
                  setForm((f) => ({ ...f, themeId: themeConflict.pendingThemeId }));
                  setThemeConflict(null);
                }}
                style={{ flex: 1, padding: '10px', borderRadius: 9, background: 'var(--color-orange-500)', color: 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
              >
                확인, 등록
              </button>
            </div>
          </div>
        </div>
      )}
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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 13px', borderRadius: 8, border: '1px solid var(--border-default)',
  background: 'var(--bg-surface)', fontSize: 14, color: 'var(--fg-primary)', outline: 'none',
  fontFamily: 'var(--font-sans)',
};
