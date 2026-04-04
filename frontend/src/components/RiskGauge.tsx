import { useEffect, useState } from 'react';
import type { RiskLevel } from '../types';

const RISK_CONFIG = {
  critical: { label: '严重', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
  moderate: { label: '中度', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  mild:     { label: '轻度', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
  normal:   { label: '正常', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
};

// AA:EPA → 0-1 危险度（>30=1.0, 0=0）
function riskScore(aaEpa: number | null): number {
  if (!aaEpa) return 0;
  return Math.min(aaEpa / 35, 1);
}

interface Props {
  level: RiskLevel;
  aaEpaRatio: number | null;
  epaPct: number | null;
  omega3Index: number | null;
  summary: string;
}

export default function RiskGauge({ level, aaEpaRatio, epaPct, omega3Index, summary }: Props) {
  const config = RISK_CONFIG[level];
  const score = riskScore(aaEpaRatio);

  // 圆弧参数（半圆，从 225° 到 -45°，共 270°）
  const R = 80;
  const cx = 110;
  const cy = 110;
  const START_ANGLE = 135; // degrees
  const SWEEP = 270;

  function polarToXY(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  }

  function arcPath(startDeg: number, endDeg: number) {
    const s = polarToXY(startDeg);
    const e = polarToXY(endDeg);
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const [animScore, setAnimScore] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const filledEnd = START_ANGLE + animScore * SWEEP;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="220" height="160" viewBox="0 0 220 160">
          {/* 背景弧 */}
          <path
            d={arcPath(START_ANGLE, START_ANGLE + SWEEP)}
            fill="none" stroke="#21262d" strokeWidth="14" strokeLinecap="round"
          />
          {/* 彩色填充弧 */}
          {animScore > 0 && (
            <path
              d={arcPath(START_ANGLE, filledEnd)}
              fill="none"
              stroke={config.color}
              strokeWidth="14"
              strokeLinecap="round"
              style={{ transition: 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)', filter: `drop-shadow(0 0 8px ${config.color}60)` }}
            />
          )}
          {/* 中心数值 */}
          <text x={cx} y={cy + 10} textAnchor="middle" fill={config.color} fontSize="28" fontWeight="700" fontFamily="monospace">
            {aaEpaRatio?.toFixed(1) ?? '—'}
          </text>
          <text x={cx} y={cy + 28} textAnchor="middle" fill="#6e7681" fontSize="10">
            AA:EPA
          </text>
        </svg>
      </div>

      {/* 风险等级标签 */}
      <div className="px-5 py-1.5 rounded-full font-semibold text-sm -mt-2"
        style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.color }}>
        {config.label}风险
      </div>

      {/* 关键指标 */}
      <div className="flex gap-6 mt-4">
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: '#6e7681' }}>Omega-3 指数</div>
          <div className="font-mono font-semibold" style={{ color: omega3Index && omega3Index < 7 ? '#f59e0b' : '#e6edf3' }}>
            {omega3Index?.toFixed(1) ?? '—'}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: '#6e7681' }}>EPA%</div>
          <div className="font-mono font-semibold" style={{ color: epaPct && epaPct < 1.5 ? '#ef4444' : '#e6edf3' }}>
            {epaPct?.toFixed(2) ?? '—'}%
          </div>
        </div>
      </div>

      {/* 风险摘要 */}
      <p className="text-xs text-center mt-3 max-w-xs leading-relaxed" style={{ color: '#8b949e' }}>
        {summary}
      </p>
    </div>
  );
}
