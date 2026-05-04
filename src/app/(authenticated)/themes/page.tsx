'use client';

import { useEffect, useState } from 'react';
import { themesApi, Theme } from '@/lib/api';

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    themesApi.list()
      .then((r) => setThemes(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) { setAddError('테마 이름을 입력해 주세요.'); return; }
    setAdding(true);
    setAddError('');
    try {
      const res = await themesApi.create({ name });
      setThemes((prev) => [...prev, res.data]);
      setNewName('');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setAddError(typeof msg === 'string' ? msg : '추가에 실패했습니다.');
    } finally {
      setAdding(false);
    }
  };

  const handleEditStart = (theme: Theme) => {
    setEditingId(theme.id);
    setEditName(theme.name);
    setEditError('');
  };

  const handleEditSave = async (id: string) => {
    const name = editName.trim();
    if (!name) { setEditError('테마 이름을 입력해 주세요.'); return; }
    setSaving(true);
    setEditError('');
    try {
      const res = await themesApi.update(id, { name });
      setThemes((prev) => prev.map((t) => (t.id === id ? res.data : t)));
      setEditingId(null);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setEditError(typeof msg === 'string' ? msg : '수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' 테마를 삭제하시겠습니까?\n이 테마에 등록된 Lot의 테마 정보가 제거됩니다.`)) return;
    try {
      await themesApi.delete(id);
      setThemes((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>테마 관리</h1>
        <p style={{ fontSize: 13, color: 'var(--fg-secondary)', marginTop: 2 }}>
          포트폴리오 분류에 사용할 테마를 직접 등록하세요.
        </p>
      </div>

      {/* 테마 추가 */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '20px 20px', marginBottom: 20, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 10 }}>새 테마 추가</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setAddError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="예: 성장주, 반도체, AI테마주"
            style={{ flex: 1, padding: '9px 13px', borderRadius: 8, border: `1px solid ${addError ? 'var(--color-red-400)' : 'var(--border-default)'}`, background: 'var(--bg-surface)', fontSize: 14, color: 'var(--fg-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }}
          />
          <button
            onClick={handleAdd}
            disabled={adding}
            style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--color-orange-500)', color: 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: adding ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}
          >
            {adding ? '추가 중...' : '+ 추가'}
          </button>
        </div>
        {addError && <div style={{ fontSize: 12, color: 'var(--color-red-500)', marginTop: 6 }}>{addError}</div>}
      </div>

      {/* 테마 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--fg-muted)', fontSize: 13 }}>로딩 중...</div>
      ) : themes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--fg-muted)', fontSize: 13 }}>
          등록된 테마가 없습니다. 위에서 테마를 추가해 보세요.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {themes.map((theme) => (
            <div key={theme.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
              {editingId === theme.id ? (
                <div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={editName}
                      onChange={(e) => { setEditName(e.target.value); setEditError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditSave(theme.id)}
                      autoFocus
                      style={{ flex: 1, padding: '7px 11px', borderRadius: 7, border: `1px solid ${editError ? 'var(--color-red-400)' : 'var(--color-orange-400)'}`, background: 'var(--bg-surface)', fontSize: 14, color: 'var(--fg-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }}
                    />
                    <button
                      onClick={() => handleEditSave(theme.id)}
                      disabled={saving}
                      style={smallBtnPrimary}
                    >
                      {saving ? '...' : '저장'}
                    </button>
                    <button onClick={() => setEditingId(null)} style={smallBtnGhost}>취소</button>
                  </div>
                  {editError && <div style={{ fontSize: 12, color: 'var(--color-red-500)', marginTop: 5 }}>{editError}</div>}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-orange-500)', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-primary)' }}>{theme.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleEditStart(theme)} style={smallBtnGhost}>수정</button>
                    <button onClick={() => handleDelete(theme.id, theme.name)} style={smallBtnDanger}>삭제</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const smallBtnPrimary: React.CSSProperties = {
  padding: '7px 14px', borderRadius: 7, background: 'var(--color-orange-500)', color: 'white',
  border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
};
const smallBtnGhost: React.CSSProperties = {
  padding: '7px 12px', borderRadius: 7, background: 'transparent', color: 'var(--fg-secondary)',
  border: '1px solid var(--border-default)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
};
const smallBtnDanger: React.CSSProperties = {
  padding: '7px 12px', borderRadius: 7, background: 'transparent', color: 'var(--color-red-500)',
  border: '1px solid var(--color-red-200)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
};
