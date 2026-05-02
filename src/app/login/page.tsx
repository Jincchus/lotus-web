'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) setError(true);
  }, []);

  const handleLogin = () => {
    window.location.href = authApi.googleLoginUrl();
  };

  return (
    <div style={styles.page}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoMark}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 17l4-8 4 4 4-6 4 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={styles.logoText}>Lotus</span>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={styles.title}>포트폴리오 관리 시작하기</h1>
          <p style={styles.subtitle}>
            한국·미국 주식을 Lot 단위로<br />독립적으로 추적하세요
          </p>
        </div>

        {/* Feature bullets */}
        <div style={styles.features}>
          {FEATURES.map((f) => (
            <div key={f.label} style={styles.featureItem}>
              <div style={styles.featureDot} />
              <span style={styles.featureText}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>Google 계정으로 로그인</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <span>로그인에 실패했습니다. 다시 시도해 주세요.</span>
          </div>
        )}

        {/* Google Button */}
        <button onClick={handleLogin} style={styles.googleBtn}>
          <GoogleIcon />
          <span>Google로 계속하기</span>
        </button>

        <p style={styles.terms}>
          로그인 시 서비스 이용약관 및 개인정보처리방침에 동의합니다.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
    </svg>
  );
}

const FEATURES = [
  { label: 'Lot 단위 독립 수익률 계산' },
  { label: '한국·미국 통합 포트폴리오' },
  { label: '매도 전략 자동 부분 매도' },
  { label: '실현/미실현 수익 분리 추적' },
];

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'var(--bg-canvas)',
    position: 'relative',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'rgba(255, 107, 53, 0.08)',
    filter: 'blur(80px)',
    top: -100,
    right: -100,
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: '50%',
    background: 'rgba(251, 191, 36, 0.06)',
    filter: 'blur(80px)',
    bottom: -80,
    left: -80,
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 20,
    padding: '40px 44px',
    boxShadow: 'var(--shadow-xl)',
    width: '100%',
    maxWidth: 420,
    position: 'relative',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 28,
  },
  logoMark: {
    width: 44,
    height: 44,
    background: 'var(--color-orange-500)',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(255,107,53,0.3)',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--fg-primary)',
    letterSpacing: '-0.02em',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--fg-primary)',
    letterSpacing: '-0.02em',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--fg-secondary)',
    lineHeight: 1.6,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 24,
    padding: '16px 20px',
    background: 'var(--bg-muted)',
    borderRadius: 12,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--color-orange-500)',
    flexShrink: 0,
  },
  featureText: {
    fontSize: 13,
    color: 'var(--fg-secondary)',
    fontWeight: 500,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'var(--border-default)',
  },
  dividerText: {
    fontSize: 12,
    color: 'var(--fg-muted)',
    whiteSpace: 'nowrap',
  },
  errorBox: {
    background: 'var(--status-danger-bg)',
    border: '1px solid var(--color-red-200)',
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 16,
    fontSize: 13,
    color: 'var(--color-red-600)',
  },
  googleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '13px 20px',
    background: 'var(--fg-primary)',
    color: 'var(--fg-inverse)',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'opacity 150ms',
    marginBottom: 16,
  },
  terms: {
    fontSize: 11,
    color: 'var(--fg-muted)',
    textAlign: 'center',
    lineHeight: 1.6,
  },
};
