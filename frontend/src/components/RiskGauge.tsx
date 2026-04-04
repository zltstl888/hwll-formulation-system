import { useEffect, useState } from 'react';
import type { RiskLevel } from '../types';

const CFG = {
  critical: { label: '严重风险', color: '#FF2D55', glow: 'rgba(255,45,85,0.7)',  glowSoft: 'rgba(255,45,85,0.15)',  bg: 'rgba(255,45,85,0.06)',  border: 'rgba(255,45,85,0.35)'  },
  moderate: { label: '中度风险', color: '#FFB800', glow: 'rgba(255,184,0,0.7)',  glowSoft: 'rgba(255,184,0,0.15)',  bg: 'rgba(255,184,0,0.06)',  border: 'rgba(255,184,0,0.35)'  },
  mild:     { label: '轻度风险', color: '#00E5FF', glow: 'rgba(0,229,255,0.7)',   glowSoft: 'rgba(0,229,255,0.15)',  bg: 'rgba(0,229,255,0.06)',  border: 'rgba(0,229,255,0.35)'  },
  normal:   { label: '指标正常', color: '#00FF94', glow: 'rgba(0,255,148,0.7)',   glowSoft: 'rgba(0,255,148,0.15)',  bg: 'rgba(0,255,148,0.06)',  border: 'rgba(0,255,148,0.35)'  },
};

function arcScore(aaEpa: number | null) {
  return Math.min((aaEpa ?? 0) / 36, 1);
}

function polarXY(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcD(cx: number, cy: number, r: number, s: number, e: number) {
  const p1 = polarXY(cx, cy, r, s);
  const p2 = polarXY(cx, cy, r, e);
  const large = Math.abs(e - s) > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
}

interface Props {
  level: RiskLevel;
  aaEpaRatio: number | null;
  epaPct: number | null;
  omega3Index: number | null;
  summary: string;
}

export default function RiskGauge({ level, aaEpaRatio, epaPct, omega3Index, summary }: Props) {
  const cfg = CFG[level];
  const finalScore = arcScore(aaEpaRatio);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setScore(finalScore), 150);
    return () => clearTimeout(t);
  }, [finalScore]);

  const CX = 140, CY = 140;
  const R_OUTER = 110, R_MID = 90, R_INNER = 70;
  const START = 135, SWEEP = 270;
  const fillEnd = START + score * SWEEP;

  const tickAngles = Array.from({ length: 13 }, (_, i) => START + (i / 12) * SWEEP);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="280" height="240" viewBox="0 0 280 240" style={{ overflow: 'visible', width: '100%', maxWidth: 280, height: 'auto' }}>
          <defs>
            <filter id="glow-arc">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-text">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={cfg.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={cfg.color} stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Outermost decorative ring (faint) */}
          <path d={arcD(CX, CY, R_OUTER + 16, START, START + SWEEP)}
            fill="none" stroke="rgba(0,229,255,0.06)" strokeWidth="1" />

          {/* Tick marks */}
          {tickAngles.map((ang, i) => {
            const inner = polarXY(CX, CY, R_OUTER + 8, ang);
            const outer = polarXY(CX, CY, R_OUTER + 18, ang);
            const isMajor = i % 3 === 0;
            return (
              <line key={i}
                x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke={isMajor ? 'rgba(0,229,255,0.35)' : 'rgba(0,229,255,0.12)'}
                strokeWidth={isMajor ? 1.5 : 0.8}
              />
            );
          })}

          {/* Outer track */}
          <path d={arcD(CX, CY, R_OUTER, START, START + SWEEP)}
            fill="none" stroke="rgba(0,229,255,0.06)" strokeWidth="18" strokeLinecap="round" />

          {/* Outer filled arc */}
          {score > 0.01 && (
            <path
              d={arcD(CX, CY, R_OUTER, START, fillEnd)}
              fill="none"
              stroke={cfg.color}
              strokeWidth="18"
              strokeLinecap="round"
              filter="url(#glow-arc)"
              style={{
                transition: 'all 1.4s cubic-bezier(0.34, 1.2, 0.64, 1)',
                filter: `drop-shadow(0 0 8px ${cfg.glow}) drop-shadow(0 0 18px ${cfg.glow})`,
              }}
            />
          )}

          {/* Middle decorative track */}
          <path d={arcD(CX, CY, R_MID, START, START + SWEEP)}
            fill="none" stroke="rgba(0,229,255,0.04)" strokeWidth="2" strokeLinecap="round"
            strokeDasharray="4 8" />

          {/* Inner halo circle */}
          <circle cx={CX} cy={CY} r={R_INNER - 2}
            fill="none" stroke={cfg.color} strokeWidth="0.5" opacity="0.15" />

          {/* Inner glow fill */}
          <circle cx={CX} cy={CY} r={R_INNER - 10}
            fill={cfg.glowSoft} />

          {/* Central value */}
          <text x={CX} y={CY - 14} textAnchor="middle"
            fontFamily="'Orbitron', monospace" fontWeight="900" fontSize="36"
            fill={cfg.color}
            filter="url(#glow-text)"
            style={{ letterSpacing: '0.02em' }}>
            {aaEpaRatio?.toFixed(1) ?? '—'}
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle"
            fontFamily="'Share Tech Mono', monospace" fontSize="11"
            fill="rgba(0,229,255,0.5)" letterSpacing="0.15em">
            AA : EPA
          </text>

          {/* Label arc start/end */}
          {(() => {
            const s = polarXY(CX, CY, R_OUTER + 26, START + 2);
            const e = polarXY(CX, CY, R_OUTER + 26, START + SWEEP - 2);
            return (
              <>
                <text x={s.x - 4} y={s.y + 4} fontFamily="'Share Tech Mono', monospace" fontSize="8" fill="rgba(0,229,255,0.3)">0</text>
                <text x={e.x - 8} y={e.y + 4} fontFamily="'Share Tech Mono', monospace" fontSize="8" fill={cfg.color} opacity="0.6">MAX</text>
              </>
            );
          })()}
        </svg>

        {/* Animated ping on critical */}
        {level === 'critical' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '10px' }}>
            <div className="w-32 h-32 rounded-full pulse-ring"
              style={{ border: `1px solid ${cfg.color}`, opacity: 0.2 }} />
          </div>
        )}
      </div>

      {/* Risk level badge */}
      <div
        className="font-title text-sm font-bold tracking-[0.2em] px-7 py-2.5 rounded-full -mt-4 relative z-10"
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

      {/* Sub-indicators */}
      <div className="flex gap-8 mt-7">
        {[
          { label: 'OMEGA-3 INDEX', value: omega3Index?.toFixed(1), unit: '%', warn: omega3Index != null && omega3Index < 7 },
          { label: 'EPA %',         value: epaPct?.toFixed(2),      unit: '%', warn: epaPct != null && epaPct < 1.5 },
        ].map(item => (
          <div key={item.label} className="text-center">
            <p className="font-data text-xs tracking-widest mb-2" style={{ color: 'var(--text-dim)', letterSpacing: '0.18em' }}>
              {item.label}
            </p>
            <p className="font-data text-xl font-bold"
              style={{
                color: item.warn ? '#FFB800' : '#E8F4FF',
                textShadow: item.warn ? '0 0 16px rgba(255,184,0,0.7)' : 'none',
              }}>
              {item.value ?? '—'}<span className="text-sm ml-0.5" style={{ color: 'var(--text-mid)' }}>{item.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <p className="font-body text-sm text-center mt-5 max-w-xs leading-relaxed px-2"
        style={{ color: 'var(--text-mid)', lineHeight: 1.7 }}>
        {summary}
      </p>
    </div>
  );
}
