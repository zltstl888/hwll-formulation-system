// HWLL 脂肪谱PDF解析器
// 版本: v1.0
// 作者: Jerry (APEX AI CTO) | 2026-04-05
//
// 针对"脂谱生物科技(上海)有限公司"标准报告格式进行精确解析
// 使用 pdftotext 提取文本 + 正则解析，准确率高于视觉OCR
// 支持：干血纸片采样法脂肪酸成份表（所有已知批次格式）

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface ParsedLipidReport {
  // 基本信息
  patient_name: string | null;
  sample_number: string | null;
  gender: string | null;
  age: string | null;
  date_received: string | null;
  report_date: string | null;
  lab_name: string;

  // 比率
  aa_epa_ratio: number | null;
  aa_epa_status: string;
  omega6_omega3_ratio: number | null;
  omega6_omega3_status: string;

  // Omega-3 PUFA
  omega3_total: number | null;
  omega3_total_status: string;
  omega3_index: number | null;
  omega3_index_status: string;
  ala: number | null;
  ala_status: string;
  epa: number | null;
  epa_status: string;
  dpan3: number | null;
  dpan3_status: string;
  dha: number | null;
  dha_status: string;

  // Omega-6 PUFA
  omega6_total: number | null;
  omega6_total_status: string;
  la: number | null;
  la_status: string;
  gla: number | null;
  gla_status: string;
  dgla: number | null;
  dgla_status: string;
  aa: number | null;
  aa_status: string;
  adrenic: number | null;
  adrenic_status: string;
  dpan6: number | null;
  dpan6_status: string;

  // MUFA
  mufa_total: number | null;
  mufa_total_status: string;
  palmitoleic: number | null;
  palmitoleic_status: string;
  oleic: number | null;
  oleic_status: string;
  nervonic: number | null;
  nervonic_status: string;

  // SFA
  sfa_total: number | null;
  sfa_total_status: string;
  palmitic: number | null;
  palmitic_status: string;
  stearic: number | null;
  stearic_status: string;

  // 原始营养建议文本（来自报告）
  dietary_recommendations: string[];

  // 解析置信度 (0-1)
  parse_confidence: number;
  parse_warnings: string[];
}

/** 从文本行提取数值和状态 */
function extractValueAndStatus(line: string): { value: number | null; status: string } {
  // 匹配如 "1.97% ↓" 或 "5.1 ↑" 或 "4.5 ↑"
  const match = line.match(/([\d.]+)%?\s*(↑|↓)?/);
  if (!match) return { value: null, status: 'normal' };

  const value = parseFloat(match[1]);
  const arrow = match[2];
  const status = arrow === '↑' ? 'high' : arrow === '↓' ? 'low' : 'normal';
  return { value: isNaN(value) ? null : value, status };
}

/** 解析日期字符串为 YYYY-MM-DD 格式 */
function parseDate(raw: string): string | null {
  if (!raw) return null;
  raw = raw.trim();
  // 已经是 YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // YYYY/MM/DD
  const m1 = raw.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
  // YYYY年MM月DD日
  const m2 = raw.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (m2) return `${m2[1]}-${m2[2].padStart(2, '0')}-${m2[3].padStart(2, '0')}`;
  return raw;
}

/**
 * 解析脂谱生物科技PDF文本
 * 支持 pdftotext 提取的文本格式（包含非标准Unicode字符）
 */
export function parseLipidText(text: string): ParsedLipidReport {
  // 统一全角字符和特殊连字符
  text = text
    .replace(/⼆/g, '二').replace(/⼗/g, '十').replace(/⼋/g, '八')
    .replace(/⼀/g, '一').replace(/⾼/g, '高').replace(/⻥/g, '鱼')
    .replace(/⻓/g, '长').replace(/⽔/g, '水').replace(/⾁/g, '肉')
    .replace(/⻣/g, '骨').replace(/⾷/g, '食').replace(/⻝/g, '食');

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const result: ParsedLipidReport = {
    patient_name: null, sample_number: null, gender: null, age: null,
    date_received: null, report_date: null,
    lab_name: '脂谱生物科技（上海）有限公司',
    aa_epa_ratio: null, aa_epa_status: 'normal',
    omega6_omega3_ratio: null, omega6_omega3_status: 'normal',
    omega3_total: null, omega3_total_status: 'normal',
    omega3_index: null, omega3_index_status: 'normal',
    ala: null, ala_status: 'normal',
    epa: null, epa_status: 'normal',
    dpan3: null, dpan3_status: 'normal',
    dha: null, dha_status: 'normal',
    omega6_total: null, omega6_total_status: 'normal',
    la: null, la_status: 'normal',
    gla: null, gla_status: 'normal',
    dgla: null, dgla_status: 'normal',
    aa: null, aa_status: 'normal',
    adrenic: null, adrenic_status: 'normal',
    dpan6: null, dpan6_status: 'normal',
    mufa_total: null, mufa_total_status: 'normal',
    palmitoleic: null, palmitoleic_status: 'normal',
    oleic: null, oleic_status: 'normal',
    nervonic: null, nervonic_status: 'normal',
    sfa_total: null, sfa_total_status: 'normal',
    palmitic: null, palmitic_status: 'normal',
    stearic: null, stearic_status: 'normal',
    dietary_recommendations: [],
    parse_confidence: 0,
    parse_warnings: [],
  };

  let successCount = 0;
  let totalExpected = 20; // 关键字段数量

  // ── 基本信息解析
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 姓名（取第一个空白或样本编号前的内容）
    const nameM = line.match(/姓名[（(]Name[）)]\s*[:：]?\s*([^\s\t]+)/);
    if (nameM && !result.patient_name) {
      result.patient_name = nameM[1].trim();
    }

    // 样本编号
    const sampleM = line.match(/样本编号[（(]Number[）)]\s*[:：]?\s*(\S+)/);
    if (sampleM && !result.sample_number) {
      result.sample_number = sampleM[1].trim();
    }

    // 性别
    const sexM = line.match(/性别[（(]Sex[）)]\s*[:：]?\s*(.+)/);
    if (sexM) {
      const g = sexM[1].trim();
      if (g) result.gender = g;
    }

    // 年龄
    const ageM = line.match(/年龄[（(]Age[）)]\s*[:：]?\s*(\d+)/);
    if (ageM) result.age = ageM[1];

    // 送检日期
    const receivedM = line.match(/送检[⽇日]期[（(]Date Received[）)]\s*[:：]?\s*(\S+)/);
    if (receivedM) result.date_received = parseDate(receivedM[1]);

    // 报告日期
    const reportDateM = line.match(/报告[⽇日]期[（(]Report Date[）)]\s*[:：]?\s*(\S+)/);
    if (reportDateM) result.report_date = parseDate(reportDateM[1]);
  }

  // ── 脂肪酸数值解析
  // 策略：在整个文本中用正则查找"关键词行 + 紧接着的数值行"
  // 脂谱报告格式固定：关键词行 → (空行过滤后) → 数值行(含% ↑/↓) → 参考区间行
  // 使用全文搜索比逐行循环更可靠，避免行索引偏移问题

  // 关键词→字段名映射（严格排序，避免歧义：专有词放前，短词放后）
  const FIELD_SEARCHES: Array<{ pattern: RegExp; vk: string; sk: string }> = [
    { pattern: /Omega-3多不饱和脂肪酸/i, vk: 'omega3_total', sk: 'omega3_total_status' },
    { pattern: /Omega-3指数/i, vk: 'omega3_index', sk: 'omega3_index_status' },
    { pattern: /ALA[,，]18:3n3/i, vk: 'ala', sk: 'ala_status' },
    { pattern: /EPA[,，]20:5/i, vk: 'epa', sk: 'epa_status' },
    { pattern: /DPAn3[,，]22:5n3/i, vk: 'dpan3', sk: 'dpan3_status' },
    { pattern: /DHA[,，]22:6n3/i, vk: 'dha', sk: 'dha_status' },
    { pattern: /Omega-6多不饱和脂肪酸/i, vk: 'omega6_total', sk: 'omega6_total_status' },
    { pattern: /LA[,，]18:2n6/i, vk: 'la', sk: 'la_status' },
    { pattern: /GLA[,，]18:3n6/i, vk: 'gla', sk: 'gla_status' },
    { pattern: /DGLA[,，]20:3n6/i, vk: 'dgla', sk: 'dgla_status' },
    { pattern: /AA[,，\s]20:4n6/i, vk: 'aa', sk: 'aa_status' },
    { pattern: /22:4n6/i, vk: 'adrenic', sk: 'adrenic_status' },
    { pattern: /DPAn6[,，]22:5n6/i, vk: 'dpan6', sk: 'dpan6_status' },
    { pattern: /顺式单不饱和脂肪酸/i, vk: 'mufa_total', sk: 'mufa_total_status' },
    { pattern: /16:1[）)]/i, vk: 'palmitoleic', sk: 'palmitoleic_status' },
    { pattern: /18:1n9/i, vk: 'oleic', sk: 'oleic_status' },
    { pattern: /24:1n9/i, vk: 'nervonic', sk: 'nervonic_status' },
    { pattern: /饱和脂肪酸/i, vk: 'sfa_total', sk: 'sfa_total_status' },
    { pattern: /16:0[）)]/i, vk: 'palmitic', sk: 'palmitic_status' },
    { pattern: /18:0[）)]/i, vk: 'stearic', sk: 'stearic_status' },
  ];

  for (const { pattern, vk, sk } of FIELD_SEARCHES) {
    // 找到匹配行的索引
    const idx = lines.findIndex(l => pattern.test(l));
    if (idx === -1) continue;

    // 向后最多4行找数值行（含 % ↑/↓）
    let valueLine = '';
    for (let j = idx + 1; j < Math.min(idx + 4, lines.length); j++) {
      // 数值行：包含 数字+% 且不以中文字母开头（排除下一个字段名行）
      if (/^[\d.]+%\s*(↑|↓)?/.test(lines[j])) {
        valueLine = lines[j];
        break;
      }
    }
    if (!valueLine) continue;

    const { value, status } = extractValueAndStatus(valueLine);
    if (value !== null) {
      (result as Record<string, any>)[vk] = value;
      (result as Record<string, any>)[sk] = status;
      successCount++;
    }
  }

  // 比率解析（格式：字段名行 → 数值行，数值不带%）
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^AA:EPA$/.test(line) || /^AA:EPA\s/.test(line)) {
      const sameM = line.match(/AA:EPA\s+([\d.]+)\s*(↑|↓)?/);
      const nextM = (lines[i + 1] || '').match(/^([\d.]+)\s*(↑|↓)?/);
      const m = sameM || nextM;
      if (m && result.aa_epa_ratio === null) {
        result.aa_epa_ratio = parseFloat(m[1]);
        result.aa_epa_status = m[2] === '↑' ? 'high' : m[2] === '↓' ? 'low' : 'normal';
        successCount++;
      }
    }

    if (/^Omega-6:Omega-3/.test(line) || /^比率/.test(line)) {
      // Omega-6:Omega-3 紧接在比率标题后面
      const nextLine = lines[i + 1] || '';
      const nextNextLine = lines[i + 2] || '';
      const target = /^Omega-6:Omega-3/.test(line) ? line
                   : /^Omega-6:Omega-3/.test(nextLine) ? nextLine : nextNextLine;
      if (/^Omega-6:Omega-3/.test(target)) {
        const sameM = target.match(/Omega-6:Omega-3\s+([\d.]+)\s*(↑|↓)?/i);
        // target在lines中的实际位置
        const targetIdx = lines.indexOf(target, i);
        const afterM = (lines[targetIdx + 1] || '').match(/^([\d.]+)\s*(↑|↓)?/);
        const m = sameM || afterM;
        if (m && result.omega6_omega3_ratio === null) {
          result.omega6_omega3_ratio = parseFloat(m[1]);
          result.omega6_omega3_status = m[2] === '↑' ? 'high' : m[2] === '↓' ? 'low' : 'normal';
          successCount++;
        }
      }
    }

    // 饮食建议
    if (/^【\d+】/.test(line)) {
      result.dietary_recommendations.push(line);
    }
  }

  // 解析置信度评估
  result.parse_confidence = Math.min(1, successCount / totalExpected);

  if (!result.sample_number) result.parse_warnings.push('未能提取样本编号');
  if (!result.report_date) result.parse_warnings.push('未能提取报告日期');
  if (result.aa_epa_ratio === null) result.parse_warnings.push('未能提取AA:EPA比值（关键指标）');
  if (result.epa === null) result.parse_warnings.push('未能提取EPA百分比（关键指标）');
  if (result.parse_confidence < 0.6) result.parse_warnings.push(`解析置信度偏低(${(result.parse_confidence * 100).toFixed(0)}%)，建议人工核对`);

  return result;
}

/**
 * 从PDF文件路径解析脂肪谱报告
 * 需要系统安装 pdftotext (poppler-utils)
 */
export function parseLipidPdf(pdfPath: string): ParsedLipidReport & { raw_text?: string } {
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF文件不存在: ${pdfPath}`);
  }

  let rawText: string;
  try {
    // 使用默认模式（不加-layout），脂谱报告每个数值独占一行，解析更准确
    rawText = execSync(`pdftotext -enc UTF-8 "${pdfPath}" -`, {
      encoding: 'utf8',
      timeout: 30000,
    });
  } catch (err: any) {
    throw new Error(`pdftotext 执行失败: ${err.message}。请确认已安装 poppler (brew install poppler)`);
  }

  const parsed = parseLipidText(rawText);
  return { ...parsed, raw_text: rawText };
}
