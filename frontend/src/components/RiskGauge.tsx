import { useEffect, useRef, useState } from 'react';
import type { RiskLevel } from '../types';

const RISK_CFG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; glowSoft: string }> = {
  critical: { label: '严重风险', color: '#FF2D55', bg: 'rgba(255,45,85,0.06)',  border: 'rgba(255,45,85,0.35)', glowSoft: 'rgba(255,45,85,0.15)' },
  moderate: { label: '中度风险', color: '#FFB800', bg: 'rgba(255,184,0,0.06)',  border: 'rgba(255,184,0,0.35)', glowSoft: 'rgba(255,184,0,0.15)' },
  mild:     { label: '轻度风险', color: '#00E5FF', bg: 'rgba(0,229,255,0.06)',  border: 'rgba(0,229,255,0.35)', glowSoft: 'rgba(0,229,255,0.15)' },
  normal:   { label: '指标正常', color: '#00FF94', bg: 'rgba(0,255,148,0.06)', border: 'rgba(0,255,148,0.35)', glowSoft: 'rgba(0,255,148,0.15)' },
};

interface IndicatorDef {
  key: string;
  label: string;
  value: number | null;
  maxScale: number;
  refValue: number;
  refLabel: string;
  unit: string;
  inverted: boolean;
  decimals: number;
  delay: number;
  zones: { end: number; color: string }[];
}

function getValueColor(ind: IndicatorDef): string {
  const v = ind.value ?? 0;
  if (ind.inverted) {
    if (v <= 3)  return '#00FF94';
    if (v <= 10) return '#FFB800';
    if (v <= 30) return '#FF8C00';
    return '#FF2D55';
  }
  if (ind.key === 'omega3') {
    if (v >= 8) return '#00FF94';
    if (v >= 4) return '#FFB800';
    if (v >= 2) return '#FF8C00';
    return '#FF2D55';
  }
  // epa
  if (v >= 3)   return '#00FF94';
  if (v >= 1.5) return '#FFB800';
  if (v >= 0.5) return '#FF8C00';
  return '#FF2D55';
}

function useAnimatedValue(target: number, delay: number, duration = 2500): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const startAt = performance.now() + delay;

    function tick(now: number) {
      if (now < startAt) { rafRef.current = requestAnimationFrame(tick); return; }
      const t = Math.min((now - startAt) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, delay, duration]);

  return value;
}

interface Props {
  level: RiskLevel;
  aaEpaRatio: number | null;
  epaPct: number | null;
  omega3Index: number | null;
  summary: string;
}

export default function RiskGauge({ level, aaEpaRatio, epaPct, omega3Index }: Props) {
  const cfg = RISK_CFG[level];

  const indicators: IndicatorDef[] = [
    {
      key: 'aaEpa', label: 'AA : EPA', value: aaEpaRatio,
      maxScale: 40, refValue: 3, refLabel: '正常 ≤3', unit: '',
      inverted: true, decimals: 1, delay: 300,
      zones: [
        { end: 3,  color: 'rgba(0,255,148,0.10)' },
        { end: 10, color: 'rgba(255,184,0,0.10)' },
        { end: 30, color: 'rgba(255,140,0,0.10)' },
        { end: 40, color: 'rgba(255,45,85,0.10)' },
      ],
    },
    {
      key: 'omega3', label: 'Omega-3 指数', value: omega3Index,
      maxScale: 15, refValue: 8, refLabel: '目标 ≥8%', unit: '%',
      inverted: false, decimals: 2, delay: 800,
      zones: [
        { end: 2,  color: 'rgba(255,45,85,0.10)' },
        { end: 4,  color: 'rgba(255,140,0,0.10)' },
        { end: 8,  color: 'rgba(255,184,0,0.10)' },
        { end: 15, color: 'rgba(0,255,148,0.10)' },
      ],
    },
    {
      key: 'epa', label: 'EPA 占比', value: epaPct,
      maxScale: 5, refValue: 3, refLabel: '目标 ≥3%', unit: '%',
      inverted: false, decimals: 2, delay: 1300,
      zones: [
        { end: 0.5, color: 'rgba(255,45,85,0.10)' },
        { end: 1.5, color: 'rgba(255,140,0,0.10)' },
        { end: 3,   color: 'rgba(255,184,0,0.10)' },
        { end: 5,   color: 'rgba(0,255,148,0.10)' },
      ],
    },
  ];

  return (
    <div className="w-full" style={{ minWidth: 280, maxWidth: 400 }}>
      {/* Risk level badge */}
      <div className="flex justify-center mb-8">
        <div
          className="font-title text-sm font-bold px-7 py-2.5 rounded-full"
          style={{
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            color: cfg.color,
            boxShadow: `0 0 24px ${cfg.glowSoft}, 0 0 60px ${cfg.glowSoft}`,
            letterSpacing: '0.22em',
          }}
        >
          {cfg.label}
        </div>
      </div>

      {/* Indicator bars */}
      <div className="space-y-8">
        {indicators.map(ind => (
          <IndicatorBar key={ind.key} ind={ind} />
        ))}
      </div>
    </div>
  );
}

function IndicatorBar({ ind }: { ind: IndicatorDef }) {
  const value = ind.value ?? 0;
  const animValue = useAnimatedValue(value, ind.delay, 2500);
  const barColor = getValueColor(ind);
  const fillPct = Math.min((animValue / ind.maxScale) * 100, 100);
  const refPct = (ind.refValue / ind.maxScale) * 100;

  // Build zone gradient stops
  let prevPct = 0;
  const stops: string[] = [];
  for (const zone of ind.zones) {
    const pct = (zone.end / ind.maxScale) * 100;
    stops.push(`${zone.color} ${prevPct}%`, `${zone.color} ${pct}%`);
    prevPct = pct;
  }
  const zoneGradient = `linear-gradient(to right, ${stops.join(', ')})`;

  return (
    <div>
      {/* Header: label + reference */}
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-body text-sm font-semibold tracking-wider" style={{ color: 'var(--text-hi)' }}>
          {ind.label}
        </span>
        <span className="font-data text-xs" style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
          {ind.refLabel}
        </span>
      </div>

      {/* Animated counter */}
      <div className="mb-2.5">
        <span
          className="font-data text-3xl font-bold"
          style={{ color: barColor, textShadow: `0 0 16px ${barColor}60` }}
        >
          {ind.value != null ? animValue.toFixed(ind.decimals) : '—'}
        </span>
        {ind.unit && (
          <span className="font-data text-base ml-1" style={{ color: 'var(--text-mid)' }}>{ind.unit}</span>
        )}
      </div>

      {/* Bar */}
      <div className="relative" style={{ height: 14 }}>
        {/* Zone background */}
        <div className="absolute inset-0 rounded-full overflow-hidden" style={{ background: zoneGradient }} />

        {/* Fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${fillPct}%`,
            background: barColor,
            boxShadow: `0 0 10px ${barColor}70, 0 0 20px ${barColor}30`,
          }}
        />

        {/* Reference marker line */}
        <div className="absolute" style={{ left: `${refPct}%`, top: -4, bottom: -4, width: 2 }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'rgba(255,255,255,0.45)',
              borderRadius: 1,
            }}
          />
        </div>
      </div>

      {/* Scale endpoints */}
      <div className="flex justify-between mt-1.5">
        <span className="font-data" style={{ color: 'var(--text-dim)', fontSize: 10 }}>0</span>
        <span className="font-data" style={{ color: 'var(--text-dim)', fontSize: 10 }}>
          {ind.maxScale}{ind.unit}
        </span>
      </div>
    </div>
  );
}
