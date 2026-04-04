import { useState } from 'react';
import { motion } from 'framer-motion';
import type { LipidValues, PatientInfo } from '../types';

interface Props {
  lipidValues: LipidValues;
  fileName: string;
  onGenerate: (lipidValues: LipidValues, patientInfo: Partial<PatientInfo>) => void;
  onBack: () => void;
  generating: boolean;
}

const KEY_FIELDS = [
  { key: 'aa_epa_ratio',       label: 'AA : EPA',      unit: '',  isCritical: (v: number) => v > 30, isWarning: (v: number) => v > 10 },
  { key: 'omega3_index',       label: 'Omega-3 指数', unit: '%', isCritical: (v: number) => v < 4,  isWarning: (v: number) => v < 7  },
  { key: 'epa',                label: 'EPA',            unit: '%', isCritical: (v: number) => v < 0.5,isWarning: (v: number) => v < 1.5},
  { key: 'dha',                label: 'DHA',            unit: '%', isCritical: () => false,           isWarning: (v: number) => v < 3  },
  { key: 'aa',                 label: 'AA',             unit: '%', isCritical: () => false,           isWarning: (v: number) => v > 10 },
  { key: 'omega6_omega3_ratio',label: 'ω6 : ω3',       unit: '',  isCritical: (v: number) => v > 20, isWarning: (v: number) => v > 10 },
];

const OTHER_FIELDS = [
  { key: 'omega3_total',     label: 'Omega-3 总量', unit: '%'      },
  { key: 'omega6_total',     label: 'Omega-6 总量', unit: '%'      },
  { key: 'la',               label: 'LA 亚油酸',    unit: '%'      },
  { key: 'total_cholesterol',label: '总胆固醇',      unit: 'mmol/L' },
  { key: 'ldl_c',            label: 'LDL-C',        unit: 'mmol/L' },
  { key: 'triglyceride',     label: '甘油三酯',      unit: 'mmol/L' },
  { key: 'hdl_c',            label: 'HDL-C',        unit: 'mmol/L' },
];

const STEPS = ['上传报告', '确认数值', '生成配方'];

function statusColor(critical: boolean, warning: boolean) {
  if (critical) return { color: '#FF2D55', border: 'rgba(255,45,85,0.4)',  bg: 'rgba(255,45,85,0.08)',  label: '异常', glow: '0 0 20px rgba(255,45,85,0.4)' };
  if (warning)  return { color: '#FFB800', border: 'rgba(255,184,0,0.4)',  bg: 'rgba(255,184,0,0.08)',  label: '注意', glow: '0 0 20px rgba(255,184,0,0.3)'  };
  return          { color: '#00FF94', border: 'rgba(0,255,148,0.3)', bg: 'rgba(0,255,148,0.06)', label: '正常', glow: 'none' };
}

export default function ReviewPage({ lipidValues, fileName, onGenerate, onBack, generating }: Props) {
  const [values, setValues] = useState<LipidValues>({ ...lipidValues });
  const [patient, setPatient] = useState<Partial<PatientInfo>>({
    name: lipidValues.patient_name || '',
    gender: '',
  });
  const [showOther, setShowOther] = useState(false);

  const updateValue = (key: string, raw: string) => {
    const num = parseFloat(raw);
    setValues(prev => ({ ...prev, [key]: raw === '' ? undefined : isNaN(num) ? undefined : num }));
  };

  return (
    <div className="grid-bg min-h-screen relative overflow-x-hidden"
      style={{ padding: '2rem max(24px, 5vw)' }}>
      {/* Ambient */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[250px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(123,47,247,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* ── Top Nav ── */}
        <div className="flex items-center justify-between mb-8 sm:mb-12 no-print">
          <button
            onClick={onBack}
            className="font-body text-sm tracking-wider flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{ color: 'var(--text-mid)', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.3)'; (e.currentTarget as HTMLElement).style.color = '#00E5FF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-mid)'; }}
          >
            ← 重新上传
          </button>

          {/* Step indicator — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-0">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-title text-xs font-bold"
                    style={{
                      background: i < 1 ? 'rgba(0,255,148,0.15)' : i === 1 ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${i < 1 ? 'rgba(0,255,148,0.4)' : i === 1 ? 'rgba(0,229,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
                      color: i < 1 ? '#00FF94' : i === 1 ? '#00E5FF' : 'var(--text-dim)',
                      boxShadow: i === 1 ? '0 0 14px rgba(0,229,255,0.25)' : 'none',
                    }}>
                    {i < 1 ? '✓' : i + 1}
                  </div>
                  <span className="font-body text-xs tracking-wider hidden sm:inline"
                    style={{ color: i < 1 ? '#00FF94' : i === 1 ? 'var(--text-hi)' : 'var(--text-dim)' }}>
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-12 h-px mx-3"
                    style={{ background: 'linear-gradient(to right, rgba(0,229,255,0.2), rgba(0,229,255,0.05))' }} />
                )}
              </div>
            ))}
          </div>

          <div className="w-0 sm:w-28" />
        </div>

        {/* ── Section Title ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #00E5FF, rgba(123,47,247,0.5))' }} />
            <h1 className="font-title text-2xl font-bold tracking-wider" style={{ color: 'var(--text-hi)' }}>
              VERIFY DATA
            </h1>
          </div>
          <p className="font-body text-base pl-4" style={{ color: 'var(--text-mid)', letterSpacing: '0.06em' }}>
            确认检测数值，补充患者信息，然后生成配方
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* ── Left: Patient Info ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative bracket rounded-2xl h-full"
              style={{
                padding: 'max(24px, 4vw)',
                background: 'linear-gradient(135deg, rgba(9,18,32,0.95), rgba(9,18,32,0.8))',
                border: '1px solid rgba(0,229,255,0.12)',
              }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(123,47,247,0.2)', border: '1px solid rgba(123,47,247,0.3)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B2FF7" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-title text-sm font-semibold tracking-wider" style={{ color: 'var(--text-hi)' }}>患者信息</h2>
                  <p className="font-data text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>PATIENT PROFILE · 选填</p>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { key: 'name',       label: '姓  名',  placeholder: '患者姓名', type: 'text'   },
                  { key: 'age',        label: '年  龄',  placeholder: '岁',       type: 'number' },
                  { key: 'diagnosis',  label: '主诊断',  placeholder: '如：冠心病、高血压'        },
                  { key: 'medications',label: '当前用药',placeholder: '如：他汀类药物'           },
                ].map(field => (
                  <div key={field.key}>
                    <label className="font-body text-sm tracking-wider block mb-2 px-1" style={{ color: 'var(--text-mid)' }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={(patient as any)[field.key] || ''}
                      onChange={e => setPatient(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 font-body text-base outline-none transition-all duration-300"
                      style={{
                        background: 'rgba(3,7,18,0.6)',
                        border: '1px solid rgba(0,229,255,0.10)',
                        color: 'var(--text-hi)',
                        letterSpacing: '0.04em',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = 'rgba(0,229,255,0.45)';
                        e.target.style.boxShadow = '0 0 20px rgba(0,229,255,0.12)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = 'rgba(0,229,255,0.10)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                ))}

                {/* Gender */}
                <div>
                  <label className="font-body text-sm tracking-wider block mb-2 px-1" style={{ color: 'var(--text-mid)' }}>
                    性别
                  </label>
                  <div className="flex gap-3">
                    {[{ v: 'male', label: '男' }, { v: 'female', label: '女' }].map(g => (
                      <button
                        key={g.v}
                        onClick={() => setPatient(prev => ({ ...prev, gender: g.v }))}
                        className="flex-1 py-3 rounded-xl font-title text-sm font-semibold tracking-wider transition-all duration-300"
                        style={{
                          background: patient.gender === g.v ? 'rgba(0,229,255,0.12)' : 'rgba(3,7,18,0.6)',
                          border: `1px solid ${patient.gender === g.v ? 'rgba(0,229,255,0.45)' : 'rgba(0,229,255,0.10)'}`,
                          color: patient.gender === g.v ? '#00E5FF' : 'var(--text-mid)',
                          boxShadow: patient.gender === g.v ? '0 0 16px rgba(0,229,255,0.18)' : 'none',
                        }}
                      >{g.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5" style={{ borderTop: '1px solid rgba(0,229,255,0.06)' }}>
                <p className="font-data text-xs tracking-wider" style={{ color: 'var(--text-dim)' }}>
                  📄 {fileName}
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Right: Lipid Values ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="relative bracket rounded-2xl"
              style={{
                padding: 'max(24px, 4vw)',
                background: 'linear-gradient(135deg, rgba(9,18,32,0.95), rgba(9,18,32,0.8))',
                border: '1px solid rgba(0,229,255,0.12)',
              }}>
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-title text-sm font-semibold tracking-wider" style={{ color: 'var(--text-hi)' }}>检测数值</h2>
                  <p className="font-data text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>LIPID PROFILE · 可编辑修正</p>
                </div>
              </div>

              <div className="space-y-6">
                {KEY_FIELDS.map((field, idx) => {
                  const val = values[field.key];
                  const num = typeof val === 'number' ? val : parseFloat(String(val));
                  const crit = !isNaN(num) && field.isCritical(num);
                  const warn = !isNaN(num) && !crit && field.isWarning(num);
                  const sc = statusColor(crit, warn);

                  return (
                    <motion.div
                      key={field.key}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.04 }}
                    >
                      {/* 标签行 */}
                      <div className="flex items-center justify-between mb-2 px-2">
                        <span className="font-body text-sm tracking-wider" style={{ color: 'var(--text-mid)' }}>
                          {field.label}{field.unit ? `（${field.unit}）` : ''}
                        </span>
                        {!isNaN(num) && (
                          <span className="font-title text-xs font-semibold px-2.5 py-1 rounded-md"
                            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            {sc.label}
                          </span>
                        )}
                      </div>
                      {/* 输入框 */}
                      <input
                        type="number"
                        step="0.01"
                        value={val ?? ''}
                        onChange={e => updateValue(field.key, e.target.value)}
                        className="w-full rounded-xl px-4 py-3 font-data text-lg text-right outline-none transition-all duration-300 tracking-wider"
                        style={{
                          background: crit ? 'rgba(255,45,85,0.06)' : warn ? 'rgba(255,184,0,0.05)' : 'rgba(3,7,18,0.6)',
                          border: `1px solid ${crit ? sc.border : warn ? sc.border : 'rgba(0,229,255,0.10)'}`,
                          color: crit ? sc.color : warn ? sc.color : 'var(--text-hi)',
                          boxShadow: crit || warn ? sc.glow : 'none',
                        }}
                        onFocus={e => {
                          if (!crit && !warn) {
                            e.target.style.borderColor = 'rgba(0,229,255,0.4)';
                            e.target.style.boxShadow = '0 0 16px rgba(0,229,255,0.10)';
                          }
                        }}
                        onBlur={e => {
                          if (!crit && !warn) {
                            e.target.style.borderColor = 'rgba(0,229,255,0.10)';
                            e.target.style.boxShadow = 'none';
                          }
                        }}
                      />
                    </motion.div>
                  );
                })}
              </div>

              {/* Other fields collapsible */}
              <div className="mt-6">
                <button
                  onClick={() => setShowOther(!showOther)}
                  className="font-body text-sm tracking-wider flex items-center gap-2 transition-all"
                  style={{ color: 'var(--text-mid)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#00E5FF')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mid)')}
                >
                  <span style={{ fontSize: '10px' }}>{showOther ? '▼' : '▶'}</span>
                  其他指标（血脂检验）
                </button>
                {showOther && (
                  <div className="mt-4 space-y-3 pt-4" style={{ borderTop: '1px solid rgba(0,229,255,0.06)' }}>
                    {OTHER_FIELDS.map(field => (
                      <div key={field.key}>
                        <span className="font-body text-sm tracking-wider block mb-1.5 px-1" style={{ color: 'var(--text-dim)' }}>
                          {field.label}{field.unit ? `（${field.unit}）` : ''}
                        </span>
                        <input
                          type="number" step="0.01"
                          value={values[field.key] ?? ''}
                          onChange={e => updateValue(field.key, e.target.value)}
                          placeholder="—"
                          className="w-full rounded-xl px-4 py-3 font-data text-base text-right outline-none"
                          style={{
                            background: 'rgba(3,7,18,0.5)',
                            border: '1px solid rgba(0,229,255,0.07)',
                            color: 'var(--text-mid)',
                          }}
                          onFocus={e => (e.target.style.borderColor = 'rgba(0,229,255,0.3)')}
                          onBlur={e => (e.target.style.borderColor = 'rgba(0,229,255,0.07)')}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Generate Button ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex justify-center pb-4"
        >
          <button
            onClick={() => onGenerate(values, patient)}
            disabled={generating}
            className="relative overflow-hidden rounded-2xl px-8 sm:px-16 py-5 font-title text-base font-bold tracking-widest transition-all duration-300 w-full sm:w-auto"
            style={{
              background: generating
                ? 'rgba(9,18,32,0.8)'
                : 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(123,47,247,0.2))',
              border: `1px solid ${generating ? 'rgba(255,255,255,0.07)' : 'rgba(0,229,255,0.45)'}`,
              color: generating ? 'var(--text-dim)' : '#00E5FF',
              boxShadow: generating ? 'none' : '0 0 40px rgba(0,229,255,0.2), 0 0 80px rgba(0,229,255,0.08)',
              cursor: generating ? 'not-allowed' : 'pointer',
              letterSpacing: '0.2em',
              maxWidth: 480,
            }}
            onMouseEnter={e => {
              if (!generating) {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 60px rgba(0,229,255,0.35), 0 0 100px rgba(0,229,255,0.12)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.65)';
              }
            }}
            onMouseLeave={e => {
              if (!generating) {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(0,229,255,0.2), 0 0 80px rgba(0,229,255,0.08)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.45)';
              }
            }}
          >
            {/* Animated scan beam on button */}
            {!generating && (
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <div className="absolute inset-x-0 h-full scan-beam opacity-30"
                  style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,229,255,0.15), transparent)' }} />
              </div>
            )}
            {generating ? (
              <span className="flex items-center gap-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" style={{ animation: 'rotate-slow 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(0,229,255,0.3)" strokeWidth="2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
                </svg>
                AI 配方生成中...
              </span>
            ) : (
              '生成个性化配方  →'
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
