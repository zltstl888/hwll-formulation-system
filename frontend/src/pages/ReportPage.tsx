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

export default function ReportPage({ result, onRestart }: Props) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('产品方案');
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);
  const { risk_assessment: risk, formulation, patient } = result;
  const coreProducts = formulation.products.filter(p => p.category === 'core');
  const condProducts = formulation.products.filter(p => p.category === 'conditional');

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

          <div className="flex flex-col xl:flex-row items-center xl:items-start gap-6 sm:gap-10 p-6 pt-10 sm:p-10 sm:pt-14">
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

        {/* ── Tab Navigation ── */}
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
                className="flex-none sm:flex-1 py-3 px-3 sm:px-1 rounded-xl font-title text-xs font-semibold tracking-wider transition-all duration-300 whitespace-nowrap"
                style={{
                  background: activeTab === tab
                    ? 'linear-gradient(135deg, rgba(0,229,255,0.14), rgba(123,47,247,0.16))'
                    : 'transparent',
                  border: `1px solid ${activeTab === tab ? 'rgba(0,229,255,0.35)' : 'transparent'}`,
                  color: activeTab === tab ? '#00E5FF' : 'var(--text-dim)',
                  boxShadow: activeTab === tab ? '0 0 20px rgba(0,229,255,0.12)' : 'none',
                  letterSpacing: '0.12em',
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
              {activeTab === '产品方案' && (
                <div className="space-y-8">
                  {coreProducts.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(0,229,255,0.3), transparent)' }} />
                        <span className="font-title text-xs tracking-[0.22em] px-4 py-1.5 rounded-full"
                          style={{ color: '#00E5FF', border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.06)' }}>
                          核心产品方案
                        </span>
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(0,229,255,0.3), transparent)' }} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {coreProducts.map((p, i) => (
                          <ProductCard
                            key={p.product_id}
                            product={p}
                            palette={productPalette(i, false)}
                            expanded={expandedEvidence === p.product_id}
                            onToggle={() => setExpandedEvidence(expandedEvidence === p.product_id ? null : p.product_id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {condProducts.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(255,184,0,0.25), transparent)' }} />
                        <span className="font-title text-xs tracking-[0.22em] px-4 py-1.5 rounded-full"
                          style={{ color: '#FFB800', border: '1px solid rgba(255,184,0,0.3)', background: 'rgba(255,184,0,0.06)' }}>
                          条件触发方案
                        </span>
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(255,184,0,0.25), transparent)' }} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {condProducts.map((p, i) => (
                          <ProductCard
                            key={p.product_id}
                            product={p}
                            palette={productPalette(i, true)}
                            expanded={expandedEvidence === p.product_id}
                            onToggle={() => setExpandedEvidence(expandedEvidence === p.product_id ? null : p.product_id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === '膳食干预' && (
                <InterventionPanel
                  title={formulation.diet_intervention.pattern}
                  evidence={formulation.diet_intervention.evidence}
                  sections={[
                    { label: '关键原则', items: formulation.diet_intervention.key_points, color: '#00E5FF' },
                    { label: '建议增加', items: formulation.diet_intervention.foods_to_increase, color: '#00FF94' },
                    { label: '建议减少', items: formulation.diet_intervention.foods_to_reduce, color: '#FF2D55' },
                  ]}
                />
              )}

              {activeTab === '运动处方' && (
                <div className="relative bracket rounded-2xl p-5 sm:p-8"
                  style={{ background: 'rgba(9,18,32,0.9)', border: '1px solid rgba(0,229,255,0.10)' }}>
                  <h3 className="font-title text-lg font-bold mb-8 tracking-wide" style={{ color: 'var(--text-hi)' }}>
                    {formulation.exercise_prescription.type}
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: 'FREQUENCY', value: formulation.exercise_prescription.frequency },
                      { label: 'DURATION',  value: formulation.exercise_prescription.duration  },
                      { label: 'INTENSITY', value: formulation.exercise_prescription.intensity  },
                      { label: 'EVIDENCE',  value: formulation.exercise_prescription.evidence.split('，')[0] },
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
                  <p className="font-body text-sm mt-6 pt-5 leading-relaxed"
                    style={{ color: 'var(--text-mid)', borderTop: '1px solid rgba(0,229,255,0.06)', lineHeight: 1.75 }}>
                    {formulation.lifestyle_intervention.evidence}
                  </p>
                </div>
              )}

              {activeTab === '随访计划' && (
                <div className="relative bracket rounded-2xl p-5 sm:p-8"
                  style={{ background: 'rgba(9,18,32,0.9)', border: '1px solid rgba(0,229,255,0.10)' }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <div className="rounded-2xl p-7 text-center"
                        style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)' }}>
                        <p className="font-data text-xs tracking-widest mb-4" style={{ color: 'var(--text-dim)', letterSpacing: '0.18em' }}>
                          NEXT REVIEW
                        </p>
                        <p className="font-title text-5xl font-black mb-2 text-glow-cyan" style={{ color: '#00E5FF' }}>
                          {formulation.followup_plan.review_weeks}
                        </p>
                        <p className="font-data text-lg tracking-widest" style={{ color: 'rgba(0,229,255,0.6)' }}>WEEKS</p>
                        <p className="font-body text-sm mt-3" style={{ color: 'var(--text-mid)' }}>
                          {formulation.followup_plan.review_date}
                        </p>
                      </div>
                      <div className="rounded-xl p-5"
                        style={{ background: 'rgba(3,7,18,0.6)', border: '1px solid rgba(0,229,255,0.08)' }}>
                        <p className="font-data text-xs tracking-widest mb-3" style={{ color: 'var(--text-dim)', letterSpacing: '0.15em' }}>EXPECTED OUTCOME</p>
                        <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-mid)', lineHeight: 1.75 }}>
                          {formulation.followup_plan.expected_outcome}
                        </p>
                      </div>
                    </div>
                    <ListBlock label="复查项目" items={formulation.followup_plan.items_to_check} color="#7B2FF7" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <div className="mt-14 text-center no-print">
          <div className="h-px mb-6" style={{ background: 'linear-gradient(to right, transparent, rgba(0,229,255,0.15), transparent)' }} />
          <p className="font-body text-sm mb-1" style={{ color: 'var(--text-dim)', lineHeight: 1.8 }}>
            本方案基于循证医学算法生成，仅供医疗专业人员参考，不替代临床诊疗判断
          </p>
          <p className="font-data text-xs tracking-widest" style={{ color: 'var(--text-dim)', letterSpacing: '0.12em' }}>
            HWLL INTELLIGENT FORMULATION SYSTEM · Hopkins Washington Life Medicine Lab · 2026
          </p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, palette, expanded, onToggle }: { product: any; palette: ReturnType<typeof productPalette>; expanded: boolean; onToggle: () => void }) {
  return (
    <motion.div
      layout
      onClick={onToggle}
      className="relative bracket rounded-2xl p-6 cursor-pointer transition-all duration-300 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${palette.bg}, rgba(9,18,32,0.9))`,
        border: `1px solid ${palette.border}`,
        boxShadow: expanded ? `0 0 30px ${palette.glow}` : 'none',
      }}
      whileHover={{ scale: 1.015, boxShadow: `0 0 25px ${palette.glow}` }}
    >
      {/* Category badge */}
      <div className="absolute top-4 right-4">
        {product.category === 'core'
          ? <span className="font-data text-xs tracking-wider px-2 py-1 rounded-md"
              style={{ background: `${palette.color}18`, color: palette.color, border: `1px solid ${palette.color}30` }}>CORE</span>
          : <span className="font-data text-xs tracking-wider px-2 py-1 rounded-md"
              style={{ background: 'rgba(255,184,0,0.12)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.3)' }}>COND</span>
        }
      </div>

      {/* Product name */}
      <h3 className="font-title text-sm font-bold mb-1 pr-16 tracking-wide leading-tight" style={{ color: 'var(--text-hi)' }}>
        {product.product_name}
      </h3>

      {/* Dose — the hero number */}
      <div className="my-5">
        <p className="font-data text-3xl font-bold leading-none mb-1"
          style={{ color: palette.color, textShadow: `0 0 20px ${palette.glow}`, letterSpacing: '0.04em' }}>
          {product.dose_per_serving}
        </p>
        <p className="font-body text-sm" style={{ color: 'var(--text-mid)', letterSpacing: '0.05em' }}>
          {product.frequency}
          <span className="mx-2 opacity-40">·</span>
          {product.duration}
        </p>
      </div>

      {/* Indication */}
      <p className="font-body leading-relaxed mb-5" style={{ color: 'var(--text-mid)', lineHeight: 1.8, fontSize: 14 }}>
        {product.indication}
      </p>

      {/* Evidence tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {product.evidence.map((e: any) => (
          <span key={e.citation_id}
            className="font-data text-xs px-2.5 py-1 rounded-lg tracking-wider"
            style={{ background: `${palette.color}12`, color: palette.color, border: `1px solid ${palette.color}25` }}>
            {e.citation_id}
          </span>
        ))}
      </div>

      {/* Expanded evidence */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4" style={{ borderTop: `1px solid ${palette.border}` }}>
              {product.evidence.map((e: any) => (
                <div key={e.citation_id} className="rounded-xl p-4"
                  style={{ background: 'rgba(3,7,18,0.6)', border: `1px solid ${palette.color}15` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-data text-xs font-bold tracking-wider px-2 py-0.5 rounded"
                      style={{ background: `${palette.color}18`, color: palette.color }}>
                      {e.citation_id}
                    </span>
                    <span className="font-body text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>{e.citation_label}</span>
                  </div>
                  <p className="font-body text-sm leading-relaxed mb-1.5" style={{ color: 'var(--text-mid)', lineHeight: 1.7 }}>
                    {e.statement}
                  </p>
                  <p className="font-data text-xs italic" style={{ color: 'var(--text-dim)' }}>{e.source}</p>
                </div>
              ))}
              {product.warnings?.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.2)' }}>
                  {product.warnings.map((w: string, i: number) => (
                    <p key={i} className="font-body text-sm" style={{ color: '#FFB800' }}>⚠&ensp;{w}</p>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle hint */}
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${palette.border}, transparent)` }} />
        <span className="font-data text-xs tracking-wider" style={{ color: 'var(--text-dim)' }}>
          {expanded ? '收起 ↑' : '查看循证依据 ↓'}
        </span>
      </div>
    </motion.div>
  );
}

function InterventionPanel({ title, evidence, sections }: {
  title: string;
  evidence: string;
  sections: { label: string; items: string[]; color: string }[];
}) {
  return (
    <div className="relative bracket rounded-2xl p-5 sm:p-8"
      style={{ background: 'rgba(9,18,32,0.9)', border: '1px solid rgba(0,229,255,0.10)' }}>
      <h3 className="font-title text-lg font-bold tracking-wide mb-2" style={{ color: 'var(--text-hi)' }}>{title}</h3>
      <p className="font-body text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-mid)', lineHeight: 1.75 }}>{evidence}</p>
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
