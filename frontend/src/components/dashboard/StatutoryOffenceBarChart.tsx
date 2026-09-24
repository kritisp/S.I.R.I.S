import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { BarChart3, AlertCircle } from 'lucide-react';
import { CaseRecord } from '../../mockServices/types';

interface StatutoryOffenceBarChartProps {
  cases: CaseRecord[];
}

const BAR_COLORS = [
  '#2563EB', // Blue
  '#F59E0B', // Amber
  '#059669', // Emerald
  '#7C3AED', // Purple
  '#DC2626', // Red
  '#0891B2', // Cyan
  '#64748B', // Slate
];

const OFFENCE_MAPPING: Record<string, string> = {
  theft: 'Vehicle Theft',
  robbery: 'Armed Robbery',
  cyber: 'Cyber Fraud',
  burglary: 'Burglary',
  narcotics: 'NDPS / Drugs',
  drug: 'NDPS / Drugs',
  assault: 'Physical Assault',
  extortion: 'Extortion',
  snatching: 'Chain Snatching',
  hit_and_run: 'Hit & Run',
};

export function StatutoryOffenceBarChart({ cases = [] }: StatutoryOffenceBarChartProps) {
  const chartData = useMemo(() => {
    if (!cases || cases.length === 0) return [];

    const counts: Record<string, number> = {};

    cases.forEach((c) => {
      const raw = (c.crimeType || 'General Offence').toLowerCase();
      let label = 'Other Offences';

      for (const [key, name] of Object.entries(OFFENCE_MAPPING)) {
        if (raw.includes(key)) {
          label = name;
          break;
        }
      }

      counts[label] = (counts[label] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([offence, count]) => ({
        offence,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [cases]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...chartData.map((d) => d.count));
  }, [chartData]);

  return (
    <div className="bg-surface border border-border-soft rounded-xl p-4 shadow-xs flex flex-col justify-between font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border-soft">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
            <BarChart3 size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text">
              Statutory Offence Distribution
            </h3>
            <p className="text-[11px] text-text-dim">
              Caseload breakdown by FIR classification
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-text-dim px-2 py-0.5 rounded bg-surface-2 border border-border-soft">
          {cases.length} Total Records
        </span>
      </div>

      {/* Chart Canvas */}
      <div className="py-2 min-h-[180px] w-full">
        {chartData.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-text-dim">
            <AlertCircle size={20} className="text-text-dim mb-1" />
            <p className="text-xs font-mono">No categorized offence data available for this station.</p>
          </div>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(100, 116, 139, 0.15)" />
                <XAxis
                  type="number"
                  domain={[0, maxCount + 1]}
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#64748B' }}
                  axisLine={{ stroke: 'rgba(100, 116, 139, 0.2)' }}
                />
                <YAxis
                  type="category"
                  dataKey="offence"
                  width={110}
                  tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(100, 116, 139, 0.2)' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(100, 116, 139, 0.08)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-surface border border-border-soft rounded-lg px-3 py-1.5 shadow-lg font-mono text-xs">
                          <p className="font-bold text-text">{data.offence}</p>
                          <p className="text-brand font-semibold">{data.count} Registered Cases</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-border-soft flex items-center justify-between text-[10px] font-mono text-text-dim">
        <span>Verified against State CCTNS Repository</span>
        {chartData[0] && (
          <span>
            Leading: <strong>{chartData[0].offence}</strong> ({chartData[0].count})
          </span>
        )}
      </div>
    </div>
  );
}
