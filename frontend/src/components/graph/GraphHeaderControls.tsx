import React from 'react';
import {
  Search, Sliders, Tag, Maximize2, RotateCcw,
  Sparkles, Activity, Compass, Route, Link2, ShieldAlert
} from 'lucide-react';

export type InvestigationToolMode = 'EXPLORE' | 'PATH_FINDER' | 'SHARED_LINKS';
export type PresetFilter = 'ALL' | 'CROSS_STATION' | 'SUSPECT_RING' | 'FINANCIAL_TRAIL';

export interface GraphHeaderControlsProps {
  title?: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedEntityType: string | null;
  onEntityTypeChange: (type: string | null) => void;
  layoutName: string;
  onLayoutChange: (layout: string) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  onFitView: () => void;
  onResetView: () => void;
  toolMode: InvestigationToolMode;
  onToolModeChange: (mode: InvestigationToolMode) => void;
  presetFilter: PresetFilter;
  onPresetFilterChange: (preset: PresetFilter) => void;
  stats?: {
    entityCount: number;
    edgeCount: number;
    caseCount?: number;
    componentCount?: number;
  };
  isLoading?: boolean;
}

export function GraphHeaderControls({
  title = 'INTELLIGENCE KNOWLEDGE GRAPH',
  subtitle,
  searchQuery,
  onSearchChange,
  selectedEntityType,
  onEntityTypeChange,
  layoutName,
  onLayoutChange,
  showLabels,
  onToggleLabels,
  onFitView,
  onResetView,
  toolMode,
  onToolModeChange,
  presetFilter,
  onPresetFilterChange,
  stats,
  isLoading = false,
}: GraphHeaderControlsProps) {
  return (
    <div className="w-full flex flex-col gap-2.5 p-3 bg-surface dark:bg-[#0b1220]/95 backdrop-blur-md border-b border-border-soft dark:border-slate-800/80 text-text dark:text-slate-200 select-none z-20 shadow-xs dark:shadow-xl font-sans">
      {/* Top Bar: Title & Telemetry & Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Title & Telemetry Stats */}
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-surface-2 dark:bg-slate-900/90 border border-border-soft dark:border-slate-800 rounded-xl shadow-xs">
            <Activity size={15} className="text-accent dark:text-cyan-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-mono font-bold tracking-wider text-text dark:text-slate-100 uppercase">
                {title}
              </span>
              {subtitle && (
                <span className="text-[10px] font-mono text-text-dim dark:text-slate-400 truncate max-w-[240px]">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Real-time stats badges */}
          {stats && (
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <div className="px-2.5 py-1 rounded-lg bg-surface-2 dark:bg-slate-900/80 border border-border-soft dark:border-slate-800 text-text-dim dark:text-slate-300">
                ENTITIES: <span className="font-bold text-amber-600 dark:text-amber-400">{stats.entityCount}</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-surface-2 dark:bg-slate-900/80 border border-border-soft dark:border-slate-800 text-text-dim dark:text-slate-300">
                LINKS: <span className="font-bold text-sky-600 dark:text-sky-400">{stats.edgeCount}</span>
              </div>
              {stats.caseCount !== undefined && stats.caseCount > 0 && (
                <div className="hidden sm:block px-2.5 py-1 rounded-lg bg-surface-2 dark:bg-slate-900/80 border border-border-soft dark:border-slate-800 text-text-dim dark:text-slate-300">
                  CASES: <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.caseCount}</span>
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 dark:bg-cyan-950/40 border border-accent/30 dark:border-cyan-800/60 text-accent dark:text-cyan-400 text-[10px] font-mono animate-pulse">
              <Sparkles size={12} />
              <span>SYNCING GRAPH...</span>
            </div>
          )}
        </div>

        {/* Search & Tool Mode Selectors */}
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-56">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim dark:text-slate-500" />
            <input
              type="text"
              placeholder="Filter node or identifier..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface-2 dark:bg-slate-950/80 border border-border-soft dark:border-slate-800 rounded-xl text-xs text-text dark:text-slate-100 placeholder-text-dim outline-none focus:border-accent dark:focus:border-cyan-500/70 transition-colors"
            />
          </div>

          {/* Investigation Tool Mode Switcher */}
          <div className="flex items-center bg-surface-2 dark:bg-slate-950/80 p-1 rounded-xl border border-border-soft dark:border-slate-800 text-[11px]">
            <button
              onClick={() => onToolModeChange('EXPLORE')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                toolMode === 'EXPLORE'
                  ? 'bg-brand text-bg dark:bg-cyan-500 dark:text-slate-950 shadow-xs'
                  : 'text-text-dim dark:text-slate-400 hover:text-text dark:hover:text-slate-200'
              }`}
            >
              <Compass size={12} />
              <span>Explore</span>
            </button>

            <button
              onClick={() => onToolModeChange('PATH_FINDER')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                toolMode === 'PATH_FINDER'
                  ? 'bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                  : 'text-text-dim dark:text-slate-400 hover:text-text dark:hover:text-slate-200'
              }`}
            >
              <Route size={12} />
              <span>Path Finder</span>
            </button>

            <button
              onClick={() => onToolModeChange('SHARED_LINKS')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                toolMode === 'SHARED_LINKS'
                  ? 'bg-purple-600 dark:bg-purple-500 text-white dark:text-slate-950 shadow-xs'
                  : 'text-text-dim dark:text-slate-400 hover:text-text dark:hover:text-slate-200'
              }`}
            >
              <Link2 size={12} />
              <span>Common Nexus</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Bar: Preset Filters & View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-border-soft/60 dark:border-slate-800/60 text-xs font-mono">
        {/* Preset Investigation Subgraphs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] text-text-dim dark:text-slate-400 uppercase font-bold tracking-wider shrink-0 flex items-center gap-1">
            <Tag size={11} /> PRESETS:
          </span>
          {[
            { id: 'ALL', label: 'All Connected' },
            { id: 'CROSS_STATION', label: 'Cross-Station' },
            { id: 'SUSPECT_RING', label: 'Suspect & Calls' },
            { id: 'FINANCIAL_TRAIL', label: 'Financial Trail' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => onPresetFilterChange(preset.id as PresetFilter)}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] transition-all cursor-pointer whitespace-nowrap font-bold ${
                presetFilter === preset.id
                  ? 'bg-accent/15 dark:bg-cyan-500/20 text-accent dark:text-cyan-300 border border-accent/30 dark:border-cyan-500/40'
                  : 'bg-surface-2 dark:bg-slate-900/60 text-text-dim dark:text-slate-400 border border-border-soft dark:border-slate-800/80 hover:text-text dark:hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* View Controls: Fit, Reset, Layout */}
        <div className="flex items-center gap-1.5 justify-end shrink-0">
          {/* Layout Selector */}
          <select
            value={layoutName}
            onChange={(e) => onLayoutChange(e.target.value)}
            className="px-2 py-1 rounded-lg bg-surface-2 dark:bg-slate-900/90 border border-border-soft dark:border-slate-800 text-[10px] text-text dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="cose">Force CoSE</option>
            <option value="circle">Concentric</option>
            <option value="breadthfirst">Hierarchical</option>
            <option value="grid">Grid Array</option>
          </select>

          <button
            onClick={onToggleLabels}
            className={`px-2 py-1 rounded-lg border text-[10px] transition-all cursor-pointer font-bold ${
              showLabels
                ? 'bg-surface-2 dark:bg-slate-800 text-text dark:text-slate-200 border-border-soft dark:border-slate-700'
                : 'text-text-dim dark:text-slate-400 border-transparent hover:border-border-soft'
            }`}
          >
            Labels
          </button>

          <button
            onClick={onFitView}
            className="p-1.5 rounded-lg bg-surface-2 dark:bg-slate-900/90 border border-border-soft dark:border-slate-800 text-text-dim dark:text-slate-300 hover:text-text dark:hover:text-slate-100 transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 size={12} />
          </button>

          <button
            onClick={onResetView}
            className="p-1.5 rounded-lg bg-surface-2 dark:bg-slate-900/90 border border-border-soft dark:border-slate-800 text-text-dim dark:text-slate-300 hover:text-text dark:hover:text-slate-100 transition-colors"
            title="Reset View"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
