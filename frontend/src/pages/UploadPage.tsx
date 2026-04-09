import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { parsePdf } from '../api/formulation';
import type { LipidValues } from '../types';

interface Props {
  onParsed: (data: LipidValues, file: File) => void;
  onGeneric?: () => void;
}

const STEPS = ['上传报告', '确认数值', '生成配方'];
const LOGO_SRC = `${import.meta.env.BASE_URL}hwll-logo.png`;

const PARSE_STAGES = [
  { pct: 12,  text: '正在读取 PDF 文档...' },
  { pct: 28,  text: '识别脂肪酸指标...' },
  { pct: 48,  text: '解析检测数值与状态...' },
  { pct: 68,  text: '核对参考区间...' },
  { pct: 88,  text: '准备分析报告...' },
  { pct: 95,  text: '等待服务器响应...' },
  { pct: 98,  text: '服务器首次启动中，请稍候...' },
];
const STAGE_TIMES = [800, 2200, 4000, 6000, 8000, 15000, 30000]; // ms thresholds
const MIN_PARSE_MS = 8000;

function useParseProgress(isParsing: boolean) {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isParsing) { setProgress(0); setStageText(''); return; }

    const start = performance.now();
    setStageText(PARSE_STAGES[0].text);
    const lastStageTime = STAGE_TIMES[STAGE_TIMES.length - 1];

    function tick(now: number) {
      const elapsed = now - start;
      let idx = 0;
      for (let i = 0; i < STAGE_TIMES.length; i++) {
        if (elapsed < STAGE_TIMES[i]) { idx = i; break; }
        idx = i;
      }

      const stage = PARSE_STAGES[idx];
      const prevTime = idx > 0 ? STAGE_TIMES[idx - 1] : 0;
      const prevPct = idx > 0 ? PARSE_STAGES[idx - 1].pct : 0;
      const segDuration = STAGE_TIMES[idx] - prevTime;
      const segElapsed = Math.min(elapsed - prevTime, segDuration);
      const segProgress = segElapsed / segDuration;
      const eased = 1 - Math.pow(1 - segProgress, 2);
      let pct = prevPct + (stage.pct - prevPct) * eased;

      // Past last stage: creep slowly toward 99%, never reach 100%
      if (elapsed >= lastStageTime) {
        const extra = (elapsed - lastStageTime) / 60000; // 0→1 over 60s
        pct = 98 + Math.min(extra, 0.99);
        setStageText('服务器首次启动中，请稍候...');
      } else {
        setStageText(stage.text);
      }

      setProgress(Math.min(pct, 99));
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isParsing]);

  return { progress, stageText };
}

export default function UploadPage({ onParsed, onGeneric }: Props) {
  const [status, setStatus] = useState<'idle' | 'parsing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { progress, stageText } = useParseProgress(status === 'parsing');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setStatus('parsing');
    setErrorMsg('');
    try {
      const [data] = await Promise.all([
        parsePdf(file),
        new Promise(r => setTimeout(r, MIN_PARSE_MS)),
      ]);
      // Brief pause at 100% for satisfaction
      await new Promise(r => setTimeout(r, 300));
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
      className="grid-bg min-h-screen relative flex flex-col items-center justify-center overflow-hidden"
      style={{ padding: '3vh max(24px, 5vw)', background: '#F8FAFC' }}
    >
      {/* Ambient glows — softened for light theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: 600, height: 280, background: 'radial-gradient(ellipse, rgba(13,148,136,0.06) 0%, transparent 70%)', filter: 'blur(48px)' }} />
      <div className="absolute bottom-0 right-0 pointer-events-none"
        style={{ width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)', filter: 'blur(56px)' }} />

      {/* ─── Main Column ─── */}
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
              <div className="relative rounded-full flex items-center justify-center"
                style={{
                  width: 90, height: 90,
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.10)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}>
                <img
                  src={LOGO_SRC}
                  alt="HWLL"
                  style={{ width: 82, height: 82, objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>

          <p className="font-data uppercase px-2"
            style={{ color: 'var(--text-mid)', fontSize: 10, letterSpacing: '0.22em', marginBottom: 10 }}>
            Hopkins Washington Life Medicine Lab
          </p>

          <h1 className="font-title font-black"
            style={{ color: '#0D9488', fontSize: 'clamp(36px, 10vw, 46px)', lineHeight: 1.0, letterSpacing: '0.08em', marginBottom: 8 }}>
            HWLL
          </h1>

          <h2 className="font-body font-semibold"
            style={{ color: 'var(--text-hi)', fontSize: 'clamp(15px, 4.5vw, 19px)', letterSpacing: '0.22em', marginBottom: 10 }}>
            智能配方系统
          </h2>

          <p className="font-body"
            style={{ color: 'var(--text-mid)', fontSize: 13, letterSpacing: '0.10em' }}>
            脂肪谱精准解析&nbsp;·&nbsp;循证 AI 配方生成
          </p>
        </motion.div>

        {/* ── Upload Zone / Progress ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="upload-zone-mobile-indent"
          style={{ width: '100%', marginBottom: 28 }}
        >
          <AnimatePresence mode="wait">
            {status === 'parsing' ? (
              /* ─ Parsing Progress ─ */
              <motion.div
                key="parsing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="relative rounded-2xl"
                style={{
                  padding: '44px 36px',
                  background: 'rgba(13,148,136,0.04)',
                  border: '1px solid rgba(13,148,136,0.3)',
                  boxShadow: '0 2px 16px rgba(13,148,136,0.08)',
                }}
              >
                {/* Percentage */}
                <div className="flex justify-between items-baseline mb-4">
                  <p className="font-title font-semibold"
                    style={{ color: '#0D9488', fontSize: 16, letterSpacing: '0.12em' }}>
                    AI 解析中
                  </p>
                  <span className="font-data text-xl font-bold" style={{ color: '#0D9488' }}>
                    {Math.round(progress)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="relative rounded-full overflow-hidden" style={{ height: 10, background: 'rgba(13,148,136,0.08)' }}>
                  <div
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(to right, #0D9488, #6366F1)',
                      boxShadow: '0 0 8px rgba(13,148,136,0.3)',
                    }}
                  />
                </div>

                {/* Stage text */}
                <p className="font-body mt-5" style={{ color: 'var(--text-mid)', fontSize: 14, letterSpacing: '0.06em' }}>
                  {stageText}
                </p>
                <p className="font-data mt-2" style={{ color: 'var(--text-dim)', fontSize: 11, letterSpacing: '0.18em' }}>
                  EXTRACTING FATTY ACID PROFILE...
                </p>
              </motion.div>
            ) : (
              /* ─ Idle ─ */
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  {...getRootProps()}
                  className="relative rounded-2xl text-center cursor-pointer transition-all duration-500"
                  style={{
                    padding: '46px 36px 42px',
                    background: isDragActive
                      ? 'rgba(13,148,136,0.04)'
                      : status === 'error'
                        ? 'rgba(220,38,38,0.06)'
                        : '#FFFFFF',
                    border: `1px solid ${isDragActive ? 'rgba(13,148,136,0.5)' : status === 'error' ? 'rgba(220,38,38,0.4)' : 'rgba(0,0,0,0.08)'}`,
                    boxShadow: isDragActive
                      ? '0 2px 24px rgba(13,148,136,0.12), inset 0 0 16px rgba(13,148,136,0.03)'
                      : '0 2px 16px rgba(0,0,0,0.06)',
                  }}
                >
                  <input {...getInputProps()} />

                  {/* Icon */}
                  <div className="flex justify-center" style={{ marginBottom: 20 }}>
                    <div className="float">
                      <div className="rounded-full flex items-center justify-center transition-all duration-400"
                        style={{
                          width: 72, height: 72,
                          background: isDragActive ? 'rgba(13,148,136,0.12)' : 'rgba(13,148,136,0.06)',
                          border: `1px solid ${isDragActive ? 'rgba(13,148,136,0.45)' : 'rgba(13,148,136,0.18)'}`,
                          boxShadow: isDragActive ? '0 2px 16px rgba(13,148,136,0.15)' : '0 1px 8px rgba(13,148,136,0.06)',
                        }}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                          stroke={isDragActive ? '#0D9488' : 'rgba(13,148,136,0.6)'}
                          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <p className="font-title font-semibold"
                    style={{ color: isDragActive ? '#0D9488' : 'var(--text-hi)', fontSize: 17, letterSpacing: '0.06em', marginBottom: 9 }}>
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
                        background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.25)',
                        color: '#F87171', fontSize: 13,
                      }}
                    >
                      <span className="font-body">{errorMsg}</span>
                      <button
                        className="font-title text-xs tracking-wider rounded-lg"
                        style={{ color: '#DC2626', border: '1px solid rgba(220,38,38,0.3)', padding: '3px 10px', background: 'rgba(220,38,38,0.06)' }}
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
                    background: i === 0 ? 'rgba(13,148,136,0.10)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${i === 0 ? 'rgba(13,148,136,0.4)' : 'rgba(0,0,0,0.08)'}`,
                    color: i === 0 ? '#0D9488' : 'var(--text-dim)',
                    boxShadow: i === 0 ? '0 1px 8px rgba(13,148,136,0.15)' : 'none',
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
                  background: 'linear-gradient(to right, rgba(13,148,136,0.2), rgba(13,148,136,0.05))',
                }} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Generic package entry */}
        {onGeneric && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <div className="h-px mb-4 mx-12" style={{ background: 'linear-gradient(to right, transparent, rgba(22,163,74,0.15), transparent)' }} />
            <button
              onClick={onGeneric}
              className="font-body text-sm transition-all"
              style={{ color: 'var(--text-dim)', letterSpacing: '0.06em' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#16A34A'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'; }}
            >
              没有脂肪谱报告？→ <span style={{ textDecoration: 'underline' }}>使用通用健康套餐</span>
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
