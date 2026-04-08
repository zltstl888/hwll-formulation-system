import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RiskGauge from '../components/RiskGauge';
import type { FormulationResult } from '../types';

interface Props {
  result: FormulationResult;
  onRestart: () => void;
}

const TABS = ['产品方案', '膳食干预', '运动处方', '生活方式', '随访计划'] as const;

const PRODUCT_PALETTE = [
  { color: '#00E5FF', glow: 'rgba(0,229,255,0.25)',   bg: 'rgba(0,229,255,0.06)',   border: 'rgba(0,229,255,0.20)'   },
  { color: '#7B2FF7', glow: 'rgba(123,47,247,0.3)',   bg: 'rgba(123,47,247,0.06)',  border: 'rgba(123,47,247,0.22)'  },
  { color: '#00FF94', glow: 'rgba(0,255,148,0.25)',   bg: 'rgba(0,255,148,0.05)',   border: 'rgba(0,255,148,0.20)'   },
  { color: '#FFB800', glow: 'rgba(255,184,0,0.25)',   bg: 'rgba(255,184,0,0.05)',   border: 'rgba(255,184,0,0.20)'   },
  { color: '#FF0080', glow: 'rgba(255,0,128,0.25)',   bg: 'rgba(255,0,128,0.05)',   border: 'rgba(255,0,128,0.20)'   },
  { color: '#00CFFF', glow: 'rgba(0,207,255,0.25)',   bg: 'rgba(0,207,255,0.05)',   border: 'rgba(0,207,255,0.20)'   },
];

function productPalette(idx: number, conditional: boolean) {
  if (conditional) return { color: '#FFB800', glow: 'rgba(255,184,0,0.25)', bg: 'rgba(255,184,0,0.05)', border: 'rgba(255,184,0,0.20)' };
  return PRODUCT_PALETTE[idx % PRODUCT_PALETTE.length];
}

// ── 处方盒数计算 ──
const PRODUCT_PACKAGING: Record<string, { units_per_box: number; unit: string }> = {
  epa_fish_oil:       { units_per_box: 60, unit: '粒' },   // 850mg×60粒/瓶 ¥398
  glutathione_multi:  { units_per_box: 45, unit: '粒' },   // 850mg×45粒/瓶 ¥298
  seven_probiotics:   { units_per_box: 20, unit: '袋' },   // 3g×20袋/盒   ¥238
  natto_red_yeast:    { units_per_box: 20, unit: '袋' },   // 3g×20袋/盒   ¥398
  peptide_nutrients:  { units_per_box: 20, unit: '袋' },   // 20g×20袋/罐  ¥398
  shuyan_ning:        { units_per_box: 20, unit: '袋' },   // 1g×20袋/盒   ¥298
};

function parseDailyUnits(dose: string): number {
  const m = dose.match(/每日(\d+)/);
  return m ? parseInt(m[1]) : 1;
}

function parseDurationWeeks(duration: string): number {
  const m = duration.match(/(\d+)周/);
  return m ? parseInt(m[1]) : 12;
}

function calcBoxes(product: { product_id: string; dose: string; duration: string }): number {
  const pkg = PRODUCT_PACKAGING[product.product_id];
  if (!pkg) return 1;
  const daily = parseDailyUnits(product.dose);
  const weeks = parseDurationWeeks(product.duration);
  return Math.ceil((daily * weeks * 7) / pkg.units_per_box);
}

export default function ReportPage({ result, onRestart }: Props) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('产品方案');
  const { risk_assessment: risk, formulation, patient } = result;

  return (
    <div className="grid-bg min-h-screen relative overflow-x-hidden"
      style={{ padding: '2rem max(24px, 5vw)' }}>
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] pointer-events-none"
        style={{ background: `radial-gradient(ellipse, rgba(0,229,255,0.05) 0%, transparent 70%)`, filter: 'blur(50px)' }} />

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-8 sm:mb-12 no-print">
          <button
            onClick={onRestart}
            className="font-body text-sm tracking-wider flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{ color: 'var(--text-mid)', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.3)'; (e.currentTarget as HTMLElement).style.color = '#00E5FF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-mid)'; }}
          >
            ← 重新开始
          </button>

          <div className="hidden sm:flex items-center gap-0">
            {['上传报告', '确认数值', '生成配方'].map((step, i) => (
              <div key={i} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-title text-xs"
                    style={{
                      background: 'rgba(0,255,148,0.12)',
                      border: '1px solid rgba(0,255,148,0.35)',
                      color: '#00FF94',
                    }}>✓</div>
                  <span className="font-body text-xs tracking-wider hidden md:inline" style={{ color: '#00FF94' }}>{step}</span>
                </div>
                {i < 2 && <div className="w-10 h-px mx-3" style={{ background: 'rgba(0,255,148,0.2)' }} />}
              </div>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="font-title text-xs tracking-widest flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all no-print"
            style={{ color: '#00E5FF', border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.06)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,229,255,0.2)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.55)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.3)'; }}
          >
            ⬇ 导出报告
          </button>
        </div>

        {/* ── Hero: Risk Dashboard ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative bracket rounded-2xl mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(9,18,32,0.98), rgba(9,18,32,0.85))',
            border: '1px solid rgba(0,229,255,0.12)',
            boxShadow: '0 4px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Top label */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px">
            <div className="px-6 py-1.5 rounded-b-xl font-data text-xs tracking-widest"
              style={{ background: 'rgba(0,229,255,0.10)', border: '1px solid rgba(0,229,255,0.2)', borderTop: 'none', color: 'rgba(0,229,255,0.7)' }}>
              FORMULATION REPORT · {new Date(result.generated_at).toLocaleDateString('zh-CN')}
            </div>
          </div>

          <div className="flex flex-col xl:flex-row items-center xl:items-start gap-6 sm:gap-10 p-6 pt-14 sm:p-10 sm:pt-16">
            {/* Gauge */}
            <div className="flex-shrink-0">
              <RiskGauge
                level={risk.level}
                aaEpaRatio={risk.primary_indicators.aa_epa_ratio}
                epaPct={risk.primary_indicators.epa_pct}
                omega3Index={risk.primary_indicators.omega3_index}
                summary={risk.risk_summary}
              />
            </div>

            {/* Patient + summary */}
            <div className="flex-1 min-w-0 xl:pt-6">
              <div className="mb-6">
                <p className="font-data text-xs tracking-widest mb-2" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
                  PATIENT
                </p>
                <h1 className="font-title text-3xl font-black mb-1" style={{ color: 'var(--text-hi)', letterSpacing: '0.05em' }}>
                  {patient.name || '— — —'}
                </h1>
                <p className="font-body text-base" style={{ color: 'var(--text-mid)', letterSpacing: '0.08em' }}>
                  {[
                    patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : null,
                    patient.age ? `${patient.age} 岁` : null,
                  ].filter(Boolean).join('  ·  ') || '基本信息未填写'}
                </p>
              </div>

              {/* Risk summary box */}
              <div className="relative rounded-xl p-5 mb-6"
                style={{
                  background: 'rgba(3,7,18,0.7)',
                  border: '1px solid rgba(0,229,255,0.08)',
                }}>
                <p className="font-data text-xs tracking-widest mb-3" style={{ color: 'var(--text-dim)', letterSpacing: '0.18em' }}>
                  CLINICAL SUMMARY
                </p>
                <p className="font-body leading-relaxed" style={{ color: 'var(--text-mid)', lineHeight: 1.85, fontSize: 15 }}>
                  {risk.risk_summary}
                </p>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                {[
                  { label: 'ALGORITHM', value: result.formulation_version },
                  { label: 'GENERATED', value: new Date(result.generated_at).toLocaleString('zh-CN') },
                  { label: 'PRODUCTS', value: `${formulation.products.length} 个推荐` },
                ].map(m => (
                  <div key={m.label}>
                    <span className="font-data text-xs tracking-widest" style={{ color: 'var(--text-dim)' }}>{m.label}&ensp;</span>
                    <span className="font-data text-xs" style={{ color: 'var(--text-mid)' }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Five-Dimension Overview ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-5 gap-2 sm:gap-3 mb-6"
        >
          {[
            { icon: '💊', label: '营养补充', sub: `${formulation.products.length} 个产品`, tab: '产品方案' as const },
            { icon: '🥗', label: '膳食干预', sub: formulation.diet_intervention.pattern, tab: '膳食干预' as const },
            { icon: '🏃', label: '运动处方', sub: formulation.exercise_prescription.frequency, tab: '运动处方' as const },
            { icon: '🌙', label: '生活方式', sub: `${formulation.lifestyle_intervention.key_points.length} 项建议`, tab: '生活方式' as const },
            { icon: '📋', label: '随访计划', sub: `${formulation.followup_plan.review_weeks} 周复查`, tab: '随访计划' as const },
          ].map(dim => (
            <button
              key={dim.label}
              onClick={() => setActiveTab(dim.tab)}
              className="rounded-xl p-2.5 sm:p-3 text-center transition-all duration-300"
              style={{
                background: activeTab === dim.tab ? 'rgba(0,229,255,0.08)' : 'rgba(9,18,32,0.7)',
                border: `1px solid ${activeTab === dim.tab ? 'rgba(0,229,255,0.25)' : 'rgba(0,229,255,0.06)'}`,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{dim.icon}</div>
              <p className="font-body text-xs sm:text-sm font-semibold" style={{ color: activeTab === dim.tab ? '#00E5FF' : 'var(--text-hi)', lineHeight: 1.3 }}>
                {dim.label}
              </p>
              <p className="font-data hidden sm:block mt-1" style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.2 }}>
                {dim.sub}
              </p>
            </button>
          ))}
        </motion.div>

        {/* ── Tab Navigation (detailed) ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >

          <div className="flex gap-1 mb-6 p-1.5 rounded-2xl no-print overflow-x-auto"
            style={{ background: 'rgba(6,13,26,0.9)', border: '1px solid rgba(0,229,255,0.08)', WebkitOverflowScrolling: 'touch' }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-none sm:flex-1 py-3 px-4 sm:px-2 rounded-xl font-title text-sm font-semibold tracking-wider transition-all duration-300 whitespace-nowrap"
                style={{
                  background: activeTab === tab
                    ? 'linear-gradient(135deg, rgba(0,229,255,0.14), rgba(123,47,247,0.16))'
                    : 'transparent',
                  border: `1px solid ${activeTab === tab ? 'rgba(0,229,255,0.35)' : 'transparent'}`,
                  color: activeTab === tab ? '#00E5FF' : 'var(--text-dim)',
                  boxShadow: activeTab === tab ? '0 0 20px rgba(0,229,255,0.12)' : 'none',
                  letterSpacing: '0.12em',
                  borderBottom: activeTab === tab ? '2px solid rgba(0,229,255,0.6)' : '2px solid transparent',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Tab Content ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === '产品方案' && (() => {
                const allProducts = formulation.products;
                const durationWeeks = allProducts.length > 0 ? parseDurationWeeks(allProducts[0].duration) : 12;

                return (
                  <div className="relative bracket rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(9,18,32,0.95)', border: '1px solid rgba(0,229,255,0.15)' }}>

                    {/* ── Prescription Header ── */}
                    <div className="px-6 py-4 sm:px-8 sm:py-5"
                      style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(123,47,247,0.06))', borderBottom: '1px solid rgba(0,229,255,0.10)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-title text-lg sm:text-xl font-bold tracking-wide" style={{ color: '#00E5FF' }}>
                            患者个性化套餐
                          </h3>
                          <p className="font-data text-xs mt-1 tracking-wider" style={{ color: 'var(--text-dim)', letterSpacing: '0.15em' }}>
                            PERSONALIZED FORMULATION · {risk.level_label}风险 · {durationWeeks}周用量
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-data text-xs tracking-wider" style={{ color: 'var(--text-dim)' }}>PRODUCTS</p>
                          <p className="font-title text-2xl font-black" style={{ color: '#00E5FF' }}>{allProducts.length}</p>
                        </div>
                      </div>
                    </div>

                    {/* ── Product List (Prescription Style) ── */}
                    <div className="px-6 py-5 sm:px-8 sm:py-6">
                      <div className="rounded-xl overflow-hidden mb-6"
                        style={{ border: '1px solid rgba(0,229,255,0.08)' }}>
                        {allProducts.map((p, i) => {
                          const pal = productPalette(i, p.category === 'conditional');
                          const boxes = calcBoxes(p);
                          return (
                            <div key={p.product_id}
                              className="flex items-center justify-between px-5 py-3.5"
                              style={{
                                background: i % 2 === 0 ? 'rgba(3,7,18,0.5)' : 'rgba(3,7,18,0.3)',
                                borderBottom: i < allProducts.length - 1 ? '1px solid rgba(0,229,255,0.05)' : 'none',
                              }}>
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="font-data text-xs w-5 text-center flex-shrink-0" style={{ color: pal.color }}>{i + 1}</span>
                                <span className="font-body text-sm font-semibold truncate" style={{ color: 'var(--text-hi)' }}>{p.product_name}</span>
                                {p.category === 'conditional' && (
                                  <span className="font-data px-1.5 py-0.5 rounded flex-shrink-0"
                                    style={{ background: 'rgba(255,184,0,0.12)', color: '#FFB800', fontSize: 10 }}>条件</span>
                                )}
                              </div>
                              <span className="font-data text-sm font-bold flex-shrink-0 ml-4" style={{ color: pal.color }}>
                                × {boxes} 盒
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* ── Usage Instructions ── */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(0,229,255,0.2), transparent)' }} />
                        <span className="font-title text-xs tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>用法用量</span>
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(0,229,255,0.2), transparent)' }} />
                      </div>

                      <div className="space-y-4">
                        {allProducts.map((p, i) => {
                          const pal = productPalette(i, p.category === 'conditional');
                          return (
                            <div key={p.product_id} className="rounded-xl p-4 sm:p-5"
                              style={{ background: `linear-gradient(135deg, ${pal.bg}, rgba(3,7,18,0.5))`, border: `1px solid ${pal.border}` }}>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="font-data text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ background: `${pal.color}20`, color: pal.color }}>{i + 1}</span>
                                <span className="font-body text-sm font-bold" style={{ color: 'var(--text-hi)' }}>{p.product_name}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-3">
                                <div>
                                  <p className="font-data text-xs mb-1" style={{ color: 'var(--text-dim)', letterSpacing: '0.1em' }}>服用方法</p>
                                  <p className="font-body text-sm" style={{ color: 'var(--text-mid)' }}>{p.dose}</p>
                                </div>
                                <div>
                                  <p className="font-data text-xs mb-1" style={{ color: 'var(--text-dim)', letterSpacing: '0.1em' }}>频次</p>
                                  <p className="font-body text-sm" style={{ color: 'var(--text-mid)' }}>{p.frequency}</p>
                                </div>
                                <div>
                                  <p className="font-data text-xs mb-1" style={{ color: 'var(--text-dim)', letterSpacing: '0.1em' }}>疗程</p>
                                  <p className="font-body text-sm" style={{ color: 'var(--text-mid)' }}>{p.duration}</p>
                                </div>
                              </div>
                              <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>
                                {p.indication}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* ── Warnings ── */}
                      {allProducts.some(p => p.warnings?.length > 0) && (
                        <div className="mt-5 rounded-xl p-4" style={{ background: 'rgba(255,184,0,0.04)', border: '1px solid rgba(255,184,0,0.15)' }}>
                          <p className="font-data text-xs tracking-widest mb-3" style={{ color: 'rgba(255,184,0,0.7)', letterSpacing: '0.15em' }}>
                            ⚠ 用药注意事项
                          </p>
                          {allProducts.flatMap(p => (p.warnings || []).map((w: string, wi: number) => (
                            <p key={`${p.product_id}-${wi}`} className="font-body text-sm mb-1.5 leading-relaxed"
                              style={{ color: '#FFB800', lineHeight: 1.7 }}>{w}</p>
                          )))}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}

              {activeTab === '膳食干预' && (
                <InterventionPanel
                  title={formulation.diet_intervention.pattern}
                  sections={[
                    { label: '关键原则', items: formulation.diet_intervention.key_points, color: '#00E5FF' },
                    { label: '建议增加', items: formulation.diet_intervention.foods_to_increase, color: '#00FF94' },
                    { label: '建议减少', items: formulation.diet_intervention.foods_to_reduce, color: '#FF2D55' },
                  ].filter(s => s.items.length > 0)}
                />
              )}

              {activeTab === '运动处方' && (
                <div className="relative bracket rounded-2xl p-5 sm:p-8"
                  style={{ background: 'rgba(9,18,32,0.9)', border: '1px solid rgba(0,229,255,0.10)' }}>
                  <h3 className="font-title text-lg font-bold mb-8 tracking-wide" style={{ color: 'var(--text-hi)' }}>
                    {formulation.exercise_prescription.type}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                      { label: 'FREQUENCY', value: formulation.exercise_prescription.frequency },
                      { label: 'DURATION',  value: formulation.exercise_prescription.duration  },
                      { label: 'INTENSITY', value: formulation.exercise_prescription.intensity  },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl p-5 text-center"
                        style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.10)' }}>
                        <p className="font-data text-xs tracking-widest mb-3" style={{ color: 'var(--text-dim)', letterSpacing: '0.15em' }}>
                          {item.label}
                        </p>
                        <p className="font-body text-sm font-semibold" style={{ color: 'var(--text-hi)', lineHeight: 1.5 }}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  {formulation.exercise_prescription.precautions.length > 0 && (
                    <ListBlock label="注意事项" items={formulation.exercise_prescription.precautions} color="#FFB800" />
                  )}
                </div>
              )}

              {activeTab === '生活方式' && (
                <div className="relative bracket rounded-2xl p-5 sm:p-8"
                  style={{ background: 'rgba(9,18,32,0.9)', border: '1px solid rgba(0,229,255,0.10)' }}>
                  <ListBlock label="干预要点" items={formulation.lifestyle_intervention.key_points} color="#7B2FF7" />
                </div>
              )}

              {activeTab === '随访计划' && (
                <div className="relative bracket rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(9,18,32,0.95)', border: '1px solid rgba(123,47,247,0.15)' }}>

                  {/* Header */}
                  <div className="px-6 py-4 sm:px-8 sm:py-5"
                    style={{ background: 'linear-gradient(135deg, rgba(123,47,247,0.08), rgba(0,229,255,0.04))', borderBottom: '1px solid rgba(123,47,247,0.10)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-title text-lg sm:text-xl font-bold tracking-wide" style={{ color: '#7B2FF7' }}>
                          随访管理计划
                        </h3>
                        <p className="font-data text-xs mt-1 tracking-wider" style={{ color: 'var(--text-dim)', letterSpacing: '0.15em' }}>
                          FOLLOW-UP PLAN · 首次复查 {formulation.followup_plan.review_weeks} 周
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-data text-xs tracking-wider" style={{ color: 'var(--text-dim)' }}>WEEKS</p>
                        <p className="font-title text-2xl font-black" style={{ color: '#7B2FF7' }}>{formulation.followup_plan.review_weeks}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-5 sm:px-8 sm:py-6 space-y-5">
                    {/* Review schedule */}
                    <div className="flex items-center gap-5 rounded-xl p-5"
                      style={{ background: 'rgba(3,7,18,0.5)', border: '1px solid rgba(123,47,247,0.12)' }}>
                      <div className="text-center flex-shrink-0" style={{ minWidth: 60 }}>
                        <p className="font-title text-3xl font-black" style={{ color: '#7B2FF7' }}>{formulation.followup_plan.review_weeks}</p>
                        <p className="font-data text-xs tracking-widest" style={{ color: 'rgba(123,47,247,0.6)' }}>WEEKS</p>
                      </div>
                      <div className="h-12 w-px flex-shrink-0" style={{ background: 'rgba(123,47,247,0.2)' }} />
                      <div>
                        <p className="font-body text-sm font-semibold mb-1" style={{ color: 'var(--text-hi)' }}>
                          首次复查日期：{formulation.followup_plan.review_date}
                        </p>
                        <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-mid)', lineHeight: 1.6 }}>
                          {formulation.followup_plan.expected_outcome}
                        </p>
                      </div>
                    </div>

                    {/* Check items */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(123,47,247,0.2), transparent)' }} />
                        <span className="font-title text-xs tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>复查项目</span>
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(123,47,247,0.2), transparent)' }} />
                      </div>
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(123,47,247,0.08)' }}>
                        {formulation.followup_plan.items_to_check.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 px-5 py-3"
                            style={{
                              background: i % 2 === 0 ? 'rgba(3,7,18,0.5)' : 'rgba(3,7,18,0.3)',
                              borderBottom: i < formulation.followup_plan.items_to_check.length - 1 ? '1px solid rgba(123,47,247,0.05)' : 'none',
                            }}>
                            <span className="font-data text-xs w-5 text-center flex-shrink-0" style={{ color: '#7B2FF7' }}>{i + 1}</span>
                            <span className="font-body text-sm" style={{ color: 'var(--text-mid)' }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ── Expert Video Section (bottom) ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative bracket rounded-2xl mt-8 no-print"
          style={{
            background: 'linear-gradient(135deg, rgba(9,18,32,0.95), rgba(9,18,32,0.85))',
            border: '1px solid rgba(123,47,247,0.15)',
            padding: '24px',
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(123,47,247,0.15)', border: '1px solid rgba(123,47,247,0.3)' }}>
              <span style={{ fontSize: 16 }}>🎬</span>
            </div>
            <div>
              <h3 className="font-title text-sm font-semibold tracking-wider" style={{ color: 'var(--text-hi)' }}>专家视频解读</h3>
              <p className="font-data text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>EXPERT VIDEO · 了解脂肪酸干预原理</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { title: '平衡脂肪谱·改造免疫代谢失衡体质', speaker: '赵博士', url: 'http://cdn.gee4.cn/videos/20250517.mp4' },
              { title: '利用细胞再生·调整脂代谢失衡体质', speaker: '专家讲解', url: 'http://cdn.gee4.cn/videos/050429.mp4' },
              { title: '基于大数据·精准营养干预', speaker: '赵博士', url: 'http://cdn.gee4.cn/videos/zf.mp4' },
              { title: '脂均衡营养·控制三高', speaker: '专家讲解', url: 'http://cdn.gee4.cn/videos/zjhkzsg.mp4' },
            ].map((video, i) => (
              <a
                key={i}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl p-4 transition-all duration-300 block"
                style={{
                  background: 'rgba(3,7,18,0.6)',
                  border: '1px solid rgba(123,47,247,0.12)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,47,247,0.4)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(123,47,247,0.15)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,47,247,0.12)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full mb-3 mx-auto"
                  style={{ background: 'rgba(123,47,247,0.12)', border: '1px solid rgba(123,47,247,0.25)' }}>
                  <span style={{ fontSize: 18 }}>▶</span>
                </div>
                <p className="font-body text-xs font-semibold text-center leading-snug mb-1" style={{ color: 'var(--text-hi)', lineHeight: 1.4 }}>
                  {video.title}
                </p>
                <p className="font-data text-xs text-center" style={{ color: 'var(--text-dim)', fontSize: 10 }}>
                  {video.speaker}
                </p>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Medical Disclaimer + Footer */}
        <div className="mt-14 no-print">
          <div className="h-px mb-6" style={{ background: 'linear-gradient(to right, transparent, rgba(0,229,255,0.15), transparent)' }} />

          {/* Disclaimer per algorithm guide 6.2 */}
          <div className="rounded-xl p-5 mb-6"
            style={{ background: 'rgba(255,184,0,0.04)', border: '1px solid rgba(255,184,0,0.15)' }}>
            <p className="font-data text-xs tracking-widest mb-2" style={{ color: 'rgba(255,184,0,0.6)', letterSpacing: '0.15em' }}>
              MEDICAL DISCLAIMER
            </p>
            <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-dim)', lineHeight: 1.8 }}>
              本算法生成的干预配方为营养干预建议，基于特殊膳食食品（运动营养食品），不构成医疗诊断或处方药方案，不能替代专业医疗机构的诊断和治疗。TYMB® 系列产品均为特殊膳食食品，执行 GB 24154《运动营养食品通则》。所有推荐剂量及干预方案，患者在执行前建议与主治医生沟通确认，尤其是正在接受药物治疗的患者。
            </p>
          </div>

          <div className="text-center">
            <p className="font-data text-xs tracking-widest" style={{ color: 'var(--text-dim)', letterSpacing: '0.12em' }}>
              HWLL INTELLIGENT FORMULATION SYSTEM · Hopkins Washington Life Medicine Lab · 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterventionPanel({ title, sections }: {
  title: string;
  sections: { label: string; items: string[]; color: string }[];
}) {
  return (
    <div className="relative bracket rounded-2xl p-5 sm:p-8"
      style={{ background: 'rgba(9,18,32,0.9)', border: '1px solid rgba(0,229,255,0.10)' }}>
      <h3 className="font-title text-lg font-bold tracking-wide mb-6" style={{ color: 'var(--text-hi)' }}>{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sections.map(sec => <ListBlock key={sec.label} label={sec.label} items={sec.items} color={sec.color} />)}
      </div>
    </div>
  );
}

function ListBlock({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(3,7,18,0.6)', border: `1px solid ${color}18` }}>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}60` }} />
        <span className="font-title text-xs font-semibold tracking-widest" style={{ color, letterSpacing: '0.18em' }}>{label}</span>
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, opacity: 0.7 }} />
            <span className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-mid)', lineHeight: 1.7 }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
