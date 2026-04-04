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
    <div className="grid-bg min-h-screen relative flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{ paddingTop: '6vh', paddingBottom: '6vh' }}>

      {/* Ambient glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[360px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,229,255,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      {/* Ambient glow bottom-right */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(123,47,247,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="relative z-10 w-full max-w-2xl flex flex-col gap-0">

        {/* ── Logo + Title ── */}
        <motion.div
          initial={{ opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
          style={{ marginBottom: '40px' }}
        >
          {/* Logo mark — real HWLL seal, cyan-tinted */}
          <div className="flex items-center justify-center" style={{ marginBottom: '28px' }}>
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute rounded-full pulse-ring"
                style={{
                  inset: '-8px',
                  border: '1px solid rgba(0,229,255,0.18)',
                }} />
              {/* Logo container */}
              <div className="relative rounded-full flex items-center justify-center"
                style={{
                  width: '96px',
                  height: '96px',
                  background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, rgba(3,7,18,0.8) 70%)',
                  border: '1px solid rgba(0,229,255,0.25)',
                  boxShadow: '0 0 30px rgba(0,229,255,0.15)',
                }}>
                <img
                  src={LOGO_SRC}
                  alt="HWLL Logo"
                  className="flicker"
                  style={{
                    width: '76px',
                    height: '76px',
                    objectFit: 'contain',
                    /* Shift logo from brand red → electric cyan */
                    filter: 'brightness(0) saturate(100%) invert(1) sepia(1) saturate(4) hue-rotate(163deg) brightness(1.15)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sub-label */}
          <p className="font-body text-xs tracking-[0.42em] uppercase"
            style={{ color: 'var(--text-mid)', marginBottom: '14px' }}>
            Hopkins Washington Life Medicine Lab
          </p>

          {/* Main title */}
          <h1 className="font-title font-black tracking-widest text-glow-cyan"
            style={{ color: '#00E5FF', fontSize: '52px', lineHeight: 1.05, letterSpacing: '0.08em', marginBottom: '12px' }}>
            HWLL
          </h1>

          {/* Chinese title */}
          <h2 className="font-body font-semibold tracking-[0.3em]"
            style={{ color: 'var(--text-hi)', fontSize: '22px', marginBottom: '16px' }}>
            智能配方系统
          </h2>

          {/* Tagline */}
          <p className="font-body tracking-widest"
            style={{ color: 'var(--text-mid)', fontSize: '15px', letterSpacing: '0.2em' }}>
            脂肪谱精准解析&emsp;·&emsp;循证 AI 配方生成
          </p>
        </motion.div>

        {/* ── Upload Zone ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: '44px' }}
        >
          <AnimatePresence mode="wait">
            {status === 'parsing' ? (
              /* ─ Parsing state ─ */
              <motion.div
                key="parsing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative bracket rounded-2xl text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(123,47,247,0.09))',
                  border: '1px solid rgba(0,229,255,0.38)',
                  boxShadow: '0 0 50px rgba(0,229,255,0.14)',
                  padding: '60px 40px',
                }}
              >
                {/* Scan beam */}
                <div className="absolute inset-x-0 h-0.5 scan-beam pointer-events-none"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(0,229,255,0.85), transparent)' }} />

                <div className="flex justify-center" style={{ marginBottom: '28px' }}>
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full"
                      style={{ border: '1px solid rgba(0,229,255,0.15)', animation: 'pulse-ring 1.6s ease-in-out infinite' }} />
                    <div className="absolute inset-3 rounded-full border-2 border-t-transparent"
                      style={{ borderColor: '#00E5FF', animation: 'rotate-slow 1.2s linear infinite' }} />
                    <div className="absolute inset-6 rounded-full"
                      style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.55), rgba(123,47,247,0.35))' }} />
                  </div>
                </div>

                <p className="font-title font-semibold text-glow-cyan"
                  style={{ color: '#00E5FF', fontSize: '18px', letterSpacing: '0.12em', marginBottom: '10px' }}>
                  AI 解析中
                </p>
                <p className="font-data tracking-widest"
                  style={{ color: 'var(--text-mid)', fontSize: '12px', letterSpacing: '0.18em', marginBottom: '8px' }}>
                  EXTRACTING FATTY ACID PROFILE...
                </p>
                <p className="font-body" style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
                  通常需要 3 — 5 秒
                </p>
              </motion.div>
            ) : (
              /* ─ Idle / Error state ─ */
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  {...getRootProps()}
                  className="relative bracket rounded-2xl text-center cursor-pointer transition-all duration-500"
                  style={{
                    background: isDragActive
                      ? 'linear-gradient(135deg, rgba(0,229,255,0.11), rgba(123,47,247,0.13))'
                      : status === 'error'
                        ? 'rgba(255,45,85,0.04)'
                        : 'rgba(9,18,32,0.85)',
                    border: `1px solid ${
                      isDragActive  ? 'rgba(0,229,255,0.65)'
                      : status === 'error' ? 'rgba(255,45,85,0.5)'
                      : 'rgba(0,229,255,0.14)'
                    }`,
                    boxShadow: isDragActive
                      ? '0 0 60px rgba(0,229,255,0.22), inset 0 0 30px rgba(0,229,255,0.05)'
                      : '0 4px 40px rgba(0,0,0,0.45)',
                    /* ← 充足的内边距，确保 icon 动画不会超出 */
                    padding: '56px 40px 52px',
                  }}
                >
                  <input {...getInputProps()} />

                  {/* Drag scan beam */}
                  {isDragActive && (
                    <div className="absolute inset-x-0 h-0.5 scan-beam pointer-events-none"
                      style={{ background: 'linear-gradient(to right, transparent, rgba(0,229,255,0.9), transparent)' }} />
                  )}

                  {/* Upload icon — float DOWN so animation stays inside box */}
                  <div className="flex justify-center" style={{ marginBottom: '28px' }}>
                    <div className="float">
                      <div className="rounded-full flex items-center justify-center transition-all duration-400"
                        style={{
                          width: '88px',
                          height: '88px',
                          background: isDragActive ? 'rgba(0,229,255,0.16)' : 'rgba(0,229,255,0.07)',
                          border: `1px solid ${isDragActive ? 'rgba(0,229,255,0.55)' : 'rgba(0,229,255,0.22)'}`,
                          boxShadow: isDragActive ? '0 0 35px rgba(0,229,255,0.28)' : '0 0 16px rgba(0,229,255,0.08)',
                        }}>
                        <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
                          stroke={isDragActive ? '#00E5FF' : 'rgba(0,229,255,0.65)'}
                          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <p className="font-title font-semibold"
                    style={{
                      color: isDragActive ? '#00E5FF' : 'var(--text-hi)',
                      fontSize: '20px',
                      letterSpacing: '0.06em',
                      marginBottom: '12px',
                    }}>
                    {isDragActive ? '松开即可上传' : '上传检测报告'}
                  </p>
                  <p className="font-body" style={{ color: 'var(--text-mid)', fontSize: '15px', marginBottom: '10px' }}>
                    拖拽文件到此处，或点击选择
                  </p>
                  <p className="font-data tracking-wider" style={{ color: 'var(--text-dim)', fontSize: '12px', letterSpacing: '0.15em' }}>
                    PDF&emsp;·&emsp;脂谱生物科技标准格式
                  </p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between rounded-xl"
                      style={{
                        marginTop: '14px',
                        padding: '14px 20px',
                        background: 'rgba(255,45,85,0.08)',
                        border: '1px solid rgba(255,45,85,0.35)',
                        color: '#FF7096',
                        fontSize: '14px',
                      }}
                    >
                      <span className="font-body">⚠&ensp;{errorMsg}</span>
                      <button
                        className="font-title text-xs tracking-wider rounded-lg transition-all"
                        style={{
                          color: '#FF2D55',
                          border: '1px solid rgba(255,45,85,0.4)',
                          padding: '4px 12px',
                          background: 'rgba(255,45,85,0.08)',
                        }}
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center justify-center"
        >
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center" style={{ gap: '10px' }}>
                <div
                  className="rounded-full flex items-center justify-center font-title font-bold transition-all"
                  style={{
                    width: '38px',
                    height: '38px',
                    fontSize: '13px',
                    background: i === 0 ? 'rgba(0,229,255,0.14)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${i === 0 ? 'rgba(0,229,255,0.52)' : 'rgba(255,255,255,0.08)'}`,
                    color: i === 0 ? '#00E5FF' : 'var(--text-dim)',
                    boxShadow: i === 0 ? '0 0 18px rgba(0,229,255,0.28)' : 'none',
                  }}
                >
                  {i + 1}
                </div>
                <span className="font-body text-xs tracking-wider"
                  style={{
                    color: i === 0 ? 'var(--text-hi)' : 'var(--text-dim)',
                    letterSpacing: '0.13em',
                    fontSize: '13px',
                  }}>
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: '80px',
                  height: '1px',
                  margin: '0 12px',
                  marginBottom: '26px',
                  background: 'linear-gradient(to right, rgba(0,229,255,0.28), rgba(0,229,255,0.05))',
                }} />
              )}
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
