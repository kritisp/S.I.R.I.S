import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

export interface LegendItem {
  type: string;
  label: string;
  color: string;
  iconSvg?: string;
}

export const ENTITY_TYPES_LEGEND: LegendItem[] = [
  { type: 'PERSON', label: 'Person / Suspect', color: '#EF4444' },
  { type: 'PHONE', label: 'Phone Number', color: '#10B981' },
  { type: 'LOCATION', label: 'Location', color: '#8B5CF6' },
  { type: 'VEHICLE', label: 'Vehicle', color: '#F59E0B' },
  { type: 'ORGANIZATION', label: 'Organization', color: '#EC4899' },
  { type: 'FINANCIAL', label: 'Financial Entity', color: '#06B6D4' },
  { type: 'CASE', label: 'Case / FIR', color: '#3B82F6' },
  { type: 'EVIDENCE', label: 'Evidence', color: '#F97316' },
  { type: 'OTHER', label: 'Other', color: '#64748B' },
];

export interface GraphLegendProps {
  selectedType?: string | null;
  onSelectType?: (type: string | null) => void;
  className?: string;
}

export function GraphLegend({ selectedType, onSelectType, className = '' }: GraphLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`absolute top-4 left-4 z-20 transition-all duration-200 ${className}`}
    >
      <div className="bg-[#0b1220]/90 backdrop-blur-md border border-slate-800/90 rounded-xl shadow-2xl p-3 text-slate-200 select-none min-w-[200px] max-w-[240px]">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80 mb-2">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
              Entity Types
            </span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors rounded hover:bg-slate-800/60"
            title={isCollapsed ? 'Expand Legend' : 'Collapse Legend'}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {/* Legend Content */}
        {!isCollapsed && (
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1 text-xs">
            {ENTITY_TYPES_LEGEND.map(item => {
              const isSelected = selectedType === item.type;
              return (
                <button
                  key={item.type}
                  onClick={() => onSelectType?.(isSelected ? null : item.type)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-all text-left border ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'border-transparent hover:bg-slate-800/50 hover:border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm transition-transform duration-200"
                      style={{
                        backgroundColor: item.color,
                        boxShadow: `0 0 8px ${item.color}bb`,
                      }}
                    />
                    <span className="truncate font-mono text-[11px] font-medium text-slate-300">
                      {item.label}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}

            {selectedType && (
              <button
                onClick={() => onSelectType?.(null)}
                className="w-full mt-2 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 py-1 rounded border border-cyan-800/40 hover:bg-cyan-950/40 text-center transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
