import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import UploadPage from './pages/UploadPage';
import ReviewPage from './pages/ReviewPage';
import ReportPage from './pages/ReportPage';
import GenericInputPage from './pages/GenericInputPage';
import { generatePlan, generateGenericPlan } from './api/formulation';
import type { LipidValues, PatientInfo, FormulationResult } from './types';
import './index.css';

type Step = 'upload' | 'review' | 'generating' | 'report' | 'generic-input';

const PAGE_TRANSITION = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.3 },
};

const LOGO_SRC = `${import.meta.env.BASE_URL}hwll-logo.png`;

const GEN_STAGES = [
  { pct: 18,  text: '分析脂肪酸失衡模式...' },
  { pct: 40,  text: '检索循证医学数据库...' },
  { pct: 62,  text: '构建五维干预方案...' },
  { pct: 82,  text: '计算个性化产品剂量...' },
  { pct: 100, text: '生成临床配方报告...' },
];
const GEN_TIMES = [1000, 2400, 3800, 5000, 6000];
const MIN_GENERATE_MS = 6000;

function useGenProgress(isGenerating: boolean) {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isGenerating) { setProgress(0); setStageText(''); return; }
    const start = performance.now();
    setStageText(GEN_STAGES[0].text);

    function tick(now: number) {
      const elapsed = now - start;
      let idx = 0;
      for (let i = 0; i < GEN_TIMES.length; i++) {
        if (elapsed < GEN_TIMES[i]) { idx = i; break; }
        idx = i;
      }
      const stage = GEN_STAGES[idx];
      const prevTime = idx > 0 ? GEN_TIMES[idx - 1] : 0;
      const prevPct = idx > 0 ? GEN_STAGES[idx - 1].pct : 0;
      const segDur = GEN_TIMES[idx] - prevTime;
      const segElapsed = Math.min(elapsed - prevTime, segDur);
      const eased = 1 - Math.pow(1 - segElapsed / segDur, 2);
      setProgress(Math.min(prevPct + (stage.pct - prevPct) * eased, 100));
      setStageText(stage.text);

      if (elapsed < MIN_GENERATE_MS) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setStageText(GEN_STAGES[GEN_STAGES.length - 1].text);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isGenerating]);

  return { progress, stageText };
}

export default function App() {
  const [step, setStep] = useState<Step>('upload');
  const [lipidValues, setLipidValues] = useState<LipidValues | null>(null);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<FormulationResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const { progress, stageText } = useGenProgress(step === 'generating');

  const handleParsed = (data: LipidValues, file: File) => {
    setLipidValues(data);
    setFileName(file.name);
    setStep('review');
  };

  const handleGenerate = async (values: LipidValues, patientInfo: Partial<PatientInfo>) => {
    setGenerating(true);
    setGenError('');
    setStep('generating');
    try {
      const [plan] = await Promise.all([
        generatePlan(values, patientInfo),
        new Promise(r => setTimeout(r, MIN_GENERATE_MS)),
      ]);
      setResult(plan);
      // Brief pause at 100% for satisfaction
      await new Promise(r => setTimeout(r, 400));
      setStep('report');
    } catch (e: any) {
      setGenError(e.message || '配方生成失败，请重试');
      setStep('review');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenericGenerate = async (
    patientInfo: { name: string; age: string; gender: string; diagnosis: string; medications: string },
    basicLipids?: { total_cholesterol?: number; ldl_c?: number; triglyceride?: number; hdl_c?: number }
  ) => {
    setGenerating(true);
    setGenError('');
    setStep('generating');
    try {
      const [plan] = await Promise.all([
        generateGenericPlan(patientInfo, basicLipids),
        new Promise(r => setTimeout(r, MIN_GENERATE_MS)),
      ]);
      setResult(plan);
      await new Promise(r => setTimeout(r, 400));
      setStep('report');
    } catch (e: any) {
      setGenError(e.message || '通用套餐生成失败，请重试');
      setStep('generic-input');
    } finally {
      setGenerating(false);
    }
  };

  const handleRestart = () => {
    setStep('upload');
    setLipidValues(null);
    setResult(null);
    setGenError('');
  };

  return (
    <AnimatePresence mode="wait">
      {step === 'upload' && (
        <motion.div key="upload" {...PAGE_TRANSITION}>
          <UploadPage onParsed={handleParsed} onGeneric={() => setStep('generic-input')} />
        </motion.div>
      )}
      {step === 'generic-input' && (
        <motion.div key="generic" {...PAGE_TRANSITION}>
          <GenericInputPage
            onGenerate={handleGenericGenerate}
            onBack={handleRestart}
            generating={generating}
          />
          {genError && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#DC2626' }}>
              {genError}
            </div>
          )}
        </motion.div>
      )}
      {step === 'review' && lipidValues && (
        <motion.div key="review" {...PAGE_TRANSITION}>
          <ReviewPage
            lipidValues={lipidValues}
            fileName={fileName}
            onGenerate={handleGenerate}
            onBack={handleRestart}
            generating={generating}
          />
          {genError && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#DC2626' }}>
              {genError}
            </div>
          )}
        </motion.div>
      )}
      {step === 'generating' && (
        <motion.div key="generating" {...PAGE_TRANSITION}>
          <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden"
            style={{ padding: '3vh max(24px, 5vw)', background: '#FFFFFF' }}>

            <div className="relative z-10 flex flex-col items-center" style={{ width: '100%', maxWidth: 480 }}>
              {/* Logo */}
              <div className="mb-8">
                <div className="relative rounded-full flex items-center justify-center"
                  style={{
                    width: 72, height: 72,
                    background: 'radial-gradient(circle, rgba(235,28,40,0.05) 0%, #F8FAFC 70%)',
                    border: '1px solid rgba(235,28,40,0.15)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  }}>
                  <img src={LOGO_SRC} alt="HWLL" style={{ width: 64, height: 64, objectFit: 'contain' }} />
                </div>
              </div>

              {/* Title */}
              <h2 className="font-title text-xl font-bold tracking-widest mb-3"
                style={{ color: '#0D9488', letterSpacing: '0.15em' }}>
                配方生成中
              </h2>

              {/* Percentage */}
              <p className="font-data text-4xl font-bold mb-6"
                style={{ color: '#0D9488' }}>
                {Math.round(progress)}%
              </p>

              {/* Progress bar */}
              <div className="w-full relative rounded-full overflow-hidden mb-6"
                style={{ height: 10, background: 'rgba(13,148,136,0.1)' }}>
                <div
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(to right, #6366F1, #0D9488)',
                    boxShadow: '0 1px 4px rgba(13,148,136,0.3)',
                  }}
                />
              </div>

              {/* Stage text */}
              <p className="font-body text-base mb-2" style={{ color: '#64748B', letterSpacing: '0.06em' }}>
                {stageText}
              </p>
              <p className="font-data text-xs" style={{ color: '#94A3B8', letterSpacing: '0.18em' }}>
                EVIDENCE-BASED AI FORMULATION ENGINE
              </p>
            </div>
          </div>
        </motion.div>
      )}
      {step === 'report' && result && (
        <motion.div key="report" {...PAGE_TRANSITION}>
          <ReportPage result={result} onRestart={handleRestart} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
