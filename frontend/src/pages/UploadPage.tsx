import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { parsePdf } from '../api/formulation';
import type { LipidValues } from '../types';

interface Props {
  onParsed: (data: LipidValues, file: File) => void;
}

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0D1117' }}>
      {/* 顶部 Logo + 标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06B6D4, #3B82F6)' }}>
            <span className="text-white text-lg font-bold">H</span>
          </div>
          <span className="text-white text-xl font-semibold tracking-wide">HWLL</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">智能配方系统</h1>
        <p style={{ color: '#8b949e' }} className="text-sm">脂肪谱精准解析 · 循证配方生成</p>
      </motion.div>

      {/* 上传区 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-lg"
      >
        <div
          {...getRootProps()}
          className="relative rounded-2xl p-10 text-center cursor-pointer transition-all duration-300"
          style={{
            background: isDragActive ? 'rgba(6,182,212,0.08)' : 'rgba(28,33,41,0.8)',
            border: `2px dashed ${isDragActive ? '#06B6D4' : status === 'error' ? '#ef4444' : '#30363d'}`,
            boxShadow: isDragActive ? '0 0 30px rgba(6,182,212,0.15)' : 'none',
          }}
        >
          <input {...getInputProps()} />

          <AnimatePresence mode="wait">
            {status === 'parsing' ? (
              <motion.div key="parsing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4">
                <div className="flex justify-center mb-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400 opacity-20 animate-ping" />
                    <div className="absolute inset-2 rounded-full border-2 border-cyan-400 animate-spin border-t-transparent" />
                    <div className="absolute inset-4 rounded-full" style={{ background: 'linear-gradient(135deg, #06B6D4, #3B82F6)', opacity: 0.6 }} />
                  </div>
                </div>
                <p className="text-cyan-400 font-medium">正在解析脂肪酸数值...</p>
                <p style={{ color: '#8b949e' }} className="text-sm mt-1">通常需要 3-5 秒</p>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4">
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                </div>
                <p className="text-white font-medium text-base mb-1">
                  {isDragActive ? '松开即可上传' : '拖拽或点击上传'}
                </p>
                <p style={{ color: '#8b949e' }} className="text-sm">脂肪谱检测报告 PDF</p>
                <p style={{ color: '#6e7681' }} className="text-xs mt-3">支持脂谱生物科技标准格式</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 错误提示 */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
            >
              ⚠ {errorMsg}
              <button
                className="ml-3 text-red-400 underline text-xs"
                onClick={(e) => { e.stopPropagation(); setStatus('idle'); }}
              >重试</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 步骤指引 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-8 mt-12"
        style={{ color: '#6e7681' }}
      >
        {['上传 PDF', '确认数值', '查看配方'].map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: i === 0 ? '#06B6D4' : '#21262d', color: i === 0 ? '#fff' : '#6e7681' }}>
              {i + 1}
            </span>
            <span style={{ color: i === 0 ? '#e6edf3' : '#6e7681' }}>{step}</span>
            {i < 2 && <span style={{ color: '#30363d' }}>→</span>}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
