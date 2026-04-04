import { useState } from 'react';
import { motion } from 'framer-motion';
import RiskGauge from '../components/RiskGauge';
import type { FormulationResult } from '../types';

interface Props {
  result: FormulationResult;
  onRestart: () => void;
}

const TABS = ['产品方案', '地中海膳食', '运动处方', '生活方式', '随访计划'] as const;

const PRODUCT_COLORS: Record<string, { bg: string; border: string; accent: string }> = {
  'TYMB-EPA': { bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.25)', accent: '#06B6D4' },
  'TYMB-GSH': { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', accent: '#3B82F6' },
  'TYMB-PRO': { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)', accent: '#a855f7' },
  'default-core': { bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.25)', accent: '#06B6D4' },
  'default-conditional': { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', accent: '#f59e0b' },
};

function getProductColor(id: string, category: string) {
  return PRODUCT_COLORS[id] || PRODUCT_COLORS[`default-${category}`];
}

export default function ReportPage({ result, onRestart }: Props) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('产品方案');
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);
  const { risk_assessment: risk, formulation, patient } = result;
  const core = formulation.products.filter(p => p.category === 'core');
  const conditional = formulation.products.filter(p => p.category === 'conditional');

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#0D1117' }}>
      <div className="max-w-5xl mx-auto">
        {/* 顶部 */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onRestart} className="flex items-center gap-2 text-sm transition-colors" style={{ color: '#8b949e' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e6edf3')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}>
            ← 重新开始
          </button>
          <div className="flex gap-8" style={{ color: '#6e7681' }}>
            {['上传 PDF', '确认数值', '查看配方'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: '#22c55e', color: '#fff' }}>✓</span>
                <span style={{ color: i === 2 ? '#e6edf3' : '#22c55e' }}>{step}</span>
                {i < 2 && <span style={{ color: '#30363d' }}>→</span>}
              </div>
            ))}
          </div>
          <button onClick={handlePrint}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-all"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06B6D4' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.1)'; }}>
            ⬇ 打印/导出
          </button>
        </div>

        {/* 报告标题 */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="rounded-2xl p-6" style={{ background: '#161b22', border: '1px solid #30363d' }}>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* 风险仪表盘 */}
              <div className="flex-shrink-0">
                <RiskGauge
                  level={risk.level}
                  aaEpaRatio={risk.primary_indicators.aa_epa_ratio}
                  epaPct={risk.primary_indicators.epa_pct}
                  omega3Index={risk.primary_indicators.omega3_index}
                  summary={risk.risk_summary}
                />
              </div>
              {/* 患者信息 + 方案概述 */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <h1 className="text-xl font-bold text-white">{patient.name || '未命名患者'}</h1>
                    <p className="text-sm" style={{ color: '#8b949e' }}>
                      {[patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : null, patient.age ? `${patient.age}岁` : null].filter(Boolean).join(' · ') || '基本信息未填写'}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg p-4" style={{ background: '#0D1117', border: '1px solid #21262d' }}>
                  <p className="text-xs leading-relaxed" style={{ color: '#8b949e' }}>{risk.risk_summary}</p>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: '#6e7681' }}>
                  <span>算法版本 {result.formulation_version}</span>
                  <span>·</span>
                  <span>生成时间 {new Date(result.generated_at).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab 区域 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {/* Tab 导航 */}
          <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: '#161b22', border: '1px solid #30363d' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: activeTab === tab ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.2))' : 'transparent',
                  color: activeTab === tab ? '#e6edf3' : '#6e7681',
                  border: activeTab === tab ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent',
                }}>
                {tab}
              </button>
            ))}
          </div>

          {/* 产品方案 */}
          {activeTab === '产品方案' && (
            <div>
              {core.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(6,182,212,0.15)', color: '#06B6D4' }}>核心方案</span>
                    <span className="text-xs" style={{ color: '#6e7681' }}>必须使用</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {core.map(p => <ProductCard key={p.product_id} product={p} expanded={expandedEvidence === p.product_id} onToggle={() => setExpandedEvidence(expandedEvidence === p.product_id ? null : p.product_id)} />)}
                  </div>
                </div>
              )}
              {conditional.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>条件方案</span>
                    <span className="text-xs" style={{ color: '#6e7681' }}>根据适应症触发</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {conditional.map(p => <ProductCard key={p.product_id} product={p} expanded={expandedEvidence === p.product_id} onToggle={() => setExpandedEvidence(expandedEvidence === p.product_id ? null : p.product_id)} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 地中海膳食 */}
          {activeTab === '地中海膳食' && (
            <div className="rounded-xl p-6" style={{ background: '#161b22', border: '1px solid #30363d' }}>
              <h3 className="text-white font-semibold mb-1">{formulation.diet_intervention.pattern}</h3>
              <p className="text-xs mb-5" style={{ color: '#6e7681' }}>{formulation.diet_intervention.evidence}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoBlock title="关键原则" items={formulation.diet_intervention.key_points} accent="#06B6D4" />
                <InfoBlock title="建议增加" items={formulation.diet_intervention.foods_to_increase} accent="#22c55e" />
                <InfoBlock title="建议减少" items={formulation.diet_intervention.foods_to_reduce} accent="#ef4444" />
              </div>
            </div>
          )}

          {/* 运动处方 */}
          {activeTab === '运动处方' && (
            <div className="rounded-xl p-6" style={{ background: '#161b22', border: '1px solid #30363d' }}>
              <h3 className="text-white font-semibold mb-4">{formulation.exercise_prescription.type}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: '频次', value: formulation.exercise_prescription.frequency },
                  { label: '时长', value: formulation.exercise_prescription.duration },
                  { label: '强度', value: formulation.exercise_prescription.intensity },
                  { label: '循证依据', value: formulation.exercise_prescription.evidence.split('，')[0] },
                ].map(item => (
                  <div key={item.label} className="rounded-lg p-3 text-center" style={{ background: '#0D1117', border: '1px solid #21262d' }}>
                    <div className="text-xs mb-1" style={{ color: '#6e7681' }}>{item.label}</div>
                    <div className="text-sm font-medium text-white">{item.value}</div>
                  </div>
                ))}
              </div>
              {formulation.exercise_prescription.precautions.length > 0 && (
                <InfoBlock title="注意事项" items={formulation.exercise_prescription.precautions} accent="#f59e0b" />
              )}
            </div>
          )}

          {/* 生活方式 */}
          {activeTab === '生活方式' && (
            <div className="rounded-xl p-6" style={{ background: '#161b22', border: '1px solid #30363d' }}>
              <InfoBlock title="干预要点" items={formulation.lifestyle_intervention.key_points} accent="#3B82F6" />
              <p className="text-xs mt-4" style={{ color: '#6e7681' }}>{formulation.lifestyle_intervention.evidence}</p>
            </div>
          )}

          {/* 随访计划 */}
          {activeTab === '随访计划' && (
            <div className="rounded-xl p-6" style={{ background: '#161b22', border: '1px solid #30363d' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="rounded-lg p-4 mb-4" style={{ background: '#0D1117', border: '1px solid rgba(6,182,212,0.2)' }}>
                    <div className="text-xs mb-1" style={{ color: '#6e7681' }}>建议复查时间</div>
                    <div className="text-2xl font-bold" style={{ color: '#06B6D4' }}>{formulation.followup_plan.review_weeks} 周后</div>
                    <div className="text-sm mt-1" style={{ color: '#8b949e' }}>{formulation.followup_plan.review_date}</div>
                  </div>
                  <div className="rounded-lg p-4" style={{ background: '#0D1117', border: '1px solid #21262d' }}>
                    <div className="text-xs mb-2" style={{ color: '#6e7681' }}>预期目标</div>
                    <p className="text-sm leading-relaxed" style={{ color: '#e6edf3' }}>{formulation.followup_plan.expected_outcome}</p>
                  </div>
                </div>
                <InfoBlock title="复查项目" items={formulation.followup_plan.items_to_check} accent="#a855f7" />
              </div>
            </div>
          )}
        </motion.div>

        {/* 页脚 */}
        <div className="mt-8 text-center text-xs" style={{ color: '#6e7681' }}>
          <p>本方案基于循证医学算法生成，仅供医疗专业人员参考，不替代临床诊疗判断。</p>
          <p className="mt-1">HWLL 智能配方系统 · APEX AI · © 2026</p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, expanded, onToggle }: { product: any; expanded: boolean; onToggle: () => void }) {
  const colors = getProductColor(product.product_id, product.category);
  return (
    <motion.div layout className="rounded-xl p-5 cursor-pointer transition-all"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
      onClick={onToggle}
      whileHover={{ scale: 1.01 }}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-white text-sm leading-tight">{product.product_name}</h3>
        <div className="flex gap-1 flex-wrap justify-end">
          {product.evidence.map((e: any) => (
            <span key={e.citation_id} className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{ background: `${colors.accent}20`, color: colors.accent, border: `1px solid ${colors.accent}30` }}>
              {e.citation_id}
            </span>
          ))}
        </div>
      </div>
      <div className="text-xl font-bold mb-1" style={{ color: colors.accent, fontFamily: 'monospace' }}>
        {product.dose_per_serving}
      </div>
      <div className="text-xs mb-2" style={{ color: '#8b949e' }}>
        {product.frequency} · {product.duration}
      </div>
      <p className="text-xs leading-relaxed" style={{ color: '#6e7681' }}>
        {product.indication}
      </p>
      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
          {product.evidence.map((e: any) => (
            <div key={e.citation_id} className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold" style={{ color: colors.accent }}>{e.citation_id}</span>
                <span className="text-xs font-medium text-white">{e.citation_label}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#8b949e' }}>{e.statement}</p>
              <p className="text-xs mt-1 italic" style={{ color: '#6e7681' }}>{e.source}</p>
            </div>
          ))}
          {product.warnings.length > 0 && (
            <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${colors.border}` }}>
              {product.warnings.map((w: string, i: number) => (
                <p key={i} className="text-xs" style={{ color: '#fbbf24' }}>⚠ {w}</p>
              ))}
            </div>
          )}
        </motion.div>
      )}
      <div className="text-xs mt-3 text-right" style={{ color: '#6e7681' }}>
        {expanded ? '收起 ↑' : '查看循证 ↓'}
      </div>
    </motion.div>
  );
}

function InfoBlock({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div className="rounded-lg p-4" style={{ background: '#0D1117', border: `1px solid ${accent}20` }}>
      <div className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: accent }}>
        <div className="w-1 h-4 rounded-full" style={{ background: accent }} />
        {title}
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-xs flex items-start gap-2 leading-relaxed" style={{ color: '#8b949e' }}>
            <span className="mt-0.5 flex-shrink-0" style={{ color: accent }}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
