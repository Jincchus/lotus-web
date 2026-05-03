'use client';

import { useAuth } from '@/lib/auth-context';
import {
  adminApi, exchangeRateApi, noticesApi,
  AdminUser, AdminStock, ErrorLogItem, Notice, SystemStatus,
} from '@/lib/api';
import { useEffect, useState, useCallback } from 'react';
import { formatDate } from '@/lib/format';

type MainTab = 'general' | 'admin';
type AdminTab = 'errorLogs' | 'exchangeRate' | 'users' | 'stocks' | 'notices' | 'system';

const ADMIN_TABS: { key: AdminTab; label: string }[] = [
  { key: 'errorLogs',    label: '에러 로그' },
  { key: 'exchangeRate', label: '환율 관리' },
  { key: 'users',        label: '사용자 관리' },
  { key: 'stocks',       label: '종목 보정' },
  { key: 'notices',      label: '공지사항' },
  { key: 'system',       label: '시스템 상태' },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>('general');
  const [adminTab, setAdminTab] = useState<AdminTab>('errorLogs');
  const [exchangeRate, setExchangeRate] = useState<{ usdToKrw: number; fetchedAt: string } | null>(null);

  useEffect(() => {
    exchangeRateApi.current().then((r) => setExchangeRate(r.data)).catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>설정</h1>
      </div>

      {user?.role === 'admin' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['general', 'admin'] as MainTab[]).map((t) => (
            <button key={t} onClick={() => setMainTab(t)}
              style={{
                padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                fontFamily: 'var(--font-sans)', cursor: 'pointer', transition: 'all 150ms',
                border: mainTab === t ? '1px solid var(--color-orange-500)' : '1px solid var(--border-default)',
                background: mainTab === t ? 'var(--color-orange-500)' : 'transparent',
                color: mainTab === t ? 'white' : 'var(--fg-secondary)',
              }}>
              {t === 'general' ? '일반' : '관리자'}
            </button>
          ))}
        </div>
      )}

      {mainTab === 'general' && (
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

      {mainTab === 'admin' && user?.role === 'admin' && (
        <div>
          {/* 서브탭 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' as const }}>
            {ADMIN_TABS.map((t) => (
              <button key={t.key} onClick={() => setAdminTab(t.key)}
                style={{
                  padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  fontFamily: 'var(--font-sans)', cursor: 'pointer', transition: 'all 150ms',
                  border: adminTab === t.key ? '1px solid var(--color-orange-500)' : '1px solid var(--border-default)',
                  background: adminTab === t.key ? 'var(--color-orange-500)' : 'var(--bg-surface)',
                  color: adminTab === t.key ? 'white' : 'var(--fg-secondary)',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {adminTab === 'errorLogs'    && <ErrorLogsTab />}
          {adminTab === 'exchangeRate' && <ExchangeRateTab />}
          {adminTab === 'users'        && <UsersTab />}
          {adminTab === 'stocks'       && <StocksTab />}
          {adminTab === 'notices'      && <NoticesTab />}
          {adminTab === 'system'       && <SystemTab />}
        </div>
      )}
    </div>
  );
}

// ── 에러 로그 ────────────────────────────────────────────

function ErrorLogsTab() {
  const [logs, setLogs] = useState<ErrorLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.errorLogs(100).then((r) => setLogs(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <Section title="에러 로그 (최근 100건)">
      <div style={{ padding: '12px 0' }}>
        {loading ? <Muted>불러오는 중...</Muted> : logs.length === 0 ? <Muted>에러 로그가 없습니다.</Muted> : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {logs.map((log) => <ErrorLogRow key={log.id} log={log} />)}
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
        <pre style={{ marginTop: 8, fontSize: 11, color: 'var(--fg-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'var(--bg-muted)', borderRadius: 4, padding: 8, overflowX: 'auto' }}>
          {log.stack}
        </pre>
      )}
    </div>
  );
}

// ── 환율 관리 ────────────────────────────────────────────

type RateRow = { id: string; date: string; usdToKrw: number; createdAt: string };

function ExchangeRateTab() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [rate, setRate] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [rows, setRows] = useState<RateRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchDate, setSearchDate] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const loadList = useCallback(() => {
    setListLoading(true);
    adminApi.rateList(60).then((r) => setRows(r.data)).catch(() => {}).finally(() => setListLoading(false));
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const save = async () => {
    if (!date || !rate) return;
    if (date > todayStr) { setMsg('날짜는 오늘 이전이어야 합니다.'); return; }
    const rateNum = parseFloat(rate);
    if (!rateNum || rateNum <= 0) { setMsg('환율은 0보다 커야 합니다.'); return; }
    setSaving(true); setMsg('');
    try {
      await adminApi.upsertRate(date, rateNum);
      setMsg('저장 완료');
      loadList();
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? '저장 실패');
    } finally { setSaving(false); }
  };

  const search = async () => {
    if (!searchDate) return;
    setSearching(true); setSearchResult(null);
    try {
      const res = await exchangeRateApi.byDate(searchDate);
      const src = res.data.source === 'db' ? 'DB 저장값' : '현재 환율 (해당 날짜 없음)';
      setSearchResult(`${res.data.usdToKrw.toLocaleString('ko-KR')}원  ·  ${src}`);
    } catch {
      setSearchResult('조회 실패');
    } finally { setSearching(false); }
  };

  return (
    <>
      <Section title="기준환율 수동 저장">
        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' as const }}>
            <Field label="날짜">
              <input type="date" value={date} max={todayStr} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="USD/KRW">
              <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="1450.00" style={{ ...inputStyle, width: 120 }} />
            </Field>
            <SaveBtn onClick={save} saving={saving} />
          </div>
          {msg && <span style={{ fontSize: 12, color: msg.includes('완료') ? 'var(--color-green-600, #16a34a)' : 'var(--color-red-600, #dc2626)' }}>{msg}</span>}
          <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0 }}>해당 날짜 데이터가 이미 있으면 덮어씁니다.</p>
        </div>
      </Section>

      <Section title="날짜 검색">
        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' as const }}>
            <Field label="조회할 날짜">
              <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} style={inputStyle} />
            </Field>
            <button onClick={search} disabled={searching || !searchDate}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-muted)', color: 'var(--fg-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              {searching ? '조회 중...' : '조회'}
            </button>
          </div>
          {searchResult && (
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-primary)', padding: '8px 12px', background: 'var(--bg-muted)', borderRadius: 8 }}>
              {searchDate} → {searchResult}
            </div>
          )}
        </div>
      </Section>

      <Section title={`저장된 환율 (최근 ${rows.length}건)`}>
        <div style={{ padding: '12px 0' }}>
          {listLoading ? <Muted>불러오는 중...</Muted> : rows.length === 0 ? <Muted>저장된 환율이 없습니다.</Muted> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                  {['날짜', 'USD/KRW', '저장 시각'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                    <td style={{ padding: '8px 8px', fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)' }}>{r.date}</td>
                    <td style={{ padding: '8px 8px', fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)', fontWeight: 600 }}>
                      {parseFloat(String(r.usdToKrw)).toLocaleString('ko-KR')}원
                    </td>
                    <td style={{ padding: '8px 8px', color: 'var(--fg-muted)' }}>{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>
    </>
  );
}

// ── 사용자 관리 ──────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    adminApi.users().then((r) => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleRole = async (u: AdminUser) => {
    const next = u.role === 'admin' ? 'user' : 'admin';
    await adminApi.updateUserRole(u.id, next);
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role: next } : x));
  };

  return (
    <Section title="사용자 목록">
      <div style={{ padding: '12px 0' }}>
        {loading ? <Muted>불러오는 중...</Muted> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                {['이름', '이메일', '가입일', 'Role', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                  <td style={{ padding: '8px 8px', color: 'var(--fg-primary)' }}>{u.name}</td>
                  <td style={{ padding: '8px 8px', color: 'var(--fg-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '8px 8px', color: 'var(--fg-muted)' }}>{formatDate(u.createdAt)}</td>
                  <td style={{ padding: '8px 8px' }}>
                    <RoleBadge role={u.role} />
                  </td>
                  <td style={{ padding: '8px 8px' }}>
                    <button onClick={() => toggleRole(u)}
                      style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--fg-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      {u.role === 'admin' ? '일반으로' : '관리자로'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Section>
  );
}

// ── 종목 보정 ────────────────────────────────────────────

function StocksTab() {
  const [stocks, setStocks] = useState<AdminStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.stocks().then((r) => setStocks(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const startEdit = (s: AdminStock) => { setEditing(s.id); setEditName(s.name); };
  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const res = await adminApi.updateStock(id, { name: editName });
      setStocks((prev) => prev.map((s) => s.id === id ? { ...s, name: (res.data as AdminStock).name } : s));
      setEditing(null);
    } finally { setSaving(false); }
  };

  return (
    <Section title="종목 DB 보정">
      <div style={{ padding: '12px 0' }}>
        {loading ? <Muted>불러오는 중...</Muted> : stocks.length === 0 ? <Muted>등록된 종목이 없습니다.</Muted> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                {['심볼', '시장', '종목명', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                  <td style={{ padding: '8px 8px', fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)' }}>{s.symbol}</td>
                  <td style={{ padding: '8px 8px', color: 'var(--fg-muted)' }}>{s.market}</td>
                  <td style={{ padding: '8px 8px' }}>
                    {editing === s.id
                      ? <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                      : <span style={{ color: 'var(--fg-secondary)' }}>{s.name}</span>}
                  </td>
                  <td style={{ padding: '8px 8px', whiteSpace: 'nowrap' as const }}>
                    {editing === s.id
                      ? <>
                          <button onClick={() => saveEdit(s.id)} disabled={saving} style={smallBtnStyle('#FF6B35', 'white')}>저장</button>
                          <button onClick={() => setEditing(null)} style={{ ...smallBtnStyle('transparent', 'var(--fg-muted)'), marginLeft: 4 }}>취소</button>
                        </>
                      : <button onClick={() => startEdit(s)} style={smallBtnStyle('transparent', 'var(--fg-muted)')}>수정</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Section>
  );
}

// ── 공지사항 ─────────────────────────────────────────────

function NoticesTab() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    adminApi.allNotices().then((r) => setNotices(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    try {
      await adminApi.createNotice(form);
      setForm({ title: '', content: '' });
      load();
    } finally { setSaving(false); }
  };

  const toggleActive = async (n: Notice) => {
    await adminApi.updateNotice(n.id, { isActive: !n.isActive });
    setNotices((prev) => prev.map((x) => x.id === n.id ? { ...x, isActive: !n.isActive } : x));
  };

  const remove = async (id: string) => {
    await adminApi.deleteNotice(id);
    setNotices((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <>
      <Section title="공지사항 작성">
        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="제목" style={{ ...inputStyle, width: '100%' }} />
          <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="내용" rows={3}
            style={{ ...inputStyle, width: '100%', resize: 'vertical' as const, fontFamily: 'var(--font-sans)' }} />
          <div>
            <SaveBtn onClick={create} saving={saving} label="등록" />
          </div>
        </div>
      </Section>

      <Section title="공지사항 목록">
        <div style={{ padding: '12px 0' }}>
          {loading ? <Muted>불러오는 중...</Muted> : notices.length === 0 ? <Muted>공지사항이 없습니다.</Muted> : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {notices.map((n) => (
                <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border-muted)', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: n.isActive ? 'var(--fg-primary)' : 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {n.title}
                      {n.isActive && <span style={{ fontSize: 10, background: '#22c55e', color: 'white', borderRadius: 3, padding: '1px 5px' }}>활성</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{n.content}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>{formatDate(n.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => toggleActive(n)}
                      style={smallBtnStyle('transparent', 'var(--fg-muted)')}>
                      {n.isActive ? '비활성' : '활성'}
                    </button>
                    <button onClick={() => remove(n.id)} style={smallBtnStyle('transparent', '#ef4444')}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </>
  );
}

// ── 시스템 상태 ──────────────────────────────────────────

function SystemTab() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.systemStatus().then((r) => setStatus(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const formatUptime = (s: number) => {
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return `${d}일 ${h}시간 ${m}분`;
  };

  return (
    <Section title="시스템 상태">
      <div style={{ padding: '16px 0' }}>
        {loading ? <Muted>불러오는 중...</Muted> : !status ? <Muted>조회 실패</Muted> : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            <InfoRow label="서버 업타임"    value={formatUptime(status.uptime)} />
            <InfoRow label="Node.js"       value={status.nodeVersion} />
            <InfoRow label="Heap 사용"     value={`${status.memory.heapUsed} MB / ${status.memory.heapTotal} MB`} />
            <InfoRow label="RSS 메모리"    value={`${status.memory.rss} MB`} />
            <InfoRow label="기준 시각"     value={formatDate(status.timestamp)} />
          </div>
        )}
      </div>
    </Section>
  );
}

// ── 공통 컴포넌트 ────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '0 20px', boxShadow: 'var(--shadow-md)', marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-secondary)', padding: '14px 0 10px', borderBottom: '1px solid var(--border-muted)' }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
      <label style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

function SaveBtn({ onClick, saving, label = '저장' }: { onClick: () => void; saving: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-orange-500)', color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', opacity: saving ? 0.6 : 1 }}>
      {saving ? '저장 중...' : label}
    </button>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 4, padding: '2px 6px', background: role === 'admin' ? 'var(--color-orange-500)' : 'var(--bg-muted)', color: role === 'admin' ? 'white' : 'var(--fg-muted)' }}>
      {role === 'admin' ? '관리자' : '일반'}
    </span>
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

function Muted({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: 'var(--fg-muted)', padding: '8px 0' }}>{children}</div>;
}

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-default)',
  background: 'var(--bg-input, var(--bg-surface))', color: 'var(--fg-primary)',
  fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none',
};

const smallBtnStyle = (bg: string, color: string): React.CSSProperties => ({
  fontSize: 11, padding: '3px 8px', borderRadius: 4,
  border: '1px solid var(--border-default)', background: bg, color,
  cursor: 'pointer', fontFamily: 'var(--font-sans)',
});
