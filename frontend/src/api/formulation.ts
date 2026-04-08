import type { LipidValues, PatientInfo, FormulationResult } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://76.13.185.230:5002';

export async function parsePdf(file: File): Promise<LipidValues> {
  const form = new FormData();
  form.append('pdf', file);
  const res = await fetch(`${API_BASE}/api/parse-pdf`, { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || '解析失败');
  return json.data;
}

export async function generatePlan(
  lipidValues: LipidValues,
  patientInfo: Partial<PatientInfo>
): Promise<FormulationResult> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lipidValues, patientInfo }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || '配方生成失败');
  return json.data;
}

export async function generateGenericPlan(
  patientInfo: Partial<PatientInfo>,
  basicLipids?: { total_cholesterol?: number; ldl_c?: number; triglyceride?: number; hdl_c?: number }
): Promise<FormulationResult> {
  const res = await fetch(`${API_BASE}/api/generate-generic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientInfo, basicLipids }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || '通用套餐生成失败');
  return json.data;
}
