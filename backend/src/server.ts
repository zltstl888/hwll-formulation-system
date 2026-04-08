import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parseLipidPdf } from './lipid-ocr/lipid-pdf-parser';
import { generateFormulation, generateGenericFormulation } from './formulation/formulation-engine';
import type { PatientContext, LipidProfileReport } from './formulation/types';

const app = express();
const PORT = process.env.PORT || 5002;

// 允许的前端域名
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://zltstl888.github.io',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

const upload = multer({ dest: '/tmp/hwll-uploads/' });

// ─── GET /api/health ───────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', service: 'hwll-formulation-api' });
});

// ─── POST /api/parse-pdf ───────────────────────────────────────────────────
// 上传 PDF → 解析脂肪酸数值 JSON
app.post('/api/parse-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传 PDF 文件' });
  }
  try {
    const result = await parseLipidPdf(req.file.path);
    // 删除临时文件
    fs.unlink(req.file.path, () => {});
    res.json({ success: true, data: result });
  } catch (err: any) {
    fs.unlink(req.file.path, () => {});
    console.error('PDF解析失败:', err);
    res.status(500).json({ error: '解析失败: ' + (err.message || '未知错误') });
  }
});

// ─── POST /api/generate ───────────────────────────────────────────────────
// 传入脂肪酸数值 + 患者信息 → 生成5维配方（无需 patient_id）
app.post('/api/generate', async (req, res) => {
  try {
    const { lipidValues, patientInfo } = req.body;
    if (!lipidValues) {
      return res.status(400).json({ error: '缺少脂肪酸数值' });
    }

    const patient: PatientContext = {
      id: 0,
      name: patientInfo?.name || '未命名患者',
      age: patientInfo?.age || null,
      gender: patientInfo?.gender || null,
      birth_date: null,
      diagnosis: patientInfo?.diagnosis || null,
      current_medications: patientInfo?.medications || null,
      medical_history: null,
      allergy_history: null,
    };

    const report: LipidProfileReport = {
      id: 0,
      patient_id: 0,
      report_date: lipidValues.report_date || null,
      aa_epa_ratio: lipidValues.aa_epa_ratio ?? null,
      epa: lipidValues.epa ?? null,
      omega3_index: lipidValues.omega3_index ?? null,
      omega3_total: lipidValues.omega3_total ?? null,
      omega6_omega3_ratio: lipidValues.omega6_omega3_ratio ?? null,
      dha: lipidValues.dha ?? null,
      aa: lipidValues.aa ?? null,
      la: lipidValues.la ?? null,
      omega6_total: lipidValues.omega6_total ?? null,
      total_cholesterol: lipidValues.total_cholesterol ?? null,
      ldl_c: lipidValues.ldl_c ?? null,
      triglyceride: lipidValues.triglyceride ?? null,
      hdl_c: lipidValues.hdl_c ?? null,
    };

    const dietaryRecommendations: string[] = lipidValues.dietary_recommendations || [];
    const plan = generateFormulation(patient, report, dietaryRecommendations);
    res.json({ success: true, data: plan });
  } catch (err: any) {
    console.error('配方生成失败:', err);
    res.status(500).json({ error: '配方生成失败: ' + (err.message || '未知错误') });
  }
});

// ─── POST /api/generate-generic ───────────────────────────────────────────
// 通用套餐：无需脂肪谱报告，基于常规体检数据
app.post('/api/generate-generic', async (req, res) => {
  try {
    const { patientInfo, basicLipids } = req.body;
    const patient: PatientContext = {
      id: 0,
      name: patientInfo?.name || '未命名患者',
      age: patientInfo?.age || null,
      gender: patientInfo?.gender || null,
      birth_date: null,
      diagnosis: patientInfo?.diagnosis || null,
      current_medications: patientInfo?.medications || null,
      medical_history: null,
      allergy_history: null,
    };
    const plan = generateGenericFormulation(patient, basicLipids);
    res.json({ success: true, data: plan });
  } catch (err: any) {
    console.error('通用套餐生成失败:', err);
    res.status(500).json({ error: '生成失败: ' + (err.message || '未知错误') });
  }
});

app.listen(PORT, () => {
  console.log(`HWLL Formulation API running on port ${PORT}`);
});

export default app;
