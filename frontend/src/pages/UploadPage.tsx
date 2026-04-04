import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { parsePdf } from '../api/formulation';
import type { LipidValues } from '../types';

interface Props {
  onParsed: (data: LipidValues, file: File) => void;
}

const STEPS = ['上传报告', '确认数值', '生成配方'];

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
    <div className="grid-bg min-h-screen relative flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
      {/* Ambient orb top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      {/* Ambient orb bottom-right */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(123,47,247,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <div className="relative z-10 w-full max-w-2xl">
        {/* ── Logo + System Name ── */}
        <motion.div
          initial={{ opacity: 0, y: -32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          {/* Logo mark */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              {/* outer ring */}
              <div className="w-20 h-20 rounded-full border border-cyan-400/20 absolute inset-0 pulse-ring"
                style={{ borderColor: 'rgba(0,229,255,0.2)' }} />
              {/* inner icon */}
              <div className="w-20 h-20 rounded-full flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(123,47,247,0.2))',
                  border: '1px solid rgba(0,229,255,0.35)',
                  boxShadow: '0 0 30px rgba(0,229,255,0.2), inset 0 0 20px rgba(0,229,255,0.05)',
                }}>
                <span className="font-title text-2xl font-bold flicker" style={{ color: '#00E5FF' }}>H</span>
              </div>
            </div>
          </div>

          <p className="font-body text-xs tracking-[0.4em] uppercase mb-3"
            style={{ color: 'var(--text-mid)' }}>
            Hopkins Washington Life Medicine Lab
          </p>
          <h1 className="font-title text-5xl font-black tracking-wider mb-3 text-glow-cyan"
            style={{ color: '#00E5FF', lineHeight: 1.1 }}>
            HWLL
          </h1>
          <h2 className="font-body text-2xl font-semibold mb-4 tracking-widest"
            style={{ color: 'var(--text-hi)', letterSpacing: '0.25em' }}>
            智能配方系统
          </h2>
          <p className="font-body text-base tracking-widest"
            style={{ color: 'var(--text-mid)' }}>
            脂肪谱精准解析&nbsp;&nbsp;·&nbsp;&nbsp;循证 AI 配方生成
          </p>
        </motion.div>

        {/* ── Upload Zone ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-12"
        >
          <AnimatePresence mode="wait">
            {status === 'parsing' ? (
              <motion.div
                key="parsing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative bracket overflow-hidden rounded-2xl py-20 px-8 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.05), rgba(123,47,247,0.08))',
                  border: '1px solid rgba(0,229,255,0.35)',
                  boxShadow: '0 0 40px rgba(0,229,255,0.15)',
                }}
              >
                {/* Scan beam */}
                <div className="absolute inset-x-0 h-0.5 scan-beam"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(0,229,255,0.8), transparent)' }} />

                <div className="flex justify-center mb-8">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20"
                      style={{ borderColor: 'rgba(0,229,255,0.2)', animation: 'pulse-ring 1.5s ease-in-out infinite' }} />
                    <div className="absolute inset-3 rounded-full border-2 border-t-transparent"
                      style={{ borderColor: '#00E5FF', animation: 'rotate-slow 1.5s linear infinite' }} />
                    <div className="absolute inset-7 rounded-full"
                      style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.6), rgba(123,47,247,0.4))' }} />
                  </div>
                </div>

                <p className="font-title text-lg font-semibold mb-3 text-glow-cyan" style={{ color: '#00E5FF' }}>
                  AI 解析中
                </p>
                <p className="font-data text-sm tracking-widest mb-1" style={{ color: 'var(--text-mid)' }}>
                  EXTRACTING FATTY ACID PROFILE...
                </p>
                <p className="font-body text-sm" style={{ color: 'var(--text-dim)' }}>
                  通常需要 3 — 5 秒
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  {...getRootProps()}
                  className="relative bracket overflow-hidden rounded-2xl py-20 px-8 text-center cursor-pointer transition-all duration-500"
                  style={{
                    background: isDragActive
                      ? 'linear-gradient(135deg, rgba(0,229,255,0.10), rgba(123,47,247,0.12))'
                      : status === 'error'
                        ? 'rgba(255,45,85,0.04)'
                        : 'rgba(9,18,32,0.8)',
                    border: `1px solid ${
                      isDragActive ? 'rgba(0,229,255,0.6)'
                      : status === 'error' ? 'rgba(255,45,85,0.5)'
                      : 'rgba(0,229,255,0.14)'
                    }`,
                    boxShadow: isDragActive
                      ? '0 0 50px rgba(0,229,255,0.20), inset 0 0 30px rgba(0,229,255,0.05)'
                      : '0 4px 40px rgba(0,0,0,0.4)',
                  }}
                >
                  <input {...getInputProps()} />

                  {/* Top scan beam on drag */}
                  {isDragActive && (
                    <div className="absolute inset-x-0 h-0.5 scan-beam"
                      style={{ background: 'linear-gradient(to right, transparent, rgba(0,229,255,0.9), transparent)' }} />
                  )}

                  {/* Upload icon */}
                  <div className="flex justify-center mb-8">
                    <div className="relative float">
                      <div className="w-24 h-24 rounded-full flex items-center justify-center"
                        style={{
                          background: isDragActive ? 'rgba(0,229,255,0.15)' : 'rgba(0,229,255,0.07)',
                          border: `1px solid ${isDragActive ? 'rgba(0,229,255,0.5)' : 'rgba(0,229,255,0.2)'}`,
                          boxShadow: isDragActive ? '0 0 30px rgba(0,229,255,0.25)' : 'none',
                          transition: 'all 0.4s ease',
                        }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                          stroke={isDragActive ? '#00E5FF' : 'rgba(0,229,255,0.6)'}
                          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <p className="font-title text-xl font-semibold mb-4"
                    style={{ color: isDragActive ? '#00E5FF' : 'var(--text-hi)', letterSpacing: '0.05em' }}>
                    {isDragActive ? '松开即可上传' : '上传检测报告'}
                  </p>
                  <p className="font-body text-base mb-2" style={{ color: 'var(--text-mid)' }}>
                    拖拽文件到此处，或点击选择
                  </p>
                  <p className="font-data text-xs tracking-wider" style={{ color: 'var(--text-dim)' }}>
                    PDF · 脂谱生物科技标准格式
                  </p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 px-5 py-4 rounded-xl text-sm flex items-center justify-between"
                      style={{
                        background: 'rgba(255,45,85,0.08)',
                        border: '1px solid rgba(255,45,85,0.35)',
                        color: '#FF7096',
                      }}
                    >
                      <span>⚠&ensp;{errorMsg}</span>
                      <button
                        className="font-title text-xs tracking-wider px-3 py-1 rounded-lg transition-all"
                        style={{ color: '#FF2D55', border: '1px solid rgba(255,45,85,0.4)' }}
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
          transition={{ delay: 0.55, duration: 0.5 }}
          className="flex items-center justify-center gap-0"
        >
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-title text-sm font-bold transition-all"
                  style={{
                    background: i === 0 ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${i === 0 ? 'rgba(0,229,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: i === 0 ? '#00E5FF' : 'var(--text-dim)',
                    boxShadow: i === 0 ? '0 0 16px rgba(0,229,255,0.25)' : 'none',
                  }}
                >
                  {i + 1}
                </div>
                <span className="font-body text-xs tracking-wider"
                  style={{ color: i === 0 ? 'var(--text-hi)' : 'var(--text-dim)', letterSpacing: '0.12em' }}>
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-20 h-px mx-3 mb-6"
                  style={{ background: 'linear-gradient(to right, rgba(0,229,255,0.3), rgba(0,229,255,0.06))' }} />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
