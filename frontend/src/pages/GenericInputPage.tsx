import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onGenerate: (
    patientInfo: { name: string; age: string; gender: string; diagnosis: string; medications: string },
    basicLipids: { total_cholesterol?: number; ldl_c?: number; triglyceride?: number; hdl_c?: number }
  ) => void;
  onBack: () => void;
  generating: boolean;
}

const LOGO_SRC = `${import.meta.env.BASE_URL}hwll-logo.png`;

export default function GenericInputPage({ onGenerate, onBack, generating }: Props) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState('');
  const [tc, setTc] = useState('');
  const [ldl, setLdl] = useState('');
  const [tg, setTg] = useState('');
  const [hdl, setHdl] = useState('');

  const handleSubmit = () => {
    const basicLipids: any = {};
    if (tc) basicLipids.total_cholesterol = parseFloat(tc);
    if (ldl) basicLipids.ldl_c = parseFloat(ldl);
    if (tg) basicLipids.triglyceride = parseFloat(tg);
    if (hdl) basicLipids.hdl_c = parseFloat(hdl);
    onGenerate(
      { name: name || '未命名患者', age, gender, diagnosis, medications },
      Object.keys(basicLipids).length > 0 ? basicLipids : undefined as any
    );
  };

  const inputStyle = {
    background: 'rgba(3,7,18,0.7)',
    border: '1px solid rgba(0,229,255,0.15)',
    color: 'var(--text-hi)',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
  };

  const labelStyle = {
    color: 'var(--text-dim)',
    fontSize: 11,
    letterSpacing: '0.12em',
    marginBottom: 4,
    display: 'block' as const,
  };

  return (
    <div className="grid-bg min-h-screen relative flex flex-col items-center justify-center overflow-hidden"
      style={{ padding: '3vh max(24px, 5vw)' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: 600, height: 280, background: 'radial-gradient(ellipse, rgba(0,255,148,0.06) 0%, transparent 70%)', filter: 'blur(48px)' }} />

      <div className="relative z-10 flex flex-col items-center" style={{ width: '100%', maxWidth: 520 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="relative rounded-full flex items-center justify-center"
              style={{ width: 64, height: 64, background: 'radial-gradient(circle, rgba(235,28,40,0.07) 0%, rgba(3,7,18,0.85) 70%)', border: '1px solid rgba(235,28,40,0.25)' }}>
              <img src={LOGO_SRC} alt="HWLL" style={{ width: 56, height: 56, objectFit: 'contain' }} />
            </div>
          </div>
          <h2 className="font-title text-xl font-bold tracking-wider" style={{ color: '#00FF94', letterSpacing: '0.12em' }}>
            通用健康套餐
          </h2>
          <p className="font-body text-sm mt-1" style={{ color: 'var(--text-mid)' }}>
            基于常规体检数据的基础营养支持方案
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="w-full rounded-2xl overflow-hidden"
          style={{ background: 'rgba(9,18,32,0.92)', border: '1px solid rgba(0,255,148,0.12)' }}
        >
          {/* Patient info section */}
          <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(0,255,148,0.08)' }}>
            <p className="font-data text-xs tracking-widest mb-4" style={{ color: 'rgba(0,255,148,0.6)', letterSpacing: '0.15em' }}>
              患者基本信息
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="font-data" style={labelStyle}>姓名</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="选填" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,255,148,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,229,255,0.15)'} />
              </div>
              <div>
                <label className="font-data" style={labelStyle}>年龄</label>
                <input value={age} onChange={e => setAge(e.target.value)} placeholder="选填" type="number" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,255,148,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,229,255,0.15)'} />
              </div>
            </div>
            <div className="mb-3">
              <label className="font-data" style={labelStyle}>性别</label>
              <div className="flex gap-2">
                {[{ v: 'male', l: '男' }, { v: 'female', l: '女' }].map(g => (
                  <button key={g.v} onClick={() => setGender(g.v)}
                    className="flex-1 py-2 rounded-lg font-body text-sm transition-all"
                    style={{
                      background: gender === g.v ? 'rgba(0,255,148,0.1)' : 'rgba(3,7,18,0.5)',
                      border: `1px solid ${gender === g.v ? 'rgba(0,255,148,0.4)' : 'rgba(0,229,255,0.1)'}`,
                      color: gender === g.v ? '#00FF94' : 'var(--text-dim)',
                    }}>{g.l}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="font-data" style={labelStyle}>诊断/病史（选填，用于条件性产品推荐）</label>
                <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
                  placeholder="如：肿瘤术后、桥本甲状腺炎、鼻炎..."
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,255,148,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,229,255,0.15)'} />
              </div>
              <div>
                <label className="font-data" style={labelStyle}>当前用药（选填，用于禁忌筛查）</label>
                <input value={medications} onChange={e => setMedications(e.target.value)}
                  placeholder="如：阿司匹林、他汀类..."
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,255,148,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,229,255,0.15)'} />
              </div>
            </div>
          </div>

          {/* Blood lipid section */}
          <div className="px-6 py-5">
            <p className="font-data text-xs tracking-widest mb-1" style={{ color: 'rgba(0,229,255,0.6)', letterSpacing: '0.15em' }}>
              常规血脂数据（选填）
            </p>
            <p className="font-body text-xs mb-4" style={{ color: 'var(--text-dim)' }}>
              如有体检报告血脂数据，填入可触发额外产品推荐
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'TC 总胆固醇', value: tc, set: setTc, unit: 'mmol/L' },
                { label: 'LDL-C 低密度', value: ldl, set: setLdl, unit: 'mmol/L' },
                { label: 'TG 甘油三酯', value: tg, set: setTg, unit: 'mmol/L' },
                { label: 'HDL-C 高密度', value: hdl, set: setHdl, unit: 'mmol/L' },
              ].map(f => (
                <div key={f.label}>
                  <label className="font-data" style={labelStyle}>{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)}
                    placeholder={f.unit} type="number" step="0.01" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(0,229,255,0.15)'} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex gap-3 mt-5 w-full">
          <button onClick={onBack}
            className="flex-none px-5 py-3 rounded-xl font-body text-sm transition-all"
            style={{ color: 'var(--text-mid)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            ← 返回
          </button>
          <button onClick={handleSubmit} disabled={generating}
            className="flex-1 py-3 rounded-xl font-title text-sm font-semibold tracking-wider transition-all"
            style={{
              background: generating ? 'rgba(0,255,148,0.06)' : 'linear-gradient(135deg, rgba(0,255,148,0.15), rgba(0,229,255,0.12))',
              border: `1px solid ${generating ? 'rgba(0,255,148,0.15)' : 'rgba(0,255,148,0.4)'}`,
              color: generating ? 'var(--text-dim)' : '#00FF94',
              boxShadow: generating ? 'none' : '0 0 20px rgba(0,255,148,0.1)',
            }}>
            {generating ? '生成中...' : '生成通用套餐'}
          </button>
        </motion.div>

        {/* Tip */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="font-body text-xs text-center mt-4" style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>
          通用套餐为基础营养支持方案，建议患者进行脂肪酸谱检测以获取精准个性化配方
        </motion.p>
      </div>
    </div>
  );
}
