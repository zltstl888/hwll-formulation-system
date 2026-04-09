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

/* ── Direction: higher_is_worse = 越高越差, lower_is_worse = 越低越差 ── */
const KEY_FIELDS = [
  { key: 'aa_epa_ratio',       label: 'AA : EPA',      unit: '',  direction: 'higher_is_worse' as const, isCritical: (v: number) => v > 10, isWarning: (v: number) => v > 3  },
  { key: 'omega3_index',       label: 'Omega-3 指数', unit: '%', direction: 'lower_is_worse'  as const, isCritical: (v: number) => v < 7,  isWarning: (v: number) => v < 10 },
  { key: 'epa',                label: 'EPA',            unit: '%', direction: 'lower_is_worse'  as const, isCritical: (v: number) => v < 1.5,isWarning: (v: number) => v < 3  },
  { key: 'dha',                label: 'DHA',            unit: '%', direction: 'lower_is_worse'  as const, isCritical: (v: number) => v < 2,  isWarning: (v: number) => v < 3  },
  { key: 'aa',                 label: 'AA',             unit: '%', direction: 'higher_is_worse' as const, isCritical: (v: number) => v > 15, isWarning: (v: number) => v > 10 },
  { key: 'omega6_omega3_ratio',label: 'ω6 : ω3',       unit: '',  direction: 'higher_is_worse' as const, isCritical: (v: number) => v > 10, isWarning: (v: number) => v > 4  },
];

/* ── Range bar configs ── */
const RANGE_CONFIGS: Record<string, { min: number; max: number; refValue: number; refLabel: string; zones: { end: number; color: string }[] }> = {
  aa_epa_ratio: {
    min: 0, max: 40, refValue: 3, refLabel: '≤3',
    zones: [
      { end: 3, color: 'rgba(22,163,74,0.12)' },
      { end: 10, color: 'rgba(217,119,6,0.12)' },
      { end: 30, color: 'rgba(217,119,6,0.18)' },
      { end: 40, color: 'rgba(220,38,38,0.12)' },
    ],
  },
  omega3_index: {
    min: 0, max: 15, refValue: 8, refLabel: '≥8%',
    zones: [
      { end: 4, color: 'rgba(220,38,38,0.12)' },
      { end: 7, color: 'rgba(217,119,6,0.12)' },
      { end: 10, color: 'rgba(22,163,74,0.12)' },
      { end: 15, color: 'rgba(22,163,74,0.08)' },
    ],
  },
  epa: {
    min: 0, max: 5, refValue: 1.5, refLabel: '≥1.5%',
    zones: [
      { end: 0.5, color: 'rgba(220,38,38,0.12)' },
      { end: 1.5, color: 'rgba(217,119,6,0.12)' },
      { end: 3, color: 'rgba(22,163,74,0.12)' },
      { end: 5, color: 'rgba(22,163,74,0.08)' },
    ],
  },
  dha: {
    min: 0, max: 10, refValue: 3, refLabel: '≥3%',
    zones: [
      { end: 3, color: 'rgba(217,119,6,0.12)' },
      { end: 5, color: 'rgba(22,163,74,0.12)' },
      { end: 10, color: 'rgba(22,163,74,0.08)' },
    ],
  },
  aa: {
    min: 0, max: 20, refValue: 10, refLabel: '≤10%',
    zones: [
      { end: 10, color: 'rgba(22,163,74,0.12)' },
      { end: 15, color: 'rgba(217,119,6,0.12)' },
      { end: 20, color: 'rgba(220,38,38,0.12)' },
    ],
  },
  omega6_omega3_ratio: {
    min: 0, max: 30, refValue: 4, refLabel: '≤4',
    zones: [
      { end: 4, color: 'rgba(22,163,74,0.12)' },
      { end: 10, color: 'rgba(217,119,6,0.12)' },
      { end: 20, color: 'rgba(217,119,6,0.18)' },
      { end: 30, color: 'rgba(220,38,38,0.12)' },
    ],
  },
};

function ValueRangeBar({ value, fieldKey, barColor }: { value: number; fieldKey: string; barColor: string }) {
  const range = RANGE_CONFIGS[fieldKey];
  if (!range) return null;
  const fillPct = Math.max(0, Math.min(((value - range.min) / (range.max - range.min)) * 100, 100));
  const refPct = ((range.refValue - range.min) / (range.max - range.min)) * 100;

  let prevPct = 0;
  const stops: string[] = [];
  for (const zone of range.zones) {
    const pct = ((zone.end - range.min) / (range.max - range.min)) * 100;
    stops.push(`${zone.color} ${prevPct}%`, `${zone.color} ${pct}%`);
    prevPct = pct;
  }

  return (
    <div className="mt-2 px-1">
      <div className="relative" style={{ height: 6 }}>
        <div className="absolute inset-0 rounded-full overflow-hidden"
          style={{ background: `linear-gradient(to right, ${stops.join(', ')})` }} />
        <div className="absolute top-0 left-0 h-full rounded-full"
          style={{ width: `${fillPct}%`, background: barColor, opacity: 0.7 }} />
        <div className="absolute" style={{ left: `${refPct}%`, top: -3, bottom: -3, width: 1.5, background: 'rgba(0,0,0,0.18)', borderRadius: 1 }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-data" style={{ fontSize: 9, color: 'var(--text-dim)' }}>{range.min}</span>
        <span className="font-data" style={{ fontSize: 9, color: 'var(--text-dim)' }}>正常{range.refLabel}</span>
        <span className="font-data" style={{ fontSize: 9, color: 'var(--text-dim)' }}>{range.max}</span>
      </div>
    </div>
  );
}

/* ── Other fields: split into fatty acid vs blood lipid ── */
const FATTY_ACID_OTHER_FIELDS = [
  { key: 'omega3_total', label: 'Omega-3 总量', unit: '%' },
  { key: 'omega6_total', label: 'Omega-6 总量', unit: '%' },
  { key: 'la',           label: 'LA 亚油酸',    unit: '%' },
];

const BLOOD_LIPID_FIELDS = [
  { key: 'total_cholesterol', label: '总胆固醇',  unit: 'mmol/L' },
  { key: 'ldl_c',             label: 'LDL-C',     unit: 'mmol/L' },
  { key: 'triglyceride',      label: '甘油三酯',  unit: 'mmol/L' },
  { key: 'hdl_c',             label: 'HDL-C',     unit: 'mmol/L' },
];

const STEPS = ['上传报告', '确认数值', '生成配方'];

function statusColor(critical: boolean, warning: boolean) {
  if (critical) return { color: '#DC2626', border: 'rgba(220,38,38,0.35)',  bg: 'rgba(220,38,38,0.06)',  label: '异常' };
  if (warning)  return { color: '#D97706', border: 'rgba(217,119,6,0.35)',  bg: 'rgba(217,119,6,0.06)',  label: '注意' };
  return          { color: '#16A34A', border: 'rgba(22,163,74,0.25)', bg: 'rgba(22,163,74,0.05)', label: '正常' };
}

/** Get arrow indicator based on direction and status */
function getArrowLabel(direction: 'higher_is_worse' | 'lower_is_worse', critical: boolean, warning: boolean): string {
  if (!critical && !warning) return '';
  if (direction === 'higher_is_worse') {
    return critical ? '↑ 异常' : '↑ 注意';
  }
  // lower_is_worse
  return critical ? '↓ 异常' : '↓ 注意';
}

/* ── Shared light-theme input styles ── */
const inputBase: React.CSSProperties = {
  background: '#F8FAFC',
  border: '1px solid rgba(0,0,0,0.08)',
  color: 'var(--text-hi)',
  letterSpacing: '0.04em',
};

const inputFocusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(13,148,136,0.45)';
    e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.08)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(0,0,0,0.08)';
    e.target.style.boxShadow = 'none';
  },
};

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

  /* M6: check if any blood lipid field has a value */
  const hasAnyBloodLipid = BLOOD_LIPID_FIELDS.some(f => {
    const v = values[f.key];
    return v !== undefined && v !== null;
  });

  return (
    <div className="grid-bg min-h-screen relative overflow-x-hidden"
      style={{ padding: '2rem max(24px, 5vw)' }}>

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* ── Top Nav ── */}
        <div className="flex items-center justify-between mb-8 sm:mb-12 no-print">
          <button
            onClick={onBack}
            className="font-body text-sm tracking-wider flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{ color: 'var(--text-mid)', border: '1px solid rgba(0,0,0,0.08)', background: '#FFFFFF' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,148,136,0.4)'; (e.currentTarget as HTMLElement).style.color = '#0D9488'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-mid)'; }}
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
                      background: i < 1 ? 'rgba(22,163,74,0.10)' : i === 1 ? 'rgba(13,148,136,0.10)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${i < 1 ? 'rgba(22,163,74,0.3)' : i === 1 ? 'rgba(13,148,136,0.35)' : 'rgba(0,0,0,0.08)'}`,
                      color: i < 1 ? '#16A34A' : i === 1 ? '#0D9488' : 'var(--text-dim)',
                    }}>
                    {i < 1 ? '✓' : i + 1}
                  </div>
                  <span className="font-body text-xs tracking-wider hidden sm:inline"
                    style={{ color: i < 1 ? '#16A34A' : i === 1 ? 'var(--text-hi)' : 'var(--text-dim)' }}>
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-12 h-px mx-3"
                    style={{ background: 'linear-gradient(to right, rgba(13,148,136,0.2), rgba(13,148,136,0.05))' }} />
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
            <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #0D9488, rgba(99,102,241,0.5))' }} />
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
            <div className="relative rounded-2xl h-full"
              style={{
                padding: 'max(24px, 4vw)',
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-title text-sm font-semibold tracking-wider" style={{ color: 'var(--text-hi)' }}>患者信息</h2>
                  <p className="font-data text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>PATIENT PROFILE · 选填</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Name + Age on same row */}
                <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 120px' }}>
                  <div>
                    <label className="font-body text-sm tracking-wider block mb-1.5 px-1" style={{ color: 'var(--text-mid)' }}>
                      姓名
                    </label>
                    <input
                      type="text"
                      placeholder="患者姓名"
                      value={patient.name || ''}
                      onChange={e => setPatient(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 font-body text-base outline-none transition-all duration-300"
                      style={inputBase}
                      {...inputFocusHandlers}
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm tracking-wider block mb-1.5 px-1" style={{ color: 'var(--text-mid)' }}>
                      年龄
                    </label>
                    <input
                      type="number"
                      placeholder="岁"
                      value={(patient as any).age || ''}
                      onChange={e => setPatient(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 font-body text-base outline-none transition-all duration-300"
                      style={inputBase}
                      {...inputFocusHandlers}
                    />
                  </div>
                </div>

                {/* Diagnosis + Medications */}
                {[
                  { key: 'diagnosis',  label: '主诊断',  placeholder: '如：冠心病、高血压' },
                  { key: 'medications', label: '当前用药', placeholder: '如：他汀类药物' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="font-body text-sm tracking-wider block mb-1.5 px-1" style={{ color: 'var(--text-mid)' }}>
                      {field.label}
                    </label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={(patient as any)[field.key] || ''}
                      onChange={e => setPatient(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 font-body text-base outline-none transition-all duration-300"
                      style={inputBase}
                      {...inputFocusHandlers}
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
                          background: patient.gender === g.v ? 'rgba(13,148,136,0.08)' : '#F8FAFC',
                          border: `1px solid ${patient.gender === g.v ? 'rgba(13,148,136,0.4)' : 'rgba(0,0,0,0.08)'}`,
                          color: patient.gender === g.v ? '#0D9488' : 'var(--text-mid)',
                        }}
                      >{g.label}</button>
                    ))}
                  </div>
                </div>

                {/* M3: Reporting Doctor + Reviewing Doctor */}
                <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <label className="font-body text-sm tracking-wider block mb-1.5 px-1" style={{ color: 'var(--text-mid)' }}>
                      报告医生
                    </label>
                    <input
                      type="text"
                      placeholder="报告医生姓名"
                      value={(patient as any).reporting_doctor || ''}
                      onChange={e => setPatient(prev => ({ ...prev, reporting_doctor: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 font-body text-base outline-none transition-all duration-300"
                      style={inputBase}
                      {...inputFocusHandlers}
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm tracking-wider block mb-1.5 px-1" style={{ color: 'var(--text-mid)' }}>
                      审核医生
                    </label>
                    <input
                      type="text"
                      placeholder="审核医生姓名"
                      value={(patient as any).reviewing_doctor || ''}
                      onChange={e => setPatient(prev => ({ ...prev, reviewing_doctor: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 font-body text-base outline-none transition-all duration-300"
                      style={inputBase}
                      {...inputFocusHandlers}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
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
            <div className="relative rounded-2xl"
              style={{
                padding: 'max(24px, 4vw)',
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(13,148,136,0.10)', border: '1px solid rgba(13,148,136,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-title text-sm font-semibold tracking-wider" style={{ color: 'var(--text-hi)' }}>脂肪酸谱指标</h2>
                  <p className="font-data text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>FATTY ACID PROFILE · 可编辑修正</p>
                </div>
              </div>

              <div className="space-y-6">
                {KEY_FIELDS.map((field, idx) => {
                  const val = values[field.key];
                  const num = typeof val === 'number' ? val : parseFloat(String(val));
                  const crit = !isNaN(num) && field.isCritical(num);
                  const warn = !isNaN(num) && !crit && field.isWarning(num);
                  const sc = statusColor(crit, warn);
                  const arrowLabel = !isNaN(num) ? getArrowLabel(field.direction, crit, warn) : '';

                  return (
                    <motion.div
                      key={field.key}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.04 }}
                    >
                      {/* Label row */}
                      <div className="flex items-center justify-between mb-2 px-2">
                        <span className="font-body text-sm tracking-wider" style={{ color: 'var(--text-mid)' }}>
                          {field.label}{field.unit ? `（${field.unit}）` : ''}
                        </span>
                        {!isNaN(num) && (
                          <span className="font-title text-xs font-semibold px-2.5 py-1 rounded-md"
                            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            {arrowLabel || sc.label}
                          </span>
                        )}
                      </div>
                      {/* Input */}
                      <input
                        type="number"
                        step="0.01"
                        value={val ?? ''}
                        onChange={e => updateValue(field.key, e.target.value)}
                        className="w-full rounded-xl px-4 py-3 font-data text-lg text-right outline-none transition-all duration-300 tracking-wider"
                        style={{
                          background: crit ? 'rgba(220,38,38,0.04)' : warn ? 'rgba(217,119,6,0.04)' : '#F8FAFC',
                          border: `1px solid ${crit ? sc.border : warn ? sc.border : 'rgba(0,0,0,0.08)'}`,
                          color: crit ? sc.color : warn ? sc.color : 'var(--text-hi)',
                        }}
                        onFocus={e => {
                          if (!crit && !warn) {
                            e.target.style.borderColor = 'rgba(13,148,136,0.4)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.08)';
                          }
                        }}
                        onBlur={e => {
                          if (!crit && !warn) {
                            e.target.style.borderColor = 'rgba(0,0,0,0.08)';
                            e.target.style.boxShadow = 'none';
                          }
                        }}
                      />
                      {/* Range bar */}
                      {!isNaN(num) && RANGE_CONFIGS[field.key] && (
                        <ValueRangeBar value={num} fieldKey={field.key} barColor={sc.color} />
                      )}
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
                  onMouseEnter={e => (e.currentTarget.style.color = '#0D9488')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mid)')}
                >
                  <span style={{ fontSize: '10px' }}>{showOther ? '▼' : '▶'}</span>
                  其他指标（血脂检验）
                </button>
                {showOther && (
                  <div className="mt-4 space-y-3 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    {/* Fatty acid other fields — always shown */}
                    {FATTY_ACID_OTHER_FIELDS.map(field => (
                      <div key={field.key}>
                        <span className="font-body text-sm tracking-wider block mb-1.5 px-1" style={{ color: 'var(--text-dim)' }}>
                          {field.label}{field.unit ? `（${field.unit}）` : ''}
                        </span>
                        <input
                          type="number" step="0.01"
                          value={values[field.key] ?? ''}
                          onChange={e => updateValue(field.key, e.target.value)}
                          placeholder="—"
                          className="w-full rounded-xl px-4 py-3 font-data text-base text-right outline-none transition-all duration-300"
                          style={{
                            background: '#F8FAFC',
                            border: '1px solid rgba(0,0,0,0.08)',
                            color: 'var(--text-mid)',
                          }}
                          onFocus={e => (e.target.style.borderColor = 'rgba(13,148,136,0.3)')}
                          onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
                        />
                      </div>
                    ))}

                    {/* M6: Blood lipid fields — only shown if any has a value */}
                    {hasAnyBloodLipid && (
                      <>
                        <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                          <span className="font-body text-xs tracking-wider px-1" style={{ color: 'var(--text-dim)' }}>
                            血脂检验
                          </span>
                        </div>
                        {BLOOD_LIPID_FIELDS.map(field => (
                          <div key={field.key}>
                            <span className="font-body text-sm tracking-wider block mb-1.5 px-1" style={{ color: 'var(--text-dim)' }}>
                              {field.label}{field.unit ? `（${field.unit}）` : ''}
                            </span>
                            <input
                              type="number" step="0.01"
                              value={values[field.key] ?? ''}
                              onChange={e => updateValue(field.key, e.target.value)}
                              placeholder="—"
                              className="w-full rounded-xl px-4 py-3 font-data text-base text-right outline-none transition-all duration-300"
                              style={{
                                background: '#F8FAFC',
                                border: '1px solid rgba(0,0,0,0.08)',
                                color: 'var(--text-mid)',
                              }}
                              onFocus={e => (e.target.style.borderColor = 'rgba(13,148,136,0.3)')}
                              onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
                            />
                          </div>
                        ))}
                      </>
                    )}
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
          className="pb-4"
          style={{ marginTop: 48 }}
        >
          {/* Separator */}
          <div className="h-px mb-8" style={{ background: 'linear-gradient(to right, transparent, rgba(13,148,136,0.20), transparent)' }} />

          <div className="flex justify-center">
          <button
            onClick={() => onGenerate(values, patient)}
            disabled={generating}
            className="relative overflow-hidden rounded-2xl px-8 sm:px-16 py-5 font-title text-lg font-bold tracking-widest transition-all duration-300 w-full sm:w-auto"
            style={{
              background: generating
                ? '#F1F5F9'
                : 'linear-gradient(135deg, rgba(13,148,136,0.08), rgba(99,102,241,0.10))',
              border: `1px solid ${generating ? 'rgba(0,0,0,0.06)' : 'rgba(13,148,136,0.35)'}`,
              color: generating ? 'var(--text-dim)' : '#0D9488',
              boxShadow: generating ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
              cursor: generating ? 'not-allowed' : 'pointer',
              letterSpacing: '0.2em',
              maxWidth: 480,
            }}
            onMouseEnter={e => {
              if (!generating) {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(13,148,136,0.15)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,148,136,0.5)';
              }
            }}
            onMouseLeave={e => {
              if (!generating) {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,148,136,0.35)';
              }
            }}
          >
            {generating ? (
              <span className="flex items-center gap-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" style={{ animation: 'rotate-slow 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(13,148,136,0.25)" strokeWidth="2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" />
                </svg>
                AI 配方生成中...
              </span>
            ) : (
              '生成个性化配方  →'
            )}
          </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
