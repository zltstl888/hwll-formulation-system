// HWLL 智能配方算法 — 产品配置（剂量矩阵）
// 版本: v2.0 | 甲方自留核心IP
// 作者: Jerry (APEX AI CTO) | 2026-04-05

import { RiskLevel } from './types';
import { getEvidence } from './evidence-db';

/** 产品剂量配置 */
export interface ProductDoseConfig {
  product_id: string;
  product_name: string;
  /** 对应 RiskLevel 的剂量设置，null 表示不推荐 */
  doses: Partial<Record<RiskLevel, {
    dose: string;
    dose_per_serving: string;
    frequency: string;
    duration: string;
    evidence_ids: string[];
  }>>;
  mechanism: string;
  /** 包含任一关键词则添加禁忌警告 */
  contraindication_keywords: string[];
  contraindication_warnings: string[];
}

export const PRODUCT_CATALOG: ProductDoseConfig[] = [
  {
    product_id: 'epa_fish_oil',
    product_name: 'TYMB® EPA鱼油提取物',
    mechanism: '直接补充EPA（≥300mg/粒），快速提升血浆EPA水平，降低AA:EPA比值；ALA协同内源性转化，VitE抗氧化防止EPA氧化流失；具有剂量依赖性降低甘油三酯、稳定动脉粥样硬化斑块、抑制血小板聚集等多重心血管保护效应',
    doses: {
      critical: {
        dose: '每日6粒，分早晚各3粒，餐后温水送服',
        dose_per_serving: '每次3粒（≥900mg EPA）',
        frequency: '每日2次',
        duration: '12周，复查脂肪谱后评估调整',
        evidence_ids: ['E01', 'E09', 'E10'],
      },
      moderate: {
        dose: '每日4粒，分早晚各2粒，餐后温水送服',
        dose_per_serving: '每次2粒（≥600mg EPA）',
        frequency: '每日2次',
        duration: '12周，复查脂肪谱后评估调整',
        evidence_ids: ['E01', 'E02'],
      },
      mild: {
        dose: '每日2粒，餐后温水送服',
        dose_per_serving: '每次2粒（≥600mg EPA）',
        frequency: '每日1次',
        duration: '16周，复查脂肪谱后评估调整',
        evidence_ids: ['E01', 'E02'],
      },
      normal: {
        dose: '每日1粒，餐后温水送服',
        dose_per_serving: '每次1粒（≥300mg EPA）',
        frequency: '每日1次',
        duration: '24周，维持性营养支持',
        evidence_ids: ['E01'],
      },
    },
    contraindication_keywords: ['华法林', '阿司匹林', '氯吡格雷', '利伐沙班', '抗凝'],
    contraindication_warnings: ['⚠️ 患者使用抗凝药，EPA鱼油可增强抗凝效果，服用前请告知主治医生，监测凝血指标'],
  },
  {
    product_id: 'glutathione_multi',
    product_name: 'TYMB® 谷胱甘肽多维',
    mechanism: 'GSH（谷胱甘肽138mg/粒）直接清除自由基，协同水飞蓟素保护肝脏，牛磺酸+B族+锌加速能量代谢；VC+VE构建双重抗氧化网络，与EPA鱼油形成协同抗炎体系；严重脂肪酸失衡伴随显著氧化应激，GSH是细胞内核心保护因子',
    doses: {
      critical: {
        dose: '每日4粒，分早晚各2粒，餐后温水送服',
        dose_per_serving: '每次2粒（276mg GSH）',
        frequency: '每日2次',
        duration: '12周',
        evidence_ids: ['E07', 'E08'],
      },
      moderate: {
        dose: '每日2粒，餐后温水送服',
        dose_per_serving: '每次2粒（276mg GSH）',
        frequency: '每日1次',
        duration: '12周',
        evidence_ids: ['E07', 'E08'],
      },
      // mild: 不推荐
      // normal: 不推荐
    },
    contraindication_keywords: [],
    contraindication_warnings: [],
  },
  {
    product_id: 'seven_probiotics',
    product_name: 'TYMB® 七联益生菌粉',
    mechanism: '7株益生菌（4000亿CFU/100g）联合双重益生元（低聚异麦芽糖+低聚果糖），重建肠道微生态；通过胰岛素-SP1(P)-CYP27A-LXRα/β-ABCA1通路促进肠道HDL3分泌，改善脂代谢；修复肠道屏障、降低LPS内毒素入血，减轻全身慢性炎症',
    doses: {
      critical: {
        dose: '每日2袋，早晚各1袋，≤37℃温水冲调后服用',
        dose_per_serving: '每次1袋（3g）',
        frequency: '每日2次',
        duration: '12周（建议连续服用，中断效果减弱）',
        evidence_ids: ['E03', 'E04'],
      },
      moderate: {
        dose: '每日1袋，≤37℃温水冲调后服用',
        dose_per_serving: '每次1袋（3g）',
        frequency: '每日1次',
        duration: '12周（建议连续服用）',
        evidence_ids: ['E03', 'E04'],
      },
      mild: {
        dose: '每日1袋（或隔日1袋），≤37℃温水冲调后服用',
        dose_per_serving: '每次1袋（3g）',
        frequency: '每日1次或隔日1次',
        duration: '16周，预防性维持肠道微生态',
        evidence_ids: ['E03'],
      },
      // normal: 不推荐
    },
    contraindication_keywords: [],
    contraindication_warnings: [],
  },
  {
    product_id: 'natto_red_yeast',
    product_name: 'TYMB® 纳豆红曲粉',
    mechanism: '纳豆激酶（天然纤溶因子）溶解纤维蛋白、维持血液正常流动；红曲莫纳可林K抑制HMG-CoA还原酶，直接阻断内源性胆固醇合成；二者协同，有效降低LDL-C、TC和TG',
    doses: {
      // 条件性推荐（所有风险等级），由 shouldAddNatto() 触发
      critical: {
        dose: '每日1袋，饭后温水冲调服用',
        dose_per_serving: '每次1袋（3g）',
        frequency: '每日1次',
        duration: '12周，监测LDL-C变化',
        evidence_ids: ['E05', 'E06'],
      },
      moderate: {
        dose: '每日1袋，饭后温水冲调服用',
        dose_per_serving: '每次1袋（3g）',
        frequency: '每日1次',
        duration: '12周，监测LDL-C变化',
        evidence_ids: ['E05', 'E06'],
      },
      mild: {
        dose: '每日1袋，饭后温水冲调服用',
        dose_per_serving: '每次1袋（3g）',
        frequency: '每日1次',
        duration: '12周，监测LDL-C变化',
        evidence_ids: ['E05', 'E06'],
      },
      normal: {
        dose: '每日1袋，饭后温水冲调服用',
        dose_per_serving: '每次1袋（3g）',
        frequency: '每日1次',
        duration: '12周，监测LDL-C变化',
        evidence_ids: ['E05', 'E06'],
      },
    },
    contraindication_keywords: ['他汀', '洛伐他汀', '辛伐他汀', '瑞舒伐他汀', '阿托伐他汀', '匹伐他汀', '氟伐他汀'],
    contraindication_warnings: ['⚠️ 红曲提取物（莫纳可林K）与他汀类药物合用可增强降脂效果但也增加肌病风险，如需合用请间隔1-2小时并告知主治医生，定期监测肝功能和肌酸激酶'],
  },
  {
    product_id: 'peptide_nutrients',
    product_name: 'TYMB® 短肽多种营养素复合粉',
    mechanism: '三源复合短肽（乳清+大豆+胶原）提供9.5%高质量短链氨基酸，快速吸收；联合26种维矿全谱+MCT（中链甘油三酯）支持细胞修复与能量代谢；针对肿瘤/术后/营养不良人群，改善蛋白质合成，促进伤口愈合，维持白蛋白水平',
    doses: {
      // 条件性推荐，由 shouldAddPeptide() 触发
      critical: {
        dose: '每日2次，每次1袋（20g），≤40℃温水冲调',
        dose_per_serving: '每次1袋（20g）',
        frequency: '每日2次',
        duration: '8-12周或遵医嘱',
        evidence_ids: ['E07'],
      },
      moderate: {
        dose: '每日2次，每次1袋（20g），≤40℃温水冲调',
        dose_per_serving: '每次1袋（20g）',
        frequency: '每日2次',
        duration: '8-12周或遵医嘱',
        evidence_ids: ['E07'],
      },
      mild: {
        dose: '每日2次，每次1袋（20g），≤40℃温水冲调',
        dose_per_serving: '每次1袋（20g）',
        frequency: '每日2次',
        duration: '8-12周或遵医嘱',
        evidence_ids: ['E07'],
      },
      normal: {
        dose: '每日2次，每次1袋（20g），≤40℃温水冲调',
        dose_per_serving: '每次1袋（20g）',
        frequency: '每日2次',
        duration: '8-12周或遵医嘱',
        evidence_ids: ['E07'],
      },
    },
    contraindication_keywords: ['肾功能不全', '肾衰', '慢性肾病'],
    contraindication_warnings: ['⚠️ 高蛋白配方，肾功能不全患者请在医生指导下使用，根据GFR调整蛋白质摄入量'],
  },
  {
    product_id: 'shuyan_ning',
    product_name: 'TYMB® 纾炏宁口溶粉',
    mechanism: '接骨木莓花青素多重免疫调节；4株专利益生菌（ZL 202311446476.3）通过肠-免疫轴调节固有免疫和适应性免疫；AKG（α-酮戊二酸）支持线粒体能量代谢；20+种维矿全谱营养补充；适用于免疫功能偏低、易感染、慢性炎症人群',
    doses: {
      // 条件性推荐，由 shouldAddShuyan() 触发
      critical: {
        dose: '每日2袋，温水冲调溶化后服用',
        dose_per_serving: '每次1袋（1g）',
        frequency: '每日2次',
        duration: '8-12周',
        evidence_ids: ['E07'],
      },
      moderate: {
        dose: '每日2袋，温水冲调溶化后服用',
        dose_per_serving: '每次1袋（1g）',
        frequency: '每日2次',
        duration: '8-12周',
        evidence_ids: ['E07'],
      },
      mild: {
        dose: '每日1-2袋，温水冲调溶化后服用',
        dose_per_serving: '每次1袋（1g）',
        frequency: '每日1-2次',
        duration: '8-12周',
        evidence_ids: ['E07'],
      },
      normal: {
        dose: '每日1袋，温水冲调溶化后服用',
        dose_per_serving: '每次1袋（1g）',
        frequency: '每日1次',
        duration: '8周，维持性免疫支持',
        evidence_ids: ['E07'],
      },
    },
    contraindication_keywords: [],
    contraindication_warnings: [],
  },
];

export function getProductById(product_id: string): ProductDoseConfig | undefined {
  return PRODUCT_CATALOG.find(p => p.product_id === product_id);
}
