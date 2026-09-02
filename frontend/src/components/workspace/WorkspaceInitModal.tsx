import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, CheckCircle2, Shield, FolderPlus, ArrowRight, X, Clock, MapPin, Target 
} from 'lucide-react';
import { PRIMARY_DEMO_CASE } from '../../data/round3DemoData';

interface WorkspaceInitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkspaceInitModal({ isOpen, onClose }: WorkspaceInitModalProps) {
  const navigate = useNavigate();
  const [workspaceName, setWorkspaceName] = useState('Operation Nightfall');
  const [caseNumber, setCaseNumber] = useState(PRIMARY_DEMO_CASE.firNumber);
  const [objective, setObjective] = useState('Identify the network behind recurring vehicle thefts');
  const [location, setLocation] = useState('Khandagiri, Bhubaneswar');

  const [isInitializing, setIsInitializing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isReady, setIsReady] = useState(false);

  if (!isOpen) return null;

  const initSteps = [
    'Case context loaded',
    'Officer authorization verified',
    'Investigation scope created',
    'Intelligence sources initialized',
    'Evidence workspace ready'
  ];

  const handleInitialize = () => {
    setIsInitializing(true);
    setCurrentStep(0);

    // Staged animation
    initSteps.forEach((_, idx) => {
      setTimeout(() => {
        setCurrentStep(idx + 1);
        if (idx === initSteps.length - 1) {
          setTimeout(() => {
            setIsReady(true);
          }, 300);
        }
      }, (idx + 1) * 400);
    });
  };

  const handleProceed = () => {
    onClose();
    // Navigate to Evidence Vault with workspace active
    navigate('/evidence?workspace=Operation%20Nightfall');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="bg-surface border border-border-strong rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow Ambient Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-soft pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/40 flex items-center justify-center text-brand">
              <FolderPlus size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono font-bold text-text uppercase tracking-wider">NEW INVESTIGATION WORKSPACE</h2>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/30">CCTNS 2.0</span>
              </div>
              <p className="text-[11px] font-mono text-text-dim mt-0.5">Initialize a multi-modal investigation dossier</p>
            </div>
          </div>

          <button onClick={onClose} className="text-text-dim hover:text-text p-1.5 rounded-lg hover:bg-surface-hover cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Inputs / Form */}
        {!isInitializing && !isReady ? (
          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">Workspace Name</label>
              <input
                type="text"
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
                className="w-full bg-surface-2 border border-border-soft rounded-xl px-3.5 py-2.5 text-text font-bold outline-none focus:border-brand"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">Target Case</label>
                <input
                  type="text"
                  value={caseNumber}
                  onChange={e => setCaseNumber(e.target.value)}
                  className="w-full bg-surface-2 border border-border-soft rounded-xl px-3.5 py-2 text-brand font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">Primary Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-surface-2 border border-border-soft rounded-xl px-3.5 py-2 text-text outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">Investigation Objective</label>
              <textarea
                rows={2}
                value={objective}
                onChange={e => setObjective(e.target.value)}
                className="w-full bg-surface-2 border border-border-soft rounded-xl px-3.5 py-2 text-text outline-none focus:border-brand"
              />
            </div>

            <div className="p-3 rounded-xl bg-surface-2/80 border border-border-soft text-[11px] text-text-dim flex items-center gap-2">
              <Shield size={16} className="text-brand shrink-0" />
              <span>Initializes the evidence ingestion pipeline and cross-station network graph for Case #2026-0817.</span>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-surface-2 hover:bg-surface-hover text-text font-bold text-xs rounded-xl border border-border-soft cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleInitialize}
                className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-bg font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              >
                <span>INITIALIZE INVESTIGATION</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ) : (
          /* Professional Initialization Loading Animation */
          <div className="space-y-5 font-mono py-4">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center justify-center gap-2">
                <Sparkles size={16} className="text-brand animate-spin" />
                {isReady ? 'INVESTIGATION WORKSPACE READY' : 'INITIALIZING INVESTIGATION...'}
              </h3>
              <p className="text-xs text-brand font-bold">{workspaceName} • {caseNumber}</p>
            </div>

            <div className="p-4 rounded-xl bg-surface-2 border border-border-soft space-y-3 text-xs">
              {initSteps.map((step, idx) => {
                const isDone = currentStep > idx;
                const isCurrent = currentStep === idx;
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <CheckCircle2 size={16} className="text-success" />
                      ) : isCurrent ? (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-brand border-t-transparent animate-spin"></span>
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-border-soft bg-surface"></span>
                      )}
                      <span className={isDone ? 'text-text font-bold' : isCurrent ? 'text-brand font-bold animate-pulse' : 'text-text-dim'}>
                        {step}
                      </span>
                    </div>
                    {isDone && <span className="text-[10px] text-success font-bold">DONE</span>}
                  </div>
                );
              })}
            </div>

            {isReady && (
              <div className="pt-2 animate-fade-in">
                <button
                  type="button"
                  onClick={handleProceed}
                  className="w-full py-3 bg-brand hover:bg-brand-hover text-bg font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>PROCEED TO EVIDENCE INGESTION VAULT</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
