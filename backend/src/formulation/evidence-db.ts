// HWLL 智能配方算法 — 循证依据数据库
// 版本: v2.0 | 甲方自留核心IP
// 作者: Jerry (APEX AI CTO) | 2026-04-05
// 数据来源: 刘英华团队22篇论文及相关指南，经Jerry整理标注

import { EvidenceCitation } from './types';

export const EVIDENCE: Record<string, EvidenceCitation> = {
  E01: {
    citation_id: 'E01',
    citation_label: '〔血脂共识2023〕',
    statement: 'EPA和/或DHA具有剂量依赖性降TG作用，推荐至少1.8g/d（专家同意比例100%）；地中海膳食模式与心血管保护（同意比例98.61%）',
    source: '血脂异常医学营养管理专家共识，中华健康管理学杂志2023,17(8):561-573，刘英华通信作者',
  },
  E02: {
    citation_id: 'E02',
    citation_label: '〔Omega3Q10-RCT-2026〕',
    statement: 'ALA 1.6g/d + CoQ10 136mg/d 干预12周，边缘性血脂异常患者TG显著降低、HDL-C升高（P<0.05），协同效应优于单独干预',
    source: '刘英华团队, 2026 RCT，n=82，Omega-3与辅酶Q10协同效应研究，中国医学期刊',
  },
  E03: {
    citation_id: 'E03',
    citation_label: '〔益生菌HDL3-iMeta-2025〕',
    statement: '混合益生菌干预6个月：HDL3显著恢复（通过肠道ABCA1通路），心血管死亡0例（对照组6例死亡），改善终末期肾病脂代谢',
    source: '刘英华团队, iMeta 2025;4:e70062, DOI:10.1002/imt2.70062',
  },
  E04: {
    citation_id: 'E04',
    citation_label: '〔合生元RCT-2024〕',
    statement: '合生元（益生菌+益生元联合）效果优于单独使用益生菌，推荐含益生元的复合配方',
    source: '刘英华团队, 2024 RCT，合生元 vs 益生菌单独干预对照研究',
  },
  E05: {
    citation_id: 'E05',
    citation_label: '〔纳豆激酶RCT-2019〕',
    statement: '纳豆激酶干预26周（n=1062 RCT）：LDL-C显著降低，心血管事件风险降低，安全性良好',
    source: '多中心RCT，2019，纳豆激酶对高脂血症患者血脂影响，样本量1062例',
  },
  E06: {
    citation_id: 'E06',
    citation_label: '〔红曲Meta-2022〕',
    statement: '13项RCT Meta分析：红曲提取物（含莫纳可林K）LDL-C平均降低24mg/dL（约0.62 mmol/L），TG、TC亦显著改善',
    source: 'Meta分析, 2022，红曲提取物降脂疗效系统评价，纳入13项RCT',
  },
  E07: {
    citation_id: 'E07',
    citation_label: '〔免疫营养共识2023〕',
    statement: 'Omega-3鱼油联合抗氧化营养素（GSH、VitE等）可显著增强临床获益；短肽肠内营养改善肿瘤/术后营养状态，缩短住院时间',
    source: '免疫营养素临床应用专家共识，中华老年多器官疾病杂志2023,22(11)，刘英华通信作者',
  },
  E08: {
    citation_id: 'E08',
    citation_label: '〔GSH-BMC-2017〕',
    statement: '口服谷胱甘肽（GSH）300mg/d持续4个月：NAFLD患者肝功能指标显著改善，酒精性肝病有效率92.5%',
    source: 'BMC Gastroenterology 2017，GSH口服补充多中心临床研究',
  },
  E09: {
    citation_id: 'E09',
    citation_label: '〔JELIS-2007〕',
    statement: 'EPA 1.8g/d联合他汀：主要冠状动脉事件风险降低19%；有冠心病史患者降低53%（n=18,645，日本大型RCT）',
    source: 'Yokoyama M et al., Lancet 2007;369:1090-1098，JELIS研究',
  },
  E10: {
    citation_id: 'E10',
    citation_label: '〔HWLL数据库-2025〕',
    statement: 'HWLL 45例脂肪谱数据：EPA均值0.77%（参考值3-9%），AA:EPA均值27.87（参考值1-3），96%患者存在不同程度Omega-3缺乏',
    source: 'HWLL代谢健康管理中心，45例干血纸片脂肪谱检测统计，2025年数据',
  },
};

/** 获取多条引用 */
export function getEvidence(...ids: string[]): EvidenceCitation[] {
  return ids.map(id => EVIDENCE[id]).filter(Boolean);
}
