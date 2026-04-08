export type RiskLevel = 'critical' | 'moderate' | 'mild' | 'normal';

export interface LipidValues {
  report_date?: string;
  aa_epa_ratio?: number;
  epa?: number;
  omega3_index?: number;
  omega3_total?: number;
  omega6_omega3_ratio?: number;
  dha?: number;
  aa?: number;
  la?: number;
  omega6_total?: number;
  total_cholesterol?: number;
  ldl_c?: number;
  triglyceride?: number;
  hdl_c?: number;
  // raw fields from PDF parser
  [key: string]: any;
}

export interface PatientInfo {
  name: string;
  age: string;
  gender: string;
  diagnosis: string;
  medications: string;
}

export interface ProductRecommendation {
  product_id: string;
  product_name: string;
  category: 'core' | 'conditional';
  dose: string;
  dose_per_serving: string;
  frequency: string;
  duration: string;
  mechanism?: string;
  indication: string;
  evidence: EvidenceCitation[];
  warnings: string[];
}

export interface EvidenceCitation {
  citation_id: string;
  citation_label: string;
  statement: string;
  source: string;
}

export interface FormulationResult {
  success: boolean;
  formulation_version: string;
  generated_at: string;
  patient: { name: string; age: number | null; gender: string | null };
  risk_assessment: {
    level: RiskLevel;
    level_label: string;
    primary_indicators: {
      aa_epa_ratio: number | null;
      epa_pct: number | null;
      omega3_index: number | null;
      omega6_omega3_ratio: number | null;
    };
    risk_summary: string;
  };
  formulation: {
    products: ProductRecommendation[];
    diet_intervention: {
      pattern: string;
      key_points: string[];
      foods_to_increase: string[];
      foods_to_reduce: string[];
      evidence: string;
    };
    exercise_prescription: {
      type: string;
      frequency: string;
      duration: string;
      intensity: string;
      precautions: string[];
      evidence: string;
    };
    lifestyle_intervention: {
      key_points: string[];
      evidence: string;
    };
    followup_plan: {
      review_weeks: number;
      review_date: string;
      items_to_check: string[];
      expected_outcome: string;
    };
  };
}
