import axios, { InternalAxiosRequestConfig } from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
  timeout: 10_000,
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // refresh 엔드포인트 자체가 401이면 바로 로그인 이동
    if (original.url?.includes('/auth/refresh')) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise<void>((resolve) => {
          pendingQueue.push(resolve);
        }).then(() => api(original));
      }

      isRefreshing = true;
      try {
        await api.post('/auth/refresh');
        pendingQueue.forEach((cb) => cb());
        pendingQueue = [];
        return api(original);
      } catch {
        pendingQueue = [];
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  },
);

export default api;

// ── Auth ────────────────────────────────────────────────
export const authApi = {
  me: () => api.get<User>('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  googleLoginUrl: () => `${BACKEND_URL}/api/auth/google`,
};

// ── Dashboard ───────────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get<DashboardSummary>('/dashboard/summary'),
  actionableLots: () => api.get<ActionableLot[]>('/dashboard/actionable-lots'),
};

// ── Portfolio / Lots ────────────────────────────────────
export const lotsApi = {
  list: (params?: { market?: string }) => api.get<Lot[]>('/lots', { params }),
  bySymbol: (symbol: string, market: string) =>
    api.get<Lot[]>('/lots', { params: { symbol, market } }),
  get: (id: string) => api.get<Lot>(`/lots/${id}`),
  create: (body: CreateLotDto) => api.post<Lot>('/lots', body),
  update: (id: string, body: UpdateLotDto) => api.patch<Lot>(`/lots/${id}`, body),
  delete: (id: string) => api.delete(`/lots/${id}`),
};

// ── Strategies ──────────────────────────────────────────
export const strategiesApi = {
  list: () => api.get<Strategy[]>('/strategies'),
  get: (id: string) => api.get<Strategy>(`/strategies/${id}`),
  create: (body: CreateStrategyDto) => api.post<Strategy>('/strategies', body),
  update: (id: string, body: UpdateStrategyDto) => api.put<Strategy>(`/strategies/${id}`, body),
  delete: (id: string) => api.delete(`/strategies/${id}`),
  applyToLot: (lotId: string, strategyId: string) =>
    api.post(`/lots/${lotId}/position-rules/apply`, { strategyId }),
};

// ── Position Rules ──────────────────────────────────────
export const positionRulesApi = {
  byLot: (lotId: string) => api.get<PositionRule[]>(`/lots/${lotId}/position-rules`),
};

// ── Sell ────────────────────────────────────────────────
export const sellApi = {
  execute: (lotId: string, body: SellExecuteDto) =>
    api.post<SellHistory>(`/lots/${lotId}/sell`, body),
  byLot: (lotId: string) =>
    api.get<SellHistory[]>(`/lots/${lotId}/sell-histories`),
  history: (params?: SellHistoryParams) =>
    api.get<SellHistory[]>('/sell-histories', { params }),
  monthlyStats: (params?: { year?: number }) =>
    api.get<MonthlyStats[]>('/sell-histories/monthly-stats', { params }),
};

// ── Stocks / Search ─────────────────────────────────────
export const stocksApi = {
  search: (query: string, market: 'KR' | 'US') =>
    api.get<StockSearchResult[]>('/stocks/search', { params: { query, market } }),
  price: (symbol: string, market: string) =>
    api.get<PriceData>(`/stocks/price`, { params: { symbol, market } }),
};

// ── Watchlist ───────────────────────────────────────────
export const watchlistApi = {
  list: () => api.get<WatchlistItem[]>('/watchlists'),
  add: (body: AddWatchlistDto) => api.post<WatchlistItem>('/watchlists', body),
  remove: (id: string) => api.delete(`/watchlists/${id}`),
};

// ── Brokers ─────────────────────────────────────────────
export const brokersApi = {
  list: () => api.get<Broker[]>('/brokers'),
};

// ── Admin ────────────────────────────────────────────────
export const adminApi = {
  errorLogs: (limit = 100) => api.get<ErrorLogItem[]>(`/admin/error-logs?limit=${limit}`),
};

// ── Exchange Rate ────────────────────────────────────────
export const exchangeRateApi = {
  current: () => api.get<ExchangeRate>('/exchange-rates/current'),
  byDate: (date: string) => api.get<{ usdToKrw: number; source: 'db' | 'current' }>(`/exchange-rates/by-date?date=${date}`),
};

// ── Types ────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  role: 'user' | 'admin';
}

export interface DashboardSummary {
  totalInvestmentKrw: number;   // 현재 보유 잔량 원금
  totalInvestedKrw: number;     // 총 누적 투자원금 (수익률 분모)
  totalValueKrw: number;
  unrealizedProfitKrw: number;
  realizedProfitKrw: number;
  totalProfitKrw: number;
  totalReturnRate: number;
  exchangeRate: number;
  activeLotCount: number;
  holdingStockCount: number;
}

export interface ActionableLot {
  lotId: string;
  stockName: string;
  symbol: string;
  market: string;
  currency: string;
  returnRate: number;
  currentPrice: number;
  purchasePrice: number;
  remainingQuantity: number;
  triggeredRules: { id: string; targetProfitRate: number; sellRatio: number }[];
}

export interface Lot {
  id: string;
  symbol: string;
  market: 'KR' | 'US';
  currency: 'KRW' | 'USD';
  stockName: string;
  purchasePrice: number;
  initialQuantity: number;
  remainingQuantity: number;
  purchaseDate: string;
  memo?: string | null;
  broker: { id: string; name: string };
  positionRules?: PositionRule[];
  sellHistories?: SellHistory[];
  currentPrice: number | null;
  returnRate: number | null;
  evaluationAmount: number | null;
  createdAt: string;
}

export interface CreateLotDto {
  symbol: string;
  market: 'KR' | 'US';
  purchasePrice: number;
  quantity: number;
  purchaseDate: string;
  brokerId: string;
  exchangeRateAtPurchase?: number;
  memo?: string;
}

export interface UpdateLotDto {
  purchasePrice?: number;
  purchaseDate?: string;
  initialQuantity?: number;
  brokerId?: string;
  memo?: string;
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  rules: StrategyRule[];
}

export interface StrategyRule {
  id: string;
  targetProfitRate: number;
  sellRatio: number;
  orderIndex: number;
}

export interface CreateStrategyDto {
  name: string;
  description?: string;
  rules: { targetProfitRate: number; sellRatio: number }[];
}

export interface UpdateStrategyDto {
  name?: string;
  description?: string;
  rules?: { targetProfitRate: number; sellRatio: number }[];
}

export interface PositionRule {
  id: string;
  targetProfitRate: number;
  sellRatio: number;
  orderIndex: number;
  isExecuted: boolean;
  executedAt?: string;
}

export interface SellHistory {
  id: string;
  lotId: string;
  stockName: string;
  symbol: string;
  market: string;
  currency: string;
  sellPrice: number;
  sellQuantity: number;
  sellDate: string;
  realizedProfit: number;
  realizedProfitKrw: number;   // 원화 환산 실현수익
  sellAmountKrw: number;        // 원화 환산 매도금액
  sellType: 'MANUAL' | 'STRATEGY';
  triggerProfitRate?: number | null;
  exchangeRateAtSell?: number | null;
  positionRuleId?: string | null;
  createdAt?: string;
}

export interface SellExecuteDto {
  sellPrice: number;
  sellQuantity: number;
  sellDate: string;
  positionRuleId?: string;
  sellType: 'MANUAL' | 'STRATEGY';
}

export interface SellHistoryParams {
  startDate?: string;
  endDate?: string;
  market?: string;
}

export interface MonthlyStats {
  year: number;
  month: number;
  totalSellAmount: number;
  realizedProfit: number;
  returnRate: number;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  market: 'KR' | 'US';
  currency: 'KRW' | 'USD';
  exchange?: string;
  currentPrice?: number;
}

export interface PriceData {
  symbol: string;
  market: string;
  price: number;
  changeRate: number | null;
  cachedAt: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  market: 'KR' | 'US';
  currency: 'KRW' | 'USD';
  stockName: string;
  memo?: string;
  createdAt: string;
  currentPrice: number | null;
  changeRate: number | null;
}

export interface AddWatchlistDto {
  symbol: string;
  market: 'KR' | 'US';
  stockName: string;
  memo?: string;
}

export interface Broker {
  id: string;
  name: string;
}

export interface ExchangeRate {
  usdToKrw: number;
  fetchedAt: string;
}

export interface ErrorLogItem {
  id: string;
  message: string;
  stack: string | null;
  userId: string | null;
  path: string | null;
  createdAt: string;
}
