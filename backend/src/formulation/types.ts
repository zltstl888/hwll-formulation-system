// HWLL 智能配方算法 — 类型定义
// 版本: v2.0 | 甲方自留核心IP
// 作者: Jerry (APEX AI CTO) | 2026-04-05

export type RiskLevel = 'critical' | 'moderate' | 'mild' | 'normal';

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  critical: '严重',
  moderate: '中度',
  mild: '轻度',
  normal: '正常',
};

/** 脂肪谱报告数据（来自 lipid_profile_reports 表） */
export interface LipidProfileReport {
  id: number;
  patient_id: number;
  report_date: string | null;
  aa_epa_ratio: number | null;
  epa: number | null;           // EPA 占总脂肪酸百分比（%）
  omega3_index: number | null;
  omega3_total: number | null;
  omega6_omega3_ratio: number | null;
  dha: number | null;
  aa: number | null;
  la: number | null;
  omega6_total: number | null;
  // 血脂指标（可能为 null，患者未做常规血脂检查）
  total_cholesterol?: number | null;
  ldl_c?: number | null;
  triglyceride?: number | null;
  hdl_c?: number | null;
}

/** 患者基本信息 */
export interface PatientContext {
  id: number;
  name: string;
  age: number | null;
  gender: string | null;
  birth_date: string | null;
  diagnosis: string | null;          // 主诊断（用于条件性产品触发）
  current_medications: string | null; // 当前用药（用于禁忌检查）
  medical_history: string | null;
  allergy_history: string | null;
}

/** 循证依据引用 */
export interface EvidenceCitation {
  citation_id: string;    // 如 "E01"
  citation_label: string; // 如 "〔血脂共识2023〕"
  statement: string;      // 关键发现描述
  source: string;         // 完整参考文献
}

/** 产品推荐 */
export interface ProductRecommendation {
  product_id: string;
  product_name: string;
  category: 'core' | 'conditional';
  dose: string;              // 完整剂量说明
  dose_per_serving: string;  // 单次剂量
  frequency: string;         // 频次
  duration: string;          // 疗程
  mechanism?: string;        // 作用机制（不在报告中展示，仅数据层保留）
  indication: string;        // 推荐理由（结合患者数据）
  evidence: EvidenceCitation[];
  warnings: string[];
}

/** 风险评估结果 */
export interface RiskAssessment {
  level: RiskLevel;
  level_label: string;
  primary_indicators: {
    aa_epa_ratio: number | null;
    epa_pct: number | null;
    omega3_index: number | null;
    omega6_omega3_ratio: number | null;
  };
  risk_summary: string;
}

/** 配方生成完整结果 */
export interface FormulationResult {
  success: boolean;
  formulation_version: string;
  generated_at: string;
  patient: {
    name: string;
    age: number | null;
    gender: string | null;
  };
  risk_assessment: RiskAssessment;
  formulation: {
    products: ProductRecommendation[];
    diet_intervention: DietIntervention;
    exercise_prescription: ExercisePrescription;
    lifestyle_intervention: LifestyleIntervention;
    followup_plan: FollowupPlan;
  };
  /** 直接写入 intervention_plans 表的扁平化字段 */
  db_fields: {
    plan_name: string;
    risk_level: string;
    product_recommendations: string; // JSON string
    formula_json: string;            // JSON string（完整结果）
    nutrition_plan: string;
    exercise_plan: string;
    lifestyle_plan: string;
    goals: string;
    summary: string;
  };
}

export interface DietIntervention {
  pattern: string;
  key_points: string[];
  foods_to_increase: string[];
  foods_to_reduce: string[];
  evidence: string;
}

export interface ExercisePrescription {
  type: string;
  frequency: string;
  duration: string;
  intensity: string;
  precautions: string[];
  evidence: string;
}

export interface LifestyleIntervention {
  key_points: string[];
  evidence: string;
}

export interface FollowupPlan {
  review_weeks: number;
  review_days: number;           // 复查天数（红细胞代谢周期120天）
  review_date: string;
  items_to_check: string[];
  expected_outcome: string;
}
