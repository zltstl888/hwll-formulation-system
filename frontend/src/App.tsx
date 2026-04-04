import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import UploadPage from './pages/UploadPage';
import ReviewPage from './pages/ReviewPage';
import ReportPage from './pages/ReportPage';
import { generatePlan } from './api/formulation';
import type { LipidValues, PatientInfo, FormulationResult } from './types';
import './index.css';

type Step = 'upload' | 'review' | 'report';

const PAGE_TRANSITION = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.3 },
};

export default function App() {
  const [step, setStep] = useState<Step>('upload');
  const [lipidValues, setLipidValues] = useState<LipidValues | null>(null);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<FormulationResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const handleParsed = (data: LipidValues, file: File) => {
    setLipidValues(data);
    setFileName(file.name);
    setStep('review');
  };

  const handleGenerate = async (values: LipidValues, patientInfo: Partial<PatientInfo>) => {
    setGenerating(true);
    setGenError('');
    try {
      const plan = await generatePlan(values, patientInfo);
      setResult(plan);
      setStep('report');
    } catch (e: any) {
      setGenError(e.message || '配方生成失败，请重试');
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
          <UploadPage onParsed={handleParsed} />
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
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5' }}>
              ⚠ {genError}
            </div>
          )}
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
