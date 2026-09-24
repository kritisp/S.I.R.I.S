import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CaseRecord } from '../../mockServices/types';

interface CrimeCategory {
  key: string;
  defaultName: string;
  count: number;
  percentage: number;
  color: string;
}

interface CrimeCategoryDonutChartProps {
  cases?: CaseRecord[];
}

const CATEGORY_COLORS: Record<string, string> = {
  theft: '#F59E0B',
  robbery: '#EF4444',
  cyber: '#3B82F6',
  fraud: '#38BDF8',
  burglary: '#8B5CF6',
  assault: '#EC4899',
  narcotics: '#10B981',
  extortion: '#F97316',
  other: '#64748B',
};

export function CrimeCategoryDonutChart({ cases = [] }: CrimeCategoryDonutChartProps) {
  const { t } = useLanguage();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { categories, totalCases } = useMemo(() => {
    if (!cases || cases.length === 0) {
      return {
        categories: [
          { key: 'cat.theft', defaultName: 'Theft & Robbery', count: 1, percentage: 50, color: '#F59E0B' },
          { key: 'cat.cyber', defaultName: 'Cyber & Fraud', count: 1, percentage: 50, color: '#3B82F6' },
        ],
        totalCases: 2,
      };
    }

    const counts: Record<string, number> = {};
    cases.forEach((c) => {
      const type = (c.crimeType || 'other').toLowerCase();
      let bucket = 'other';
      if (type.includes('theft') || type.includes('vehicle')) bucket = 'theft';
      else if (type.includes('robbery') || type.includes('snatching')) bucket = 'robbery';
      else if (type.includes('cyber') || type.includes('otp')) bucket = 'cyber';
      else if (type.includes('fraud') || type.includes('money')) bucket = 'fraud';
      else if (type.includes('burglary') || type.includes('house')) bucket = 'burglary';
      else if (type.includes('assault')) bucket = 'assault';
      else if (type.includes('narcotics') || type.includes('drug')) bucket = 'narcotics';
      else if (type.includes('extortion')) bucket = 'extortion';

      counts[bucket] = (counts[bucket] || 0) + 1;
    });

    const total = cases.length;
    const cats: CrimeCategory[] = Object.entries(counts).map(([bucket, count]) => ({
      key: `cat.${bucket}`,
      defaultName: bucket.charAt(0).toUpperCase() + bucket.slice(1),
      count,
      percentage: Math.round((count / total) * 100),
      color: CATEGORY_COLORS[bucket] || CATEGORY_COLORS.other,
    })).sort((a, b) => b.count - a.count);

    return { categories: cats, totalCases: total };
  }, [cases]);
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="bg-surface dark:bg-[#0F1726] border border-border dark:border-[#1E293B] rounded-2xl p-4 flex flex-col justify-between shadow-xs h-full">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-xs font-bold font-sans text-text dark:text-[#F8FAFC] tracking-wide">
          {t('dashboard.casesByCrime', 'Cases by Crime Category')}
        </h3>
      </div>

      {/* Chart + Legend Container */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-auto">
        {/* Donut Chart SVG with Center Badge */}
        <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {categories.map((cat, idx) => {
              const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += cat.percentage;

              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={cat.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={cat.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center Metric Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-2xl font-bold font-display text-text dark:text-[#F8FAFC] leading-none">
              {hoveredIdx !== null ? categories[hoveredIdx]?.count : totalCases}
            </span>
            <span className="text-[9px] font-mono font-medium text-text-faint dark:text-[#94A3B8] uppercase mt-1">
              {hoveredIdx !== null ? t(categories[hoveredIdx]?.key, categories[hoveredIdx]?.defaultName) : t('dashboard.activeCases', 'Active Cases')}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-1.5 w-full sm:w-auto">
          {categories.map((cat, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={cat.key}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                  isHovered ? 'bg-surface-hover dark:bg-[#151E31]' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs text-text dark:text-[#E2E8F0] font-medium truncate">
                    {t(cat.key, cat.defaultName)}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-text-dim dark:text-[#94A3B8] shrink-0 font-medium">
                  {cat.percentage}% <span className="text-text-faint dark:text-[#64748B]">({cat.count})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
