import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { parsePdf } from '../api/formulation';
import type { LipidValues } from '../types';

interface Props {
  onParsed: (data: LipidValues, file: File) => void;
}

const STEPS = ['上传报告', '确认数值', '生成配方'];
const LOGO_SRC = `${import.meta.env.BASE_URL}hwll-logo.png`;

export default function UploadPage({ onParsed }: Props) {
  const [status, setStatus] = useState<'idle' | 'parsing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setStatus('parsing');
    setErrorMsg('');
    try {
      const data = await parsePdf(file);
      onParsed(data, file);
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || '解析失败，请检查文件格式');
    }
  }, [onParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: status === 'parsing',
  });

  return (
    <div
      className="grid-bg min-h-screen relative flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden"
      style={{ paddingTop: '3vh', paddingBottom: '3vh' }}
    >
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: 600, height: 280, background: 'radial-gradient(ellipse, rgba(0,229,255,0.07) 0%, transparent 70%)', filter: 'blur(48px)' }} />
      <div className="absolute bottom-0 right-0 pointer-events-none"
        style={{ width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(123,47,247,0.06) 0%, transparent 70%)', filter: 'blur(56px)' }} />

      {/* ─── Main Column — max-w-lg keeps everything tight ─── */}
      <div className="relative z-10 flex flex-col items-center" style={{ width: '100%', maxWidth: 520 }}>

        {/* ── Logo + Title block ── */}
        <motion.div
          initial={{ opacity: 0, y: -22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
          style={{ marginBottom: 28 }}
        >
          {/* Logo mark */}
          <div className="flex items-center justify-center" style={{ marginBottom: 18 }}>
            <div className="relative">
              {/* Pulse ring */}
              <div className="absolute rounded-full pulse-ring pointer-events-none"
                style={{ inset: -7, border: '1px solid rgba(0,229,255,0.16)' }} />
              {/* Container */}
              <div className="relative rounded-full flex items-center justify-center"
                style={{
                  width: 90, height: 90,
                  background: 'radial-gradient(circle, rgba(235,28,40,0.07) 0%, rgba(3,7,18,0.85) 70%)',
                  border: '1px solid rgba(235,28,40,0.30)',
                  boxShadow: '0 0 28px rgba(235,28,40,0.18), 0 0 60px rgba(235,28,40,0.06)',
                }}>
                {/* Logo — original red, no filter */}
                <img
                  src={LOGO_SRC}
                  alt="HWLL"
                  className="flicker"
                  style={{ width: 82, height: 82, objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>

          {/* Sub-label */}
          <p className="font-data uppercase px-2"
            style={{ color: 'var(--text-mid)', fontSize: 10, letterSpacing: '0.22em', marginBottom: 10 }}>
            Hopkins Washington Life Medicine Lab
          </p>

          {/* HWLL wordmark */}
          <h1 className="font-title font-black text-glow-cyan"
            style={{ color: '#00E5FF', fontSize: 'clamp(36px, 10vw, 46px)', lineHeight: 1.0, letterSpacing: '0.08em', marginBottom: 8 }}>
            HWLL
          </h1>

          {/* Chinese subtitle */}
          <h2 className="font-body font-semibold"
            style={{ color: 'var(--text-hi)', fontSize: 'clamp(15px, 4.5vw, 19px)', letterSpacing: '0.22em', marginBottom: 10 }}>
            智能配方系统
          </h2>

          {/* Tagline */}
          <p className="font-body"
            style={{ color: 'var(--text-mid)', fontSize: 13, letterSpacing: '0.10em' }}>
            脂肪谱精准解析&nbsp;·&nbsp;循证 AI 配方生成
          </p>
        </motion.div>

        {/* ── Upload Zone — 480px wide, ~296px tall (golden ratio ≈ 1.62) ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="px-3 sm:px-0"
          style={{ width: '100%', marginBottom: 28 }}
        >
          <AnimatePresence mode="wait">
            {status === 'parsing' ? (
              /* ─ Parsing ─ */
              <motion.div
                key="parsing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="relative bracket rounded-2xl text-center"
                style={{
                  padding: '44px 36px',
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(123,47,247,0.09))',
                  border: '1px solid rgba(0,229,255,0.38)',
                  boxShadow: '0 0 44px rgba(0,229,255,0.13)',
                }}
              >
                <div className="absolute inset-x-0 h-0.5 scan-beam pointer-events-none"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(0,229,255,0.85), transparent)' }} />

                <div className="flex justify-center" style={{ marginBottom: 20 }}>
                  <div className="relative" style={{ width: 64, height: 64 }}>
                    <div className="absolute inset-0 rounded-full"
                      style={{ border: '1px solid rgba(0,229,255,0.15)', animation: 'pulse-ring 1.6s ease-in-out infinite' }} />
                    <div className="absolute inset-2.5 rounded-full border-2 border-t-transparent"
                      style={{ borderColor: '#00E5FF', animation: 'rotate-slow 1.2s linear infinite' }} />
                    <div className="absolute inset-5 rounded-full"
                      style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.55), rgba(123,47,247,0.35))' }} />
                  </div>
                </div>
                <p className="font-title font-semibold text-glow-cyan"
                  style={{ color: '#00E5FF', fontSize: 16, letterSpacing: '0.12em', marginBottom: 8 }}>
                  AI 解析中
                </p>
                <p className="font-data" style={{ color: 'var(--text-mid)', fontSize: 11, letterSpacing: '0.18em', marginBottom: 6 }}>
                  EXTRACTING FATTY ACID PROFILE...
                </p>
                <p className="font-body" style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                  通常需要 3 — 5 秒
                </p>
              </motion.div>
            ) : (
              /* ─ Idle ─ */
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  {...getRootProps()}
                  className="relative bracket rounded-2xl text-center cursor-pointer transition-all duration-500"
                  style={{
                    /*
                      黄金比例：容器宽 480px（max-w 520px 减去 padding）
                      内容高 ~180px + 上下 padding 58px×2 ≈ 296px
                      480 / 296 ≈ 1.62 ✓
                    */
                    padding: '46px 36px 42px',
                    background: isDragActive
                      ? 'linear-gradient(135deg, rgba(0,229,255,0.10), rgba(123,47,247,0.12))'
                      : status === 'error'
                        ? 'rgba(255,45,85,0.04)'
                        : 'rgba(9,18,32,0.88)',
                    border: `1px solid ${isDragActive ? 'rgba(0,229,255,0.65)' : status === 'error' ? 'rgba(255,45,85,0.5)' : 'rgba(0,229,255,0.14)'}`,
                    boxShadow: isDragActive
                      ? '0 0 55px rgba(0,229,255,0.20), inset 0 0 28px rgba(0,229,255,0.05)'
                      : '0 4px 36px rgba(0,0,0,0.42)',
                  }}
                >
                  <input {...getInputProps()} />

                  {isDragActive && (
                    <div className="absolute inset-x-0 h-0.5 scan-beam pointer-events-none"
                      style={{ background: 'linear-gradient(to right, transparent, rgba(0,229,255,0.9), transparent)' }} />
                  )}

                  {/* Icon */}
                  <div className="flex justify-center" style={{ marginBottom: 20 }}>
                    <div className="float">
                      <div className="rounded-full flex items-center justify-center transition-all duration-400"
                        style={{
                          width: 72, height: 72,
                          background: isDragActive ? 'rgba(0,229,255,0.15)' : 'rgba(0,229,255,0.07)',
                          border: `1px solid ${isDragActive ? 'rgba(0,229,255,0.55)' : 'rgba(0,229,255,0.22)'}`,
                          boxShadow: isDragActive ? '0 0 30px rgba(0,229,255,0.28)' : '0 0 14px rgba(0,229,255,0.07)',
                        }}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                          stroke={isDragActive ? '#00E5FF' : 'rgba(0,229,255,0.6)'}
                          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <p className="font-title font-semibold"
                    style={{ color: isDragActive ? '#00E5FF' : 'var(--text-hi)', fontSize: 17, letterSpacing: '0.06em', marginBottom: 9 }}>
                    {isDragActive ? '松开即可上传' : '上传检测报告'}
                  </p>
                  <p className="font-body" style={{ color: 'var(--text-mid)', fontSize: 14, marginBottom: 7 }}>
                    拖拽文件到此处，或点击选择
                  </p>
                  <p className="font-data" style={{ color: 'var(--text-dim)', fontSize: 11, letterSpacing: '0.14em' }}>
                    PDF&emsp;·&emsp;脂谱生物科技标准格式
                  </p>
                </div>

                <AnimatePresence>
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-between rounded-xl"
                      style={{
                        marginTop: 10, padding: '12px 18px',
                        background: 'rgba(255,45,85,0.08)', border: '1px solid rgba(255,45,85,0.35)',
                        color: '#FF7096', fontSize: 13,
                      }}
                    >
                      <span className="font-body">⚠&ensp;{errorMsg}</span>
                      <button
                        className="font-title text-xs tracking-wider rounded-lg"
                        style={{ color: '#FF2D55', border: '1px solid rgba(255,45,85,0.4)', padding: '3px 10px', background: 'rgba(255,45,85,0.08)' }}
                        onClick={e => { e.stopPropagation(); setStatus('idle'); }}
                      >重试</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Step Indicator ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.45 }}
          className="flex items-center justify-center"
        >
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center" style={{ gap: 8 }}>
                <div className="rounded-full flex items-center justify-center font-title font-bold"
                  style={{
                    width: 32, height: 32, fontSize: 12,
                    background: i === 0 ? 'rgba(0,229,255,0.13)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${i === 0 ? 'rgba(0,229,255,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    color: i === 0 ? '#00E5FF' : 'var(--text-dim)',
                    boxShadow: i === 0 ? '0 0 14px rgba(0,229,255,0.25)' : 'none',
                  }}>
                  {i + 1}
                </div>
                <span className="font-body"
                  style={{ color: i === 0 ? 'var(--text-hi)' : 'var(--text-dim)', fontSize: 12, letterSpacing: '0.12em' }}>
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 'clamp(32px, 10vw, 70px)', height: 1,
                  margin: '0 8px', marginBottom: 22,
                  background: 'linear-gradient(to right, rgba(0,229,255,0.25), rgba(0,229,255,0.04))',
                }} />
              )}
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
