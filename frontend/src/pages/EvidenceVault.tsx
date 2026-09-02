import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Upload, FileText, Bot, AlertTriangle, Sparkles, CheckCircle2, 
  PhoneCall, Video, Truck, CreditCard, Layers, Plus, ArrowRight, Download, Edit3, FolderCheck, RefreshCw
} from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { PRIMARY_DEMO_CASE } from '../data/round3DemoData';
import { GraphConstructionOverlay } from '../components/intelligence/GraphConstructionOverlay';
import { WorkspaceInitModal } from '../components/workspace/WorkspaceInitModal';

export interface IngestionEvidenceItem {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  status: 'READY' | 'INGESTED' | 'PROCESSING';
  iconName: string;
  details: string;
}

const DEMO_EVIDENCE_PRESETS: IngestionEvidenceItem[] = [
  {
    id: 'ev-1',
    type: 'FIR REPORT',
    source: 'FIR #2026-0817 (Khandagiri PS)',
    timestamp: '2026-09-01 18:30 IST',
    status: 'READY',
    iconName: 'FileText',
    details: 'Commercial vehicle theft docket with complainant testimony and initial suspect descriptions.'
  },
  {
    id: 'ev-2',
    type: 'CDR DATA',
    source: 'Mobile Network Extract (+91-9199370000)',
    timestamp: '2026-09-01 19:15 IST',
    status: 'READY',
    iconName: 'PhoneCall',
    details: 'Cellular tower logs showing 14 calls between Rahul S. and accomplice prior to incident.'
  },
  {
    id: 'ev-3',
    type: 'ANPR / CCTV RECORDS',
    source: 'Khandagiri CCTV Cluster (KDG-04)',
    timestamp: '2026-09-01 19:42 IST',
    status: 'READY',
    iconName: 'Video',
    details: '94% confidence ANPR plate detection for Mahindra Thar (OD-02-MJ-8821).'
  },
  {
    id: 'ev-4',
    type: 'GEO TRAIL',
    source: 'Vehicle OD-02-MJ-8821 Hopping Trail',
    timestamp: '2026-09-01 19:45 IST',
    status: 'READY',
    iconName: 'Truck',
    details: 'Sequential camera hop vector reconstructed along NH-16 corridor.'
  },
  {
    id: 'ev-5',
    type: 'FINANCIAL TRANSACTIONS',
    source: 'Mule Account M-204 (Utkal Gramya Bank)',
    timestamp: '2026-09-01 20:10 IST',
    status: 'READY',
    iconName: 'CreditCard',
    details: 'FIU alert for ₹2,45,000 structured pass-through deposits.'
  }
];

export function EvidenceVault() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const workspaceQuery = searchParams.get('workspace') || 'Operation Nightfall';

  const [activeTab, setActiveTab] = useState<'queue' | 'custom'>('queue');
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  
  // State for ingested evidence items
  const [evidenceItems, setEvidenceItems] = useState<IngestionEvidenceItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [customEvidenceText, setCustomEvidenceText] = useState<string>(
    "FIR #2026-0817 (Khandagiri PS): Vehicle theft reported at Khandagiri Square. Flagged vehicle OD-02-MJ-8821 (Mahindra Thar) and suspect phone +91-9199370000. CCTV KDG-04 registered visual match at 19:42 IST. FIU flag on Mule Account M-204."
  );

  const handleLoadDemoEvidence = () => {
    setEvidenceItems(DEMO_EVIDENCE_PRESETS);
    setSelectedIds(DEMO_EVIDENCE_PRESETS.map(e => e.id));
    setActiveTab('queue');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === evidenceItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(evidenceItems.map(e => e.id));
    }
  };

  const handleIngest = () => {
    setIsOverlayOpen(true);
  };

  const ICON_MAP: Record<string, any> = {
    FileText: FileText,
    PhoneCall: PhoneCall,
    Video: Video,
    Truck: Truck,
    CreditCard: CreditCard
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12 font-sans select-none">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} /> CCTNS 2.0 INTELLIGENCE PIPELINE
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              {workspaceQuery}
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold text-text tracking-tight flex items-center gap-2">
            EVIDENCE VAULT
          </h1>
          <p className="text-xs text-text-dim mt-1 font-sans">
            &quot;Bring investigation evidence into the intelligence pipeline.&quot;
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleLoadDemoEvidence}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-hover text-bg font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer font-mono uppercase tracking-wider"
          >
            <Download size={15} />
            <span>LOAD DEMO EVIDENCE PRESETS</span>
          </button>

          <button
            onClick={() => setIsInitModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-surface-hover text-text font-bold text-xs rounded-xl border border-border-soft transition-all cursor-pointer font-mono"
          >
            <Plus size={15} className="text-brand" />
            <span>NEW WORKSPACE</span>
          </button>
        </div>
      </div>

      {/* Workspace Context Info Card */}
      <div className="p-4 rounded-xl bg-surface-2/80 border border-border-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="w-8 h-8 rounded-lg bg-brand/15 border border-brand/30 flex items-center justify-center text-brand shrink-0">
            <Layers size={16} />
          </div>
          <div>
            <div className="text-text font-bold uppercase flex items-center gap-2">
              <span>ACTIVE WORKSPACE: {workspaceQuery}</span>
              <span className="text-[10px] text-text-dim font-normal">[{PRIMARY_DEMO_CASE.firNumber}]</span>
            </div>
            <p className="text-[11px] text-text-dim">Khandagiri PS Jurisdiction • Objective: Vehicle Theft Syndicate Resolution</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex rounded-lg p-0.5 bg-surface border border-border-soft">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                activeTab === 'queue' ? 'bg-brand text-bg' : 'text-text-dim hover:text-text'
              }`}
            >
              EVIDENCE QUEUE ({evidenceItems.length})
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                activeTab === 'custom' ? 'bg-brand text-bg' : 'text-text-dim hover:text-text'
              }`}
            >
              MANUAL TEXT ENTRY
            </button>
          </div>
        </div>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'queue' ? (
        evidenceItems.length === 0 ? (
          /* UNPOPULATED QUEUE INITIAL VIEW */
          <div className="bg-surface p-10 rounded-3xl border border-dashed border-border-strong text-center space-y-6 animate-fade-in my-4">
            <div className="w-16 h-16 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand mx-auto shadow-inner">
              <FolderCheck size={32} />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-base font-mono font-bold text-text uppercase tracking-wider">
                EVIDENCE QUEUE IS CURRENTLY EMPTY
              </h2>
              <p className="text-xs text-text-dim font-sans leading-relaxed">
                Click <strong className="text-brand">&quot;LOAD DEMO EVIDENCE PRESETS&quot;</strong> to populate the 5 multi-modal investigation feeds (FIR Report, CDR Extracts, CCTV ANPR, Geo Trail, Financial Transactions) for <strong className="text-brand font-mono">{workspaceQuery}</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={handleLoadDemoEvidence}
                className="px-6 py-3 bg-brand hover:bg-brand-hover text-bg font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer font-mono flex items-center gap-2 uppercase tracking-wider scale-105 animate-pulse"
              >
                <Download size={16} />
                <span>LOAD DEMO EVIDENCE PRESETS (5 FEEDS)</span>
              </button>

              <button
                onClick={() => setActiveTab('custom')}
                className="px-5 py-3 bg-surface-2 hover:bg-surface-hover text-text font-bold text-xs rounded-xl border border-border-soft transition-all cursor-pointer font-mono flex items-center gap-2 uppercase tracking-wider"
              >
                <Edit3 size={16} className="text-brand" />
                <span>INPUT CUSTOM EVIDENCE TEXT</span>
              </button>
            </div>
          </div>
        ) : (
          /* POPULATED EVIDENCE QUEUE */
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold text-text uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} className="text-brand" /> MULTI-MODAL EVIDENCE INGESTION QUEUE ({selectedIds.length} / {evidenceItems.length} SELECTED)
              </h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 rounded-lg bg-surface border border-border-soft text-text-dim hover:text-text font-bold text-[11px] font-mono cursor-pointer"
                >
                  {selectedIds.length === evidenceItems.length ? 'DESELECT ALL' : 'SELECT ALL'}
                </button>
                <button
                  onClick={handleLoadDemoEvidence}
                  className="px-3 py-1 rounded-lg bg-surface-2 border border-border-soft text-brand font-bold text-[11px] font-mono cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={12} /> RESET PRESETS
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evidenceItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const IconComp = ICON_MAP[item.iconName] || FileText;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-surface border-brand ring-2 ring-brand/20 shadow-md'
                        : 'bg-surface-2/60 border-border-soft opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                            isSelected ? 'bg-brand/15 text-brand border-brand/30' : 'bg-surface text-text-dim border-border-soft'
                          }`}>
                            <IconComp size={16} />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-wider block">{item.type}</span>
                            <span className="text-xs font-mono font-bold text-text truncate block max-w-[180px]">{item.source}</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded bg-success/20 text-success text-[10px] font-mono font-bold border border-success/30">
                          {item.status}
                        </span>
                      </div>

                      <p className="text-xs text-text-dim font-sans leading-relaxed">{item.details}</p>
                    </div>

                    <div className="pt-3 border-t border-border-soft/60 flex items-center justify-between text-[10px] font-mono text-text-dim">
                      <span>Timestamp: {item.timestamp}</span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isSelected ? 'bg-brand text-bg border-brand' : 'border-border-soft bg-surface'
                      }`}>
                        {isSelected && <CheckCircle2 size={14} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleIngest}
                disabled={selectedIds.length === 0}
                className="px-6 py-3 bg-brand hover:bg-brand-hover text-bg font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer font-mono flex items-center gap-2 uppercase tracking-wider disabled:opacity-50"
              >
                <Sparkles size={16} />
                <span>INGEST ALL {selectedIds.length} FEEDS & CONSTRUCT KNOWLEDGE GRAPH</span>
              </button>
            </div>
          </div>
        )
      ) : (
        /* MANUAL CUSTOM TEXT ENTRY TAB */
        <div className="bg-surface p-6 rounded-2xl border border-border-soft shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border-soft pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold text-text uppercase tracking-wider flex items-center gap-2">
                <Upload size={14} className="text-brand" /> CUSTOM EVIDENCE TEXT / TRANSCRIPT INGESTION
              </h3>
              <p className="text-[11px] text-text-dim">Provide custom officer notes, witness transcriptions, or receipt details for AI extraction</p>
            </div>
          </div>

          <textarea
            rows={5}
            value={customEvidenceText}
            onChange={e => setCustomEvidenceText(e.target.value)}
            className="w-full bg-surface-2 border border-border-soft rounded-xl p-4 text-xs font-mono text-text outline-none focus:border-brand leading-relaxed"
            placeholder="Enter case evidence text..."
          />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleLoadDemoEvidence}
              className="text-xs font-mono text-brand hover:underline font-bold flex items-center gap-1"
            >
              <Download size={13} /> Load 5 Multi-Modal Demo Presets
            </button>

            <button
              onClick={handleIngest}
              disabled={!customEvidenceText.trim()}
              className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-bg font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer font-mono flex items-center gap-2 uppercase tracking-wider disabled:opacity-50"
            >
              <Sparkles size={15} />
              <span>INGEST CUSTOM EVIDENCE & CONSTRUCT GRAPH</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals & Overlays */}
      <WorkspaceInitModal
        isOpen={isInitModalOpen}
        onClose={() => setIsInitModalOpen(false)}
      />

      <GraphConstructionOverlay
        isOpen={isOverlayOpen}
        onComplete={() => setIsOverlayOpen(false)}
      />
    </div>
  );
}
