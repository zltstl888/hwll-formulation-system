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

// 关键指标（显示在顶部突出位置）
const KEY_FIELDS = [
  { key: 'aa_epa_ratio', label: 'AA:EPA 比值', unit: '', critical: (v: number) => v > 30, warning: (v: number) => v > 10 },
  { key: 'omega3_index', label: 'Omega-3 指数', unit: '%', critical: (v: number) => v < 4, warning: (v: number) => v < 7 },
  { key: 'epa', label: 'EPA', unit: '%', critical: (v: number) => v < 0.5, warning: (v: number) => v < 1.5 },
  { key: 'dha', label: 'DHA', unit: '%', critical: () => false, warning: (v: number) => v < 3 },
  { key: 'aa', label: 'AA', unit: '%', critical: () => false, warning: (v: number) => v > 10 },
  { key: 'omega6_omega3_ratio', label: 'ω6:ω3 比值', unit: '', critical: (v: number) => v > 20, warning: (v: number) => v > 10 },
];

// 其他指标（折叠展示）
const OTHER_FIELDS = [
  { key: 'omega3_total', label: 'Omega-3 总量', unit: '%' },
  { key: 'omega6_total', label: 'Omega-6 总量', unit: '%' },
  { key: 'la', label: 'LA（亚油酸）', unit: '%' },
  { key: 'total_cholesterol', label: '总胆固醇', unit: 'mmol/L' },
  { key: 'ldl_c', label: 'LDL-C', unit: 'mmol/L' },
  { key: 'triglyceride', label: '甘油三酯', unit: 'mmol/L' },
  { key: 'hdl_c', label: 'HDL-C', unit: 'mmol/L' },
];

function StatusBadge({ critical, warning }: { critical: boolean; warning: boolean }) {
  if (critical) return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>偏高</span>;
  if (warning) return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>注意</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>正常</span>;
}

export default function ReviewPage({ lipidValues, fileName, onGenerate, onBack, generating }: Props) {
  const [values, setValues] = useState<LipidValues>({ ...lipidValues });
  const [patient, setPatient] = useState<Partial<PatientInfo>>({ name: lipidValues.patient_name || '', gender: '' });
  const [showOther, setShowOther] = useState(false);

  const updateValue = (key: string, raw: string) => {
    const num = raw === '' ? undefined : parseFloat(raw);
    setValues(prev => ({ ...prev, [key]: isNaN(num as number) ? undefined : num }));
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#0D1117' }}>
      <div className="max-w-4xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-sm transition-colors" style={{ color: '#8b949e' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e6edf3')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}>
            ← 重新上传
          </button>
          <div className="flex gap-8" style={{ color: '#6e7681' }}>
            {['上传 PDF', '确认数值', '查看配方'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: i === 1 ? '#06B6D4' : i < 1 ? '#22c55e' : '#21262d', color: '#fff' }}>
                  {i < 1 ? '✓' : i + 1}
                </span>
                <span style={{ color: i === 1 ? '#e6edf3' : i < 1 ? '#22c55e' : '#6e7681' }}>{step}</span>
                {i < 2 && <span style={{ color: '#30363d' }}>→</span>}
              </div>
            ))}
          </div>
          <div className="w-24" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：患者信息 */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div className="rounded-xl p-6" style={{ background: '#161b22', border: '1px solid #30363d' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-5 rounded-full" style={{ background: '#3B82F6' }} />
                <h2 className="text-white font-semibold">患者信息</h2>
                <span className="text-xs ml-1" style={{ color: '#6e7681' }}>（选填）</span>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'name', label: '姓名', placeholder: '患者姓名' },
                  { key: 'age', label: '年龄', placeholder: '岁', type: 'number' },
                  { key: 'diagnosis', label: '主诊断', placeholder: '如：冠心病、高血压' },
                  { key: 'medications', label: '当前用药', placeholder: '如：他汀类药物' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs mb-1.5 block" style={{ color: '#8b949e' }}>{field.label}</label>
                    <input
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={(patient as any)[field.key] || ''}
                      onChange={e => setPatient(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                      style={{ background: '#0D1117', border: '1px solid #30363d', color: '#e6edf3' }}
                      onFocus={e => (e.target.style.borderColor = '#06B6D4')}
                      onBlur={e => (e.target.style.borderColor = '#30363d')}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: '#8b949e' }}>性别</label>
                  <div className="flex gap-3">
                    {['male', 'female'].map(g => (
                      <button key={g} onClick={() => setPatient(prev => ({ ...prev, gender: g }))}
                        className="flex-1 py-2 rounded-lg text-sm transition-all"
                        style={{
                          background: patient.gender === g ? 'rgba(6,182,212,0.15)' : '#0D1117',
                          border: `1px solid ${patient.gender === g ? '#06B6D4' : '#30363d'}`,
                          color: patient.gender === g ? '#06B6D4' : '#8b949e',
                        }}>
                        {g === 'male' ? '男' : '女'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #21262d' }}>
                <p className="text-xs" style={{ color: '#6e7681' }}>
                  📄 {fileName}
                </p>
              </div>
            </div>
          </motion.div>

          {/* 右侧：检测数值 */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div className="rounded-xl p-6" style={{ background: '#161b22', border: '1px solid #30363d' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-5 rounded-full" style={{ background: '#06B6D4' }} />
                <h2 className="text-white font-semibold">检测数值</h2>
                <span className="text-xs ml-1" style={{ color: '#6e7681' }}>（可编辑修正）</span>
              </div>
              <div className="space-y-3">
                {KEY_FIELDS.map(field => {
                  const val = values[field.key];
                  const numVal = typeof val === 'number' ? val : parseFloat(val);
                  const isCritical = !isNaN(numVal) && field.critical(numVal);
                  const isWarning = !isNaN(numVal) && !isCritical && field.warning(numVal);
                  return (
                    <div key={field.key} className="flex items-center gap-3">
                      <label className="text-sm w-32 flex-shrink-0" style={{ color: '#8b949e' }}>{field.label}</label>
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          step="0.01"
                          value={val ?? ''}
                          onChange={e => updateValue(field.key, e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm text-right outline-none transition-colors font-mono"
                          style={{
                            background: '#0D1117',
                            border: `1px solid ${isCritical ? 'rgba(239,68,68,0.5)' : isWarning ? 'rgba(245,158,11,0.4)' : '#30363d'}`,
                            color: isCritical ? '#f87171' : isWarning ? '#fbbf24' : '#e6edf3',
                          }}
                          onFocus={e => { if (!isCritical && !isWarning) e.target.style.borderColor = '#06B6D4'; }}
                          onBlur={e => { if (!isCritical && !isWarning) e.target.style.borderColor = '#30363d'; }}
                        />
                        {field.unit && <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#6e7681' }}>{field.unit}</span>}
                      </div>
                      {!isNaN(numVal) && <StatusBadge critical={isCritical} warning={isWarning} />}
                    </div>
                  );
                })}
              </div>

              {/* 其他指标折叠 */}
              <div className="mt-4">
                <button onClick={() => setShowOther(!showOther)}
                  className="text-sm flex items-center gap-1 transition-colors"
                  style={{ color: '#8b949e' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e6edf3')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}>
                  {showOther ? '▼' : '▶'} 其他指标（血脂等）
                </button>
                {showOther && (
                  <div className="mt-3 space-y-2 pt-3" style={{ borderTop: '1px solid #21262d' }}>
                    {OTHER_FIELDS.map(field => (
                      <div key={field.key} className="flex items-center gap-3">
                        <label className="text-xs w-32 flex-shrink-0" style={{ color: '#6e7681' }}>{field.label}</label>
                        <input
                          type="number" step="0.01"
                          value={values[field.key] ?? ''}
                          onChange={e => updateValue(field.key, e.target.value)}
                          placeholder="—"
                          className="flex-1 rounded-lg px-3 py-1 text-sm text-right outline-none font-mono"
                          style={{ background: '#0D1117', border: '1px solid #21262d', color: '#8b949e' }}
                          onFocus={e => (e.target.style.borderColor = '#06B6D4')}
                          onBlur={e => (e.target.style.borderColor = '#21262d')}
                        />
                        <span className="text-xs w-12 text-right flex-shrink-0" style={{ color: '#6e7681' }}>{field.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* 生成按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex justify-center"
        >
          <button
            onClick={() => onGenerate(values, patient)}
            disabled={generating}
            className="relative px-10 py-4 rounded-xl text-white font-semibold text-base transition-all"
            style={{
              background: generating ? '#21262d' : 'linear-gradient(135deg, #06B6D4, #3B82F6)',
              color: generating ? '#6e7681' : '#fff',
              cursor: generating ? 'not-allowed' : 'pointer',
              boxShadow: generating ? 'none' : '0 0 20px rgba(6,182,212,0.3)',
            }}
          >
            {generating ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10" />
                </svg>
                AI 配方生成中...
              </span>
            ) : '生成个性化配方 →'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
