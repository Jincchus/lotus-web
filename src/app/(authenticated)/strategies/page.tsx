'use client';

import { useEffect, useState } from 'react';
import { strategiesApi, Strategy, CreateStrategyDto } from '@/lib/api';

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Strategy | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    strategiesApi.list()
      .then((r) => setStrategies(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('전략을 삭제하면 해당 전략의 StrategyRule도 삭제됩니다.\n이미 Lot에 적용된 PositionRule은 유지됩니다.\n삭제하시겠습니까?')) return;
    setDeleting(id);
    try {
      await strategiesApi.delete(id);
      setStrategies((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert('삭제에 실패했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>매도 전략</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-secondary)', marginTop: 2 }}>
            목표 수익률과 매도 비율을 설정하고 Lot에 적용하세요.
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
          style={{ padding: '9px 18px', borderRadius: 9, background: 'var(--color-orange-500)', color: 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          + 전략 만들기
        </button>
      </div>

      {/* 설명 카드 */}
      <div style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--fg-primary)' }}>전략이란?</strong>
        &nbsp;목표 수익률에 도달하면 몇 %를 매도할지 규칙을 미리 정해두는 기능입니다.
        예) 목표 10% 달성 시 30% 매도, 20% 달성 시 추가 30% 매도.
        전략을 Lot에 적용하면 PositionRule로 복사되어 이후 전략 변경에 영향받지 않습니다.
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--fg-muted)', fontSize: 13 }}>로딩 중...</div>
      ) : strategies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, color: 'var(--fg-muted)', marginBottom: 20 }}>등록된 전략이 없습니다.</div>
          <button
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
            style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--color-orange-500)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            첫 번째 전략 만들기
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {strategies.map((s) => (
            <StrategyCard
              key={s.id}
              strategy={s}
              deleting={deleting === s.id}
              onEdit={() => { setEditTarget(s); setModalOpen(true); }}
              onDelete={() => handleDelete(s.id)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <StrategyModal
          initial={editTarget}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function StrategyCard({ strategy, deleting, onEdit, onDelete }: {
  strategy: Strategy;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const totalRatio = strategy.rules.reduce((s, r) => s + r.sellRatio, 0);
  const sorted = [...strategy.rules].sort((a, b) => a.targetProfitRate - b.targetProfitRate);

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '18px 22px', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-primary)' }}>{strategy.name}</div>
          {strategy.description && (
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 3 }}>{strategy.description}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={onEdit}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--fg-secondary)', fontFamily: 'var(--font-sans)' }}>
            편집
          </button>
          <button onClick={onDelete} disabled={deleting}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--color-red-200)', background: 'transparent', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--color-red-500)', fontFamily: 'var(--font-sans)' }}>
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>

      {/* Rules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map((rule, i) => (
          <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-muted)', borderRadius: 9 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-orange-500)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                수익률 {rule.targetProfitRate >= 0 ? '+' : ''}{rule.targetProfitRate}% 달성 시
              </span>
              <span style={{ fontSize: 13, color: 'var(--fg-secondary)', marginLeft: 6 }}>
                보유 수량의 {rule.sellRatio}% 매도
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-orange-600)', fontWeight: 600 }}>
              -{rule.sellRatio}%
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 4, background: 'var(--border-muted)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(totalRatio, 100)}%`, height: '100%', background: totalRatio > 100 ? 'var(--color-red-500)' : 'var(--color-orange-500)', borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 11, color: totalRatio > 100 ? 'var(--color-red-500)' : 'var(--fg-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          총 매도 비율 {totalRatio}%
        </span>
      </div>
    </div>
  );
}

function StrategyModal({ initial, onClose, onSaved }: {
  initial: Strategy | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [rules, setRules] = useState<{ targetProfitRate: string; sellRatio: string }[]>(
    initial?.rules.length
      ? [...initial.rules]
          .sort((a, b) => a.targetProfitRate - b.targetProfitRate)
          .map((r) => ({ targetProfitRate: String(r.targetProfitRate), sellRatio: String(r.sellRatio) }))
      : [{ targetProfitRate: '10', sellRatio: '50' }]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addRule = () => setRules((prev) => [...prev, { targetProfitRate: '', sellRatio: '' }]);
  const removeRule = (i: number) => setRules((prev) => prev.filter((_, idx) => idx !== i));
  const updateRule = (i: number, key: 'targetProfitRate' | 'sellRatio', val: string) => {
    setRules((prev) => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
  };

  const totalRatio = rules.reduce((s, r) => s + (parseFloat(r.sellRatio) || 0), 0);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('전략 이름을 입력해주세요.'); return; }
    if (rules.length === 0) { setError('규칙을 최소 1개 이상 추가해주세요.'); return; }

    const parsed = rules.map((r, i) => {
      const targetProfitRate = parseFloat(r.targetProfitRate);
      const sellRatio = parseFloat(r.sellRatio);
      if (isNaN(targetProfitRate) || isNaN(sellRatio) || sellRatio <= 0) {
        throw new Error(`규칙 ${i + 1}의 값을 올바르게 입력해주세요.`);
      }
      return { targetProfitRate, sellRatio, orderIndex: i };
    });

    if (totalRatio > 100) { setError('매도 비율 합계가 100%를 초과합니다.'); return; }

    const dto: CreateStrategyDto = {
      name: name.trim(),
      description: description.trim() || undefined,
      rules: parsed,
    };

    setSubmitting(true);
    setError('');
    try {
      if (isEdit && initial) {
        await strategiesApi.delete(initial.id);
        await strategiesApi.create(dto);
      } else {
        await strategiesApi.create(dto);
      }
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{isEdit ? '전략 편집' : '새 전략 만들기'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 22 }}>×</button>
        </div>

        {error && (
          <div style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--color-red-200)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--color-red-600)' }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="전략 이름 *">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 분할 매도 전략" style={inputStyle} />
          </Field>
          <Field label="설명 (선택)">
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="전략에 대한 메모" style={inputStyle} />
          </Field>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)' }}>수익률 규칙 *</label>
              <button onClick={addRule}
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-orange-500)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: 0 }}>
                + 규칙 추가
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rules.map((rule, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                  <div>
                    {i === 0 && <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 4 }}>목표 수익률 (%)</div>}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        value={rule.targetProfitRate}
                        onChange={(e) => updateRule(i, 'targetProfitRate', e.target.value)}
                        placeholder="예: 10"
                        style={{ ...inputStyle, paddingRight: 28 }}
                      />
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--fg-muted)' }}>%</span>
                    </div>
                  </div>
                  <div>
                    {i === 0 && <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 4 }}>매도 비율 (%)</div>}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        value={rule.sellRatio}
                        onChange={(e) => updateRule(i, 'sellRatio', e.target.value)}
                        placeholder="예: 50"
                        min={1} max={100}
                        style={{ ...inputStyle, paddingRight: 28 }}
                      />
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--fg-muted)' }}>%</span>
                    </div>
                  </div>
                  <button onClick={() => removeRule(i)} disabled={rules.length === 1}
                    style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border-default)', background: 'transparent', cursor: rules.length === 1 ? 'not-allowed' : 'pointer', color: 'var(--fg-muted)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: i === 0 ? 20 : 0, flexShrink: 0 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* 총 매도비율 게이지 */}
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-muted)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>총 매도 비율</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: totalRatio > 100 ? 'var(--color-red-500)' : totalRatio === 100 ? 'var(--color-green-600)' : 'var(--fg-primary)' }}>
                  {totalRatio}% / 100%
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--border-default)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(totalRatio, 100)}%`, height: '100%', background: totalRatio > 100 ? 'var(--color-red-500)' : totalRatio === 100 ? 'var(--color-green-600)' : 'var(--color-orange-500)', borderRadius: 3, transition: 'width 200ms' }} />
              </div>
              {totalRatio < 100 && (
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 5 }}>
                  잔여 {100 - totalRatio}%는 조건 미충족 시 계속 보유합니다.
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid var(--border-default)', background: 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--fg-secondary)' }}>
            취소
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ flex: 1, padding: 11, borderRadius: 10, background: 'var(--color-orange-500)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {submitting ? '저장 중...' : isEdit ? '수정 완료' : '전략 저장'}
          </button>
        </div>
      </div>
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
  fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
};
