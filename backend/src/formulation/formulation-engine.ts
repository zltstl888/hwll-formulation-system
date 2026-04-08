// HWLL 智能配方算法 — 核心引擎
// 版本: v2.0 | 甲方自留核心知识产权
// 作者: Jerry (APEX AI CTO) | 2026-04-05
//
// 算法依据：
//   - 血脂异常医学营养管理专家共识(2023)，刘英华通信作者
//   - 益生菌HDL3终末期肾病-iMeta(2025)，刘英华团队
//   - Omega3Q10协同效应RCT(2026)，刘英华团队
//   - 免疫营养素临床应用专家共识(2023)，刘英华通信作者
//   - HWLL 45例脂肪谱统计数据库(2025)
//   - JELIS大型RCT (Lancet 2007)
//   - 纳豆激酶RCT (2019, n=1062)
//   - 红曲Meta分析 (2022, 13项RCT)
//   - 谷胱甘肽临床研究 (BMC Gastroenterology 2017)
//
// ⚠️ 本文件为HWLL健康管理系统甲方自留IP，禁止向外包团队披露

import {
  RiskLevel,
  RISK_LEVEL_LABELS,
  LipidProfileReport,
  PatientContext,
  ProductRecommendation,
  FormulationResult,
  RiskAssessment,
  DietIntervention,
  ExercisePrescription,
  LifestyleIntervention,
  FollowupPlan,
} from './types';
import { EVIDENCE, getEvidence } from './evidence-db';
import { PRODUCT_CATALOG, getProductById } from './product-catalog';

export const FORMULATION_VERSION = 'v2.0';

// ─────────────────────────────────────────────
// 1. 风险分级
// 参照〔血脂共识2023〕+〔HWLL数据库-2025〕
// ─────────────────────────────────────────────
export function classifyRisk(report: LipidProfileReport): RiskLevel {
  const { aa_epa_ratio, epa, omega3_index } = report;
  const ratio = aa_epa_ratio ?? 0;
  const epaPct = epa ?? 0;
  const o3idx = omega3_index ?? null;

  // 严重：AA:EPA>30 或 EPA<0.5% 或 Omega-3指数<4%
  // 参照〔HWLL数据库-2025〕45例统计：严重级别占~55%
  if (ratio > 30 || epaPct < 0.5 || (o3idx !== null && o3idx < 4)) return 'critical';

  // 中度：AA:EPA>10 或 EPA<1.5% 或 Omega-3指数<7%
  if (ratio > 10 || epaPct < 1.5 || (o3idx !== null && o3idx < 7)) return 'moderate';

  // 轻度：AA:EPA>3 或 EPA<3% 或 Omega-3指数<10%
  // 参照〔血脂共识2023〕：Omega-3指数<8%为心血管风险增加阈值
  if (ratio > 3 || epaPct < 3 || (o3idx !== null && o3idx < 10)) return 'mild';

  return 'normal';
}

function buildRiskSummary(report: LipidProfileReport, level: RiskLevel): string {
  const ratio = report.aa_epa_ratio;
  const epa = report.epa;
  const o3 = report.omega3_index;
  const parts: string[] = [];

  if (ratio !== null) {
    const refRatio = '1-3';
    const times = ratio > 3 ? `超标${(ratio / 3).toFixed(1)}倍` : '正常范围内';
    parts.push(`AA:EPA比值${ratio}（参考值${refRatio}，${times}）`);
  }
  if (epa !== null) {
    const status = epa < 0.5 ? '严重缺乏' : epa < 1.5 ? '明显缺乏' : epa < 3 ? '轻度缺乏' : '正常';
    parts.push(`EPA占比${epa}%（参考值3-9%，${status}）`);
  }
  if (o3 !== null) {
    const status = o3 < 4 ? '极低（心血管高风险）' : o3 < 8 ? '低于心血管保护阈值' : '正常';
    parts.push(`Omega-3指数${o3}%（参考值≥8%，${status}）`);
  }

  const levelDescriptions: Record<RiskLevel, string> = {
    critical: '重度脂肪酸失衡，慢性炎症风险极高，需立即启动强化干预方案。参照〔HWLL数据库-2025〕，此类患者约占检测人群55%。',
    moderate: '中度脂肪酸失衡，存在显著心血管代谢风险，建议积极干预。',
    mild: '轻度脂肪酸失衡，Omega-3轻度偏低，建议预防性营养干预。',
    normal: '脂肪酸谱基本平衡，Omega-3水平达标，建议维持性营养支持。',
  };

  return parts.join('；') + '。' + levelDescriptions[level];
}

// ─────────────────────────────────────────────
// 2. 条件性产品触发逻辑
// ─────────────────────────────────────────────
function shouldAddNatto(report: LipidProfileReport): boolean {
  // 血脂异常指标触发（边缘性升高即推荐，提前干预）
  if ((report as any).total_cholesterol != null && (report as any).total_cholesterol >= 5.2) return true;
  if ((report as any).ldl_c != null && (report as any).ldl_c >= 3.4) return true;
  if ((report as any).triglyceride != null && (report as any).triglyceride >= 1.7) return true;
  return false;
}

function shouldAddPeptide(patient: PatientContext): boolean {
  const keywords = ['肿瘤', '癌', '手术', '术后', '化疗', '放疗', '营养不良', '低白蛋白', '消瘦', '体重减轻'];
  const text = [patient.diagnosis, patient.medical_history].filter(Boolean).join(' ');
  return keywords.some(kw => text.includes(kw));
}

function shouldAddShuyan(patient: PatientContext): boolean {
  const keywords = ['免疫', '过敏', '肠炎', '感染', '炎症', '桥本', '自身免疫', '肺结节', '鼻炎', '哮喘', '湿疹', '荨麻疹'];
  const text = [patient.diagnosis, patient.medical_history].filter(Boolean).join(' ');
  return keywords.some(kw => text.includes(kw));
}

// ─────────────────────────────────────────────
// 3. 禁忌检查
// ─────────────────────────────────────────────
function checkContraindications(product_id: string, patient: PatientContext): string[] {
  const catalog = getProductById(product_id);
  if (!catalog || catalog.contraindication_keywords.length === 0) return [];
  const meds = [patient.current_medications, patient.medical_history].filter(Boolean).join(' ');
  if (catalog.contraindication_keywords.some(kw => meds.includes(kw))) {
    return catalog.contraindication_warnings;
  }
  return [];
}

// ─────────────────────────────────────────────
// 4. 产品推荐列表构建
// ─────────────────────────────────────────────
function buildProducts(
  level: RiskLevel,
  report: LipidProfileReport,
  patient: PatientContext
): ProductRecommendation[] {
  const products: ProductRecommendation[] = [];

  // ── 核心推荐：EPA鱼油（所有等级必推）
  {
    const catalog = getProductById('epa_fish_oil')!;
    const dose = catalog.doses[level]!;
    const ratio = report.aa_epa_ratio;
    const epa = report.epa;
    const indication = ratio !== null
      ? `患者AA:EPA=${ratio}（参考值1-3），EPA=${epa ?? 'N/A'}%（参考值3-9%），需补充EPA${level === 'critical' ? '≥3000mg/d' : level === 'moderate' ? '≥3000mg/d' : level === 'mild' ? '≥1800mg/d' : '600mg/d维持'}，达到指南推荐有效剂量阈值`
      : '脂肪酸检测提示需要补充Omega-3';
    products.push({
      product_id: catalog.product_id,
      product_name: catalog.product_name,
      category: 'core',
      dose: dose.dose,
      dose_per_serving: dose.dose_per_serving,
      frequency: dose.frequency,
      duration: dose.duration,
      indication,
      evidence: getEvidence(...dose.evidence_ids),
      warnings: checkContraindications(catalog.product_id, patient),
    });
  }

  // ── 核心推荐：谷胱甘肽多维（严重/中度）
  if (level === 'critical' || level === 'moderate') {
    const catalog = getProductById('glutathione_multi')!;
    const dose = catalog.doses[level]!;
    products.push({
      product_id: catalog.product_id,
      product_name: catalog.product_name,
      category: 'core',
      dose: dose.dose,
      dose_per_serving: dose.dose_per_serving,
      frequency: dose.frequency,
      duration: dose.duration,
      indication: `${RISK_LEVEL_LABELS[level]}脂肪酸失衡通常伴随显著氧化应激，GSH作为细胞内核心抗氧化物，与EPA鱼油形成协同抗炎体系。参照〔GSH-BMC-2017〕有效剂量300mg/d`,
      evidence: getEvidence(...dose.evidence_ids),
      warnings: checkContraindications(catalog.product_id, patient),
    });
  }

  // ── 核心推荐：七联益生菌粉（严重/中度/轻度）
  if (level !== 'normal') {
    const catalog = getProductById('seven_probiotics')!;
    const dose = catalog.doses[level]!;
    products.push({
      product_id: catalog.product_id,
      product_name: catalog.product_name,
      category: 'core',
      dose: dose.dose,
      dose_per_serving: dose.dose_per_serving,
      frequency: dose.frequency,
      duration: dose.duration,
      indication: `脂肪酸失衡患者HDL水平普遍偏低，益生菌通过ABCA1肠道通路恢复HDL3分泌，与EPA协同改善心血管保护功能。参照〔益生菌HDL3-iMeta-2025〕：6个月干预，CVD死亡0例（对照组6例）`,
      evidence: getEvidence(...dose.evidence_ids),
      warnings: checkContraindications(catalog.product_id, patient),
    });
  }

  // ── 条件性推荐：纳豆红曲粉（血脂异常触发）
  if (shouldAddNatto(report)) {
    const catalog = getProductById('natto_red_yeast')!;
    const dose = catalog.doses[level] ?? catalog.doses['moderate']!;
    const tc = (report as any).total_cholesterol;
    const ldl = (report as any).ldl_c;
    const tg = (report as any).triglyceride;
    const triggers: string[] = [];
    if (tc != null && tc >= 5.2) triggers.push(`TC ${tc} mmol/L（≥5.2 边缘性升高）`);
    if (ldl != null && ldl >= 3.4) triggers.push(`LDL-C ${ldl} mmol/L（≥3.4 边缘性升高）`);
    if (tg != null && tg >= 1.7) triggers.push(`TG ${tg} mmol/L（≥1.7 边缘性升高）`);
    products.push({
      product_id: catalog.product_id,
      product_name: catalog.product_name,
      category: 'conditional',
      dose: dose.dose,
      dose_per_serving: dose.dose_per_serving,
      frequency: dose.frequency,
      duration: dose.duration,
      indication: `血脂指标异常触发：${triggers.join('；')}。纳豆激酶+红曲莫纳可林K协同降低LDL-C和TG。参照〔纳豆激酶RCT-2019〕n=1062，26周显著降脂`,
      evidence: getEvidence(...dose.evidence_ids),
      warnings: checkContraindications(catalog.product_id, patient),
    });
  }

  // ── 条件性推荐：短肽多种营养素（肿瘤/术后人群）
  if (shouldAddPeptide(patient)) {
    const catalog = getProductById('peptide_nutrients')!;
    const dose = catalog.doses[level] ?? catalog.doses['moderate']!;
    products.push({
      product_id: catalog.product_id,
      product_name: catalog.product_name,
      category: 'conditional',
      dose: dose.dose,
      dose_per_serving: dose.dose_per_serving,
      frequency: dose.frequency,
      duration: dose.duration,
      indication: `患者存在肿瘤/术后/营养不良状态（${patient.diagnosis || '见病史记录'}），短肽肠内营养改善蛋白质合成，维持白蛋白水平。参照〔免疫营养共识2023〕`,
      evidence: getEvidence(...dose.evidence_ids),
      warnings: checkContraindications(catalog.product_id, patient),
    });
  }

  // ── 条件性推荐：纾炏宁口溶粉（免疫/炎症人群）
  if (shouldAddShuyan(patient)) {
    const catalog = getProductById('shuyan_ning')!;
    const dose = catalog.doses[level] ?? catalog.doses['moderate']!;
    products.push({
      product_id: catalog.product_id,
      product_name: catalog.product_name,
      category: 'conditional',
      dose: dose.dose,
      dose_per_serving: dose.dose_per_serving,
      frequency: dose.frequency,
      duration: dose.duration,
      indication: `患者存在免疫/炎症相关状态（${patient.diagnosis || '见诊断记录'}），接骨木莓+专利益生菌调节免疫功能，抑制慢性炎症`,
      evidence: getEvidence(...dose.evidence_ids),
      warnings: checkContraindications(catalog.product_id, patient),
    });
  }

  return products;
}

// ─────────────────────────────────────────────
// 5. 饮食干预方案
// 参照〔血脂共识2023〕地中海膳食（同意比例98.61%）
// ─────────────────────────────────────────────
function buildDietPlan(level: RiskLevel, dietaryRecommendations: string[] = []): DietIntervention {
  // 优先使用检测报告中的精准营养建议原文（合规要求：不发散不创新）
  if (dietaryRecommendations.length > 0) {
    return {
      pattern: '精准营养建议（基于脂肪谱检测报告）',
      key_points: dietaryRecommendations,
      foods_to_increase: [],
      foods_to_reduce: [],
      evidence: '以上建议基于患者个体脂肪酸谱检测数据精准生成',
    };
  }

  // Fallback：检测报告未提供营养建议时，使用算法生成
  const isSevere = level === 'critical' || level === 'moderate';
  return {
    pattern: isSevere ? '地中海膳食模式（Mediterranean Diet）' : '低脂均衡膳食',
    key_points: isSevere ? [
      '以橄榄油（或亚麻籽油）替代大豆油、葵花籽油、玉米油，每日用油量控制在25-30ml',
      '每周深海鱼类（鲫鱼、鲢鳙、鲈鱼、黄花鱼、带鱼）≥3次，每次≥100g',
      '蔬菜≥500g/d，以深绿色叶菜为主，增加3-4倍现有摄入量',
      '全谷物主食比例≥50%（燕麦、糙米、全麦面包），减少精白米面',
      '减少淀粉和糖分高的食物：米饭、面食、红薯、山药、苹果、香蕉等减少10-15%',
      '每周豆类（黄豆、黑豆、鹰嘴豆）≥3次，提供植物蛋白和纤维',
      '减少肉类（牛肉、猪肉）摄入约20%，以鱼禽替代',
    ] : [
      '均衡低脂饮食，蔬菜≥400g/d',
      '全谷物主食50-150g/d',
      '每周深海鱼≥2次',
      '减少油炸、高脂加工食品',
    ],
    foods_to_increase: isSevere
      ? ['深海鱼类', '亚麻籽/奇亚籽', '核桃', '深绿色叶菜', '豆类', '燕麦']
      : ['蔬菜水果', '全谷物', '优质蛋白'],
    foods_to_reduce: isSevere
      ? ['大豆油/葵花籽油/玉米油', '精白米面', '红肉（牛羊猪肉）', '加工食品', '含糖饮料']
      : ['油炸食品', '高脂加工食品', '含糖饮料'],
    evidence: '参照〔血脂共识2023〕：地中海膳食模式与心血管保护（专家同意比例98.61%）；减少Omega-6摄入源头（大豆油替换）可从根本上改善AA:EPA比值',
  };
}

// ─────────────────────────────────────────────
// 6. 运动处方
// ─────────────────────────────────────────────
function buildExercisePlan(level: RiskLevel, age: number | null): ExercisePrescription {
  const maxHR = age ? (220 - age) : 170;
  const isSevere = level === 'critical' || level === 'moderate';
  return {
    type: isSevere ? '有氧运动为主，逐步增加抗阻训练' : '中等强度有氧运动',
    frequency: isSevere ? '每周5次' : '每周3-5次',
    duration: isSevere ? '每次30-40分钟（前4周每次20分钟，逐步增加）' : '每次30分钟',
    intensity: isSevere
      ? `靶心率${Math.round(maxHR * 0.6)}-${Math.round(maxHR * 0.7)}次/分（最大心率${maxHR}的60%-70%），8周后可适当提升强度`
      : `靶心率${Math.round(maxHR * 0.5)}-${Math.round(maxHR * 0.65)}次/分（最大心率的50%-65%）`,
    precautions: [
      '运动中出现胸痛、心悸、严重气短立即停止并就医',
      '每次运动前后各5分钟拉伸热身/放松',
      ...(isSevere ? ['前4周以快走为主，避免剧烈竞技性运动', '运动前后监测血压'] : []),
    ],
    evidence: '参照〔血脂共识2023〕：中等强度有氧运动有助于提升HDL-C、降低TG；〔Omega3Q10-RCT-2026〕验证：运动联合Omega-3干预协同效果',
  };
}

// ─────────────────────────────────────────────
// 7. 生活方式干预
// ─────────────────────────────────────────────
function buildLifestylePlan(level: RiskLevel): LifestyleIntervention {
  const isSevere = level === 'critical' || level === 'moderate';
  return {
    key_points: [
      '保证7-8小时优质睡眠，晚11点前入睡；睡眠不足会加重炎症和脂代谢紊乱',
      '戒烟或减少吸烟（烟草加速Omega-3氧化消耗，显著升高AA:EPA比值）',
      '每日饮水1500-2000ml，避免含糖饮料',
      ...(isSevere ? [
        '管理压力和情绪（慢性应激升高皮质醇，加重脂代谢紊乱），推荐冥想/正念10分钟/日',
        '减少饮酒（酒精加重肝脏氧化应激，增加AA:EPA失衡）',
        '避免长时间久坐，每小时起身活动5分钟',
      ] : [
        '保持规律作息和适量运动',
      ]),
    ],
    evidence: '参照〔血脂共识2023〕生活方式干预章节；〔免疫营养共识2023〕：睡眠与免疫-代谢互作机制',
  };
}

// ─────────────────────────────────────────────
// 8. 随访方案
// 参照〔Omega3Q10-RCT-2026〕12周验证周期
// ─────────────────────────────────────────────
function buildFollowupPlan(level: RiskLevel): FollowupPlan {
  const reviewWeeks = level === 'critical' || level === 'moderate' ? 12 : level === 'mild' ? 16 : 24;
  const reviewDate = new Date();
  reviewDate.setDate(reviewDate.getDate() + reviewWeeks * 7);

  const expected: Record<RiskLevel, string> = {
    critical: '参照〔Omega3Q10-RCT-2026〕12周RCT结果：AA:EPA比值预计降低30-50%，Omega-3指数升至5-7%；〔益生菌HDL3-iMeta-2025〕：HDL3显著恢复，炎症指标改善',
    moderate: '12周干预后：AA:EPA比值预计降低20-40%，Omega-3指数升至6-8%；脂代谢相关症状改善',
    mild: '16周后：Omega-3指数达标（≥8%），AA:EPA比值趋于正常范围（≤5）',
    normal: '24周后维持性复查，确认脂肪酸谱持续稳定',
  };

  return {
    review_weeks: reviewWeeks,
    review_date: reviewDate.toISOString().split('T')[0],
    items_to_check: [
      '脂肪谱全套（AA:EPA、EPA%、Omega-3指数）',
      '常规血脂（TC、TG、LDL-C、HDL-C）',
      ...(level === 'critical' || level === 'moderate' ? [
        '肝功能（ALT、AST）— 使用纳豆红曲粉者必查',
        '炎症指标（hs-CRP）',
      ] : []),
      '评估产品耐受性和依从性',
    ],
    expected_outcome: expected[level],
  };
}

// ─────────────────────────────────────────────
// 9. 主入口：生成配方
// ─────────────────────────────────────────────
export function generateFormulation(
  patient: PatientContext,
  report: LipidProfileReport,
  dietaryRecommendations: string[] = []
): FormulationResult {
  const level = classifyRisk(report);
  const levelLabel = RISK_LEVEL_LABELS[level];
  const riskSummary = buildRiskSummary(report, level);
  const products = buildProducts(level, report, patient);
  const dietPlan = buildDietPlan(level, dietaryRecommendations);
  const exercisePlan = buildExercisePlan(level, patient.age);
  const lifestylePlan = buildLifestylePlan(level);
  const followupPlan = buildFollowupPlan(level);

  const reportDate = report.report_date || new Date().toISOString().split('T')[0];
  const planName = `${levelLabel}级脂肪酸失衡干预方案（${reportDate}）`;

  const goals = level === 'normal'
    ? 'Omega-3指数维持≥8%，AA:EPA维持≤3，定期复查跟踪'
    : `12-16周内AA:EPA降至10以下（目标≤3），Omega-3指数升至≥8%，改善心血管代谢风险。参照〔Omega3Q10-RCT-2026〕及〔益生菌HDL3-iMeta-2025〕干预目标`;

  const summary = [
    `基于脂肪谱分析（AA:EPA=${report.aa_epa_ratio ?? 'N/A'}，EPA=${report.epa ?? 'N/A'}%，Omega-3指数=${report.omega3_index ?? 'N/A'}%），`,
    `风险等级：${levelLabel}。`,
    `推荐${products.filter(p => p.category === 'core').length}种核心产品`,
    products.filter(p => p.category === 'conditional').length > 0
      ? `+${products.filter(p => p.category === 'conditional').length}种条件性产品`
      : '',
    `。算法版本${FORMULATION_VERSION}，循证依据来源刘英华团队论文及相关指南。`,
  ].join('');

  const result: FormulationResult = {
    success: true,
    formulation_version: FORMULATION_VERSION,
    generated_at: new Date().toISOString(),
    patient: {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
    },
    risk_assessment: {
      level,
      level_label: levelLabel,
      primary_indicators: {
        aa_epa_ratio: report.aa_epa_ratio,
        epa_pct: report.epa,
        omega3_index: report.omega3_index,
        omega6_omega3_ratio: report.omega6_omega3_ratio,
      },
      risk_summary: riskSummary,
    },
    formulation: {
      products,
      diet_intervention: dietPlan,
      exercise_prescription: exercisePlan,
      lifestyle_intervention: lifestylePlan,
      followup_plan: followupPlan,
    },
    db_fields: {
      plan_name: planName,
      risk_level: level,
      product_recommendations: JSON.stringify(products),
      formula_json: '', // 后面填充完整 JSON
      nutrition_plan: [
        `【膳食模式】${dietPlan.pattern}`,
        `【关键建议】${dietPlan.key_points.join('；')}`,
        `【增加摄入】${dietPlan.foods_to_increase.join('、')}`,
        `【减少摄入】${dietPlan.foods_to_reduce.join('、')}`,
        `【循证依据】${dietPlan.evidence}`,
      ].join('\n'),
      exercise_plan: [
        `【运动类型】${exercisePlan.type}`,
        `【频次】${exercisePlan.frequency}`,
        `【时长】${exercisePlan.duration}`,
        `【强度/靶心率】${exercisePlan.intensity}`,
        `【注意事项】${exercisePlan.precautions.join('；')}`,
        `【循证依据】${exercisePlan.evidence}`,
      ].join('\n'),
      lifestyle_plan: [
        `【生活方式干预】`,
        ...lifestylePlan.key_points.map((p, i) => `${i + 1}. ${p}`),
        `【循证依据】${lifestylePlan.evidence}`,
      ].join('\n'),
      goals,
      summary,
    },
  };

  // 完整结果 JSON（包含所有层级）
  result.db_fields.formula_json = JSON.stringify(result);

  return result;
}

// ─────────────────────────────────────────────
// 10. 通用套餐（无脂肪谱报告）
// 基于常规体检数据的基础营养支持方案
// ─────────────────────────────────────────────
export function generateGenericFormulation(
  patient: PatientContext,
  basicLipids?: { total_cholesterol?: number; ldl_c?: number; triglyceride?: number; hdl_c?: number }
): FormulationResult {
  const level: RiskLevel = 'mild';
  const levelLabel = '通用';

  // 构造一个仅含常规血脂的空报告
  const report: LipidProfileReport = {
    id: 0, patient_id: 0, report_date: null,
    aa_epa_ratio: null, epa: null, omega3_index: null, omega3_total: null,
    omega6_omega3_ratio: null, dha: null, aa: null, la: null, omega6_total: null,
    total_cholesterol: basicLipids?.total_cholesterol ?? null,
    ldl_c: basicLipids?.ldl_c ?? null,
    triglyceride: basicLipids?.triglyceride ?? null,
    hdl_c: basicLipids?.hdl_c ?? null,
  };

  // ── 产品推荐 ──
  const products: ProductRecommendation[] = [];

  // 核心：EPA鱼油（mild剂量）
  {
    const catalog = getProductById('epa_fish_oil')!;
    const dose = catalog.doses.mild!;
    products.push({
      product_id: catalog.product_id,
      product_name: catalog.product_name,
      category: 'core',
      dose: dose.dose,
      dose_per_serving: dose.dose_per_serving,
      frequency: dose.frequency,
      duration: dose.duration,
      indication: 'Omega-3是人体必需脂肪酸，现代饮食普遍摄入不足。EPA具有抗炎、降低甘油三酯、维护心血管健康等多重效应。建议进行脂肪酸谱检测以获取精准个性化剂量。',
      evidence: getEvidence(...dose.evidence_ids),
      warnings: checkContraindications(catalog.product_id, patient),
    });
  }

  // 核心：七联益生菌粉（mild剂量）
  {
    const catalog = getProductById('seven_probiotics')!;
    const dose = catalog.doses.mild!;
    products.push({
      product_id: catalog.product_id,
      product_name: catalog.product_name,
      category: 'core',
      dose: dose.dose,
      dose_per_serving: dose.dose_per_serving,
      frequency: dose.frequency,
      duration: dose.duration,
      indication: '肠道微生态与脂代谢、免疫功能密切相关。益生菌通过肠道ABCA1通路促进HDL分泌，改善脂代谢，修复肠道屏障，降低慢性炎症水平。',
      evidence: getEvidence(...dose.evidence_ids),
      warnings: checkContraindications(catalog.product_id, patient),
    });
  }

  // 条件性：纳豆红曲（常规血脂异常触发）
  if (shouldAddNatto(report)) {
    const catalog = getProductById('natto_red_yeast')!;
    const dose = catalog.doses.mild!;
    const triggers: string[] = [];
    if (basicLipids?.total_cholesterol && basicLipids.total_cholesterol >= 5.2)
      triggers.push(`TC ${basicLipids.total_cholesterol} mmol/L`);
    if (basicLipids?.ldl_c && basicLipids.ldl_c >= 3.4)
      triggers.push(`LDL-C ${basicLipids.ldl_c} mmol/L`);
    if (basicLipids?.triglyceride && basicLipids.triglyceride >= 1.7)
      triggers.push(`TG ${basicLipids.triglyceride} mmol/L`);
    products.push({
      product_id: catalog.product_id,
      product_name: catalog.product_name,
      category: 'conditional',
      dose: dose.dose,
      dose_per_serving: dose.dose_per_serving,
      frequency: dose.frequency,
      duration: dose.duration,
      indication: `常规血脂检测异常：${triggers.join('、')}。纳豆激酶+红曲莫纳可林K协同降低LDL-C和TG`,
      evidence: getEvidence(...dose.evidence_ids),
      warnings: checkContraindications(catalog.product_id, patient),
    });
  }

  // 条件性产品：短肽、纾炏宁（同正常逻辑）
  if (shouldAddPeptide(patient)) {
    const catalog = getProductById('peptide_nutrients')!;
    const dose = catalog.doses.mild!;
    products.push({
      product_id: catalog.product_id,
      product_name: catalog.product_name,
      category: 'conditional',
      dose: dose.dose, dose_per_serving: dose.dose_per_serving,
      frequency: dose.frequency, duration: dose.duration,
      indication: `患者存在营养支持需求（${patient.diagnosis || '见病史'}），短肽营养改善蛋白质合成`,
      evidence: getEvidence(...dose.evidence_ids),
      warnings: checkContraindications(catalog.product_id, patient),
    });
  }
  if (shouldAddShuyan(patient)) {
    const catalog = getProductById('shuyan_ning')!;
    const dose = catalog.doses.mild!;
    products.push({
      product_id: catalog.product_id,
      product_name: catalog.product_name,
      category: 'conditional',
      dose: dose.dose, dose_per_serving: dose.dose_per_serving,
      frequency: dose.frequency, duration: dose.duration,
      indication: `患者存在免疫/炎症状态（${patient.diagnosis || '见诊断'}），接骨木莓+益生菌调节免疫`,
      evidence: getEvidence(...dose.evidence_ids),
      warnings: checkContraindications(catalog.product_id, patient),
    });
  }

  // ── 其他干预方案（复用mild级别逻辑）──
  const dietPlan = buildDietPlan(level);
  const exercisePlan = buildExercisePlan(level, patient.age);
  const lifestylePlan = buildLifestylePlan(level);

  // 随访计划：特别建议做脂肪谱检测
  const followupPlan: FollowupPlan = {
    review_weeks: 12,
    review_date: (() => { const d = new Date(); d.setDate(d.getDate() + 84); return d.toISOString().split('T')[0]; })(),
    items_to_check: [
      '★ 脂肪酸谱全套检测（AA:EPA、EPA%、Omega-3指数）— 强烈建议，可获取精准个性化配方',
      '常规血脂（TC、TG、LDL-C、HDL-C）',
      '评估产品耐受性和依从性',
    ],
    expected_outcome: '12周基础营养支持后，预计整体炎症水平降低、肠道健康改善。完成脂肪酸谱检测后可升级为精准个性化方案。',
  };

  // ── 风险摘要 ──
  const lipidParts: string[] = [];
  if (basicLipids?.total_cholesterol) lipidParts.push(`TC=${basicLipids.total_cholesterol}`);
  if (basicLipids?.ldl_c) lipidParts.push(`LDL-C=${basicLipids.ldl_c}`);
  if (basicLipids?.triglyceride) lipidParts.push(`TG=${basicLipids.triglyceride}`);
  if (basicLipids?.hdl_c) lipidParts.push(`HDL-C=${basicLipids.hdl_c}`);

  const riskSummary = lipidParts.length > 0
    ? `常规体检血脂数据（${lipidParts.join('、')} mmol/L）。未进行脂肪酸谱检测，无法评估AA:EPA比值和Omega-3指数，采用通用基础营养支持方案。建议尽早完成脂肪酸谱检测以获取精准干预方案。`
    : '未提供脂肪酸谱检测数据，采用通用基础营养支持方案。建议尽早完成脂肪酸谱检测（AA:EPA比值、EPA%、Omega-3指数），以获取精准个性化干预配方。';

  const planName = `通用基础营养支持方案（${new Date().toISOString().split('T')[0]}）`;

  const result: FormulationResult = {
    success: true,
    formulation_version: FORMULATION_VERSION + '-generic',
    generated_at: new Date().toISOString(),
    patient: { name: patient.name, age: patient.age, gender: patient.gender },
    risk_assessment: {
      level: 'mild',
      level_label: '通用',
      primary_indicators: {
        aa_epa_ratio: null,
        epa_pct: null,
        omega3_index: null,
        omega6_omega3_ratio: null,
      },
      risk_summary: riskSummary,
    },
    formulation: {
      products,
      diet_intervention: dietPlan,
      exercise_prescription: exercisePlan,
      lifestyle_intervention: lifestylePlan,
      followup_plan: followupPlan,
    },
    db_fields: {
      plan_name: planName,
      risk_level: 'generic',
      product_recommendations: JSON.stringify(products),
      formula_json: '',
      nutrition_plan: `【膳食模式】${dietPlan.pattern}\n【关键建议】${dietPlan.key_points.join('；')}`,
      exercise_plan: `【运动类型】${exercisePlan.type}\n【频次】${exercisePlan.frequency}`,
      lifestyle_plan: lifestylePlan.key_points.map((p, i) => `${i + 1}. ${p}`).join('\n'),
      goals: '12周基础营养支持，改善整体代谢健康。强烈建议进行脂肪酸谱检测以获取个性化精准配方。',
      summary: `通用基础营养支持方案，推荐${products.length}个产品。${lipidParts.length > 0 ? '基于常规血脂数据。' : ''}算法版本${FORMULATION_VERSION}。`,
    },
  };
  result.db_fields.formula_json = JSON.stringify(result);
  return result;
}
