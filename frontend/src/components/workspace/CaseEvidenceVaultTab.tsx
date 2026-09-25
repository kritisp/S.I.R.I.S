import React, { useState } from 'react';
import { 
  Shield, FileText, PhoneCall, Video, Truck, CreditCard, Sparkles, 
  CheckCircle2, AlertTriangle, Play, RefreshCw, Lock, Download, 
  Layers, Upload, Cpu, Database, Award, ArrowRight, ShieldCheck, FileCheck
} from 'lucide-react';
import { useMockState } from '../../mockServices/MockStateContext';
import { evidenceApi } from '../../services/api';

export interface CaseEvidenceItem {
  id: string;
  type: 'PHYSICAL' | 'DIGITAL_DUMP' | 'CCTV_RECORD' | 'CDR_TELECOM' | 'FINANCIAL_TRANSACTION' | 'FORENSIC_FSL';
  title: string;
  sourceLocker: string;
  custodyHash: string;
  sealingStatus: 'SEALED' | 'UNSEALED_FOR_LAB' | 'VERIFIED';
  collectedDate: string;
  collectedBy: string;
  description: string;
  aiProcessed: boolean;
  extractedEntitiesCount: number;
}

interface CaseEvidenceVaultTabProps {
  caseId: string;
  firNumber?: string;
  onEntityExtracted?: (entity: any) => void;
}

export function CaseEvidenceVaultTab({ caseId, firNumber, onEntityExtracted }: CaseEvidenceVaultTabProps) {
  const { state, dispatch } = useMockState();

  const [evidenceList, setEvidenceList] = useState<CaseEvidenceItem[]>([
    {
      id: `EV-${caseId.slice(-4)}-01`,
      type: 'CCTV_RECORD',
      title: 'Commercial DVR Video Extract (Camera KDG-04)',
      sourceLocker: 'Vault Locker B-14 (Khandagiri PS)',
      custodyHash: 'sha256:4f8e219b67ad0021cfae99120489aa45f10928cd91e84a20b01c3d4e5f6a7b8c',
      sealingStatus: 'SEALED',
      collectedDate: '2026-08-20 04:30 IST',
      collectedBy: 'SI Sanjukta Behera (INV-BBSR-004)',
      description: '16-channel H.265 surveillance stream showing suspect vehicle arrival and getaway.',
      aiProcessed: false,
      extractedEntitiesCount: 0
    },
    {
      id: `EV-${caseId.slice(-4)}-02`,
      type: 'CDR_TELECOM',
      title: 'Khandagiri Square Tower Dump (02:00 - 04:00 AM)',
      sourceLocker: 'Cyber Cell Server #02 (Khordha SP Office)',
      custodyHash: 'sha256:a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
      sealingStatus: 'VERIFIED',
      collectedDate: '2026-08-20 06:15 IST',
      collectedBy: 'Cyber Cell Nodal Officer',
      description: '4,280 subscriber records filtered for midnight outbound calls to neighboring police jurisdictions.',
      aiProcessed: false,
      extractedEntitiesCount: 0
    },
    {
      id: `EV-${caseId.slice(-4)}-03`,
      type: 'FORENSIC_FSL',
      title: 'FSL Tool Mark Casting & Safe Lever Impression',
      sourceLocker: 'State Forensic Science Laboratory (SFSL Rasulgarh)',
      custodyHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      sealingStatus: 'SEALED',
      collectedDate: '2026-08-20 09:00 IST',
      collectedBy: 'Scientific Officer Dr. Das',
      description: 'Hydraulic pry-bar indentation profile with microscopic metal shaving samples.',
      aiProcessed: false,
      extractedEntitiesCount: 0
    },
    {
      id: `EV-${caseId.slice(-4)}-04`,
      type: 'DIGITAL_DUMP',
      title: 'Seized Android Handset Dump (OnePlus Nord)',
      sourceLocker: 'Digital Forensic Station #4',
      custodyHash: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      sealingStatus: 'UNSEALED_FOR_LAB',
      collectedDate: '2026-08-21 14:00 IST',
      collectedBy: 'IO Inspector Ramesh',
      description: 'Physical extraction of WhatsApp databases, Telegram media cache, and deleted call records.',
      aiProcessed: false,
      extractedEntitiesCount: 0
    }
  ]);

  // AI Evidence Agent Running State
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const [agentLogs, setAgentLogs] = useState<{ step: string; status: 'DONE' | 'RUNNING' }[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<CaseEvidenceItem | null>(null);

  const handleRunAiAgent = async (evidence: CaseEvidenceItem) => {
    setRunningAgentId(evidence.id);
    setSelectedEvidence(evidence);
    setAgentLogs([]);

    const logSteps = [
      'Verifying SHA-256 cryptographic chain-of-custody seal in tamper-evident ledger…',
      'Ingesting raw unstructured payload into multimodal NLP & computer vision pipeline…',
      'Running entity recognition (OD-Vehicle Regex, Indian Phone NER, Geo-spatial mapping)…',
      'Traversing Neo4j state graph to calculate similarity with active Odisha cases…',
      'Synthesizing actionable intelligence leads & grounding supporting evidence…'
    ];

    for (let i = 0; i < logSteps.length; i++) {
      setAgentLogs(prev => [...prev, { step: logSteps[i], status: 'RUNNING' }]);
      await new Promise(res => setTimeout(res, 900));
      setAgentLogs(prev => 
        prev.map((l, idx) => idx === i ? { ...l, status: 'DONE' } : l)
      );
    }

    // Mark evidence as processed
    setEvidenceList(prev => prev.map(ev => 
      ev.id === evidence.id ? { ...ev, aiProcessed: true, extractedEntitiesCount: ev.type === 'CCTV_RECORD' ? 3 : 4 } : ev
    ));

    setRunningAgentId(null);

    if (onEntityExtracted) {
      if (evidence.type === 'CCTV_RECORD') {
        onEntityExtracted({ type: 'VEHICLE', value: 'OD-02-AB-1234', confidence: 0.96 });
      } else if (evidence.type === 'CDR_TELECOM') {
        onEntityExtracted({ type: 'PHONE', value: '+91-9861099882', confidence: 0.94 });
      }
    }
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Evidence Vault Header Banner */}
      <div className="glass p-6 rounded-2xl bg-surface border border-border-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-brand/15 text-brand px-2 py-0.5 rounded border border-brand/30 uppercase flex items-center gap-1">
              <Lock size={12} /> SECURE EVIDENCE VAULT
            </span>
            <span className="text-[10px] font-mono font-bold text-success bg-success/15 px-2 py-0.5 rounded border border-success/30 flex items-center gap-1">
              <ShieldCheck size={11} /> SHA-256 HASH-CHAIN SEALED
            </span>
          </div>
          <h2 className="text-lg font-bold font-mono text-text">
            Case Evidence Locker &amp; Autonomous AI Processing Agent
          </h2>
          <p className="text-xs text-text-dim max-w-2xl">
            Tamper-evident evidence storage docket for <strong className="text-text">{firNumber || caseId}</strong>. Each asset is cryptographically hashed and processed via specialized NLP, CDR, and computer-vision agents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <div className="text-[10px] uppercase text-text-dim">Total Vault Items</div>
            <div className="text-xl font-bold text-brand">{evidenceList.length} ASSETS</div>
          </div>
        </div>
      </div>

      {/* Grid: Left = Evidence Items List, Right = AI Agent Execution Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Evidence Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border-soft pb-2">
            <h3 className="text-xs font-bold font-mono text-text uppercase flex items-center gap-1.5">
              <Layers size={14} className="text-brand" /> Registered Case Evidence Docket
            </h3>
            <span className="text-[10px] font-mono text-text-dim">
              {evidenceList.filter(e => e.aiProcessed).length} of {evidenceList.length} AI Analyzed
            </span>
          </div>

          <div className="space-y-3.5">
            {evidenceList.map(item => (
              <div 
                key={item.id}
                className={`glass p-5 rounded-2xl bg-surface border transition-all space-y-3 shadow-sm ${
                  runningAgentId === item.id 
                    ? 'border-brand shadow-brand/10 ring-1 ring-brand' 
                    : item.aiProcessed 
                    ? 'border-success/40 bg-surface/90' 
                    : 'border-border-soft hover:border-border'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-soft/60 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-surface-2 text-brand border border-border-soft">
                      {item.type === 'CCTV_RECORD' ? <Video size={16} /> :
                       item.type === 'CDR_TELECOM' ? <PhoneCall size={16} /> :
                       item.type === 'FORENSIC_FSL' ? <Award size={16} /> :
                       item.type === 'FINANCIAL_TRANSACTION' ? <CreditCard size={16} /> :
                       <FileText size={16} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-text-dim uppercase">
                          {item.id} · {item.type}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded border ${
                          item.sealingStatus === 'SEALED' 
                            ? 'bg-success/15 text-success border-success/30' 
                            : item.sealingStatus === 'VERIFIED'
                            ? 'bg-brand/15 text-brand border-brand/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          {item.sealingStatus}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold font-mono text-text mt-0.5">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  {item.aiProcessed ? (
                    <span className="px-3 py-1 rounded-xl bg-success/20 text-success border border-success/40 text-xs font-bold font-mono flex items-center gap-1.5 self-start sm:self-auto">
                      <CheckCircle2 size={13} /> {item.extractedEntitiesCount} ENTITIES EXTRACTED
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRunAiAgent(item)}
                      disabled={runningAgentId !== null}
                      className="px-3.5 py-1.5 rounded-xl bg-brand text-bg text-xs font-bold font-mono hover:bg-brand-bright transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
                    >
                      <Sparkles size={13} /> Run AI Forensic Agent
                    </button>
                  )}
                </div>

                <p className="text-xs text-text-dim leading-relaxed">
                  {item.description}
                </p>

                {/* Metadata details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-surface-2 p-3 rounded-xl border border-border-soft/60">
                  <div className="space-y-0.5">
                    <span className="text-text-faint text-[9px] uppercase">Storage Locker Reference</span>
                    <div className="text-text font-bold truncate">{item.sourceLocker}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-text-faint text-[9px] uppercase">Collection Timestamp</span>
                    <div className="text-text font-bold">{item.collectedDate}</div>
                  </div>
                  <div className="sm:col-span-2 space-y-0.5 pt-1 border-t border-border-soft/40">
                    <span className="text-text-faint text-[9px] uppercase">Chain-of-Custody Cryptographic Hash</span>
                    <div className="text-[10px] text-text-dim font-mono truncate">{item.custodyHash}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live AI Evidence Agent Console */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-soft pb-2">
            <h3 className="text-xs font-bold font-mono text-text uppercase flex items-center gap-1.5">
              <Cpu size={14} className="text-brand" /> AI Forensic Processing Terminal
            </h3>
            <span className="text-[10px] font-mono text-success">AGENT ONLINE</span>
          </div>

          <div className="glass p-5 rounded-2xl bg-surface border border-border-soft space-y-4 shadow-sm">
            {runningAgentId ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-brand">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Agent Processing Asset {runningAgentId}</span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {agentLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] leading-snug">
                      {log.status === 'DONE' ? (
                        <CheckCircle2 size={13} className="text-success shrink-0 mt-0.5" />
                      ) : (
                        <RefreshCw size={13} className="text-brand animate-spin shrink-0 mt-0.5" />
                      )}
                      <span className={log.status === 'DONE' ? 'text-text-dim' : 'text-brand font-bold'}>
                        {log.step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedEvidence && selectedEvidence.aiProcessed ? (
              <div className="space-y-3 font-mono">
                <div className="p-3 bg-success/10 border border-success/30 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-success">
                    <CheckCircle2 size={14} /> Analysis Successfully Finished
                  </div>
                  <p className="text-[11px] text-text-dim leading-snug">
                    Entities extracted and indexed into Neo4j graph for {selectedEvidence.title}.
                  </p>
                </div>

                <div className="p-3 bg-surface-2 border border-border-soft rounded-xl space-y-2">
                  <div className="text-[10px] uppercase font-bold text-text-dim">Discovered Grounded Entities:</div>
                  <div className="space-y-1.5 text-xs">
                    {selectedEvidence.type === 'CCTV_RECORD' ? (
                      <>
                        <div className="flex items-center justify-between bg-surface p-2 rounded border border-border-soft">
                          <span className="font-bold text-text">OD-02-AB-1234</span>
                          <span className="text-[9px] bg-brand/10 text-brand px-1.5 py-0.5 rounded">VEHICLE (96%)</span>
                        </div>
                        <div className="flex items-center justify-between bg-surface p-2 rounded border border-border-soft">
                          <span className="font-bold text-text">Baramunda Toll Plaza</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">LOCATION</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between bg-surface p-2 rounded border border-border-soft">
                          <span className="font-bold text-text">+91 98610 99882</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">PHONE (94%)</span>
                        </div>
                        <div className="flex items-center justify-between bg-surface p-2 rounded border border-border-soft">
                          <span className="font-bold text-text">Ramesh Sahu (Receiver)</span>
                          <span className="text-[9px] bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded">SUSPECT LINK</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-2 font-mono">
                <Cpu size={28} className="text-text-faint mx-auto" />
                <p className="text-xs text-text-dim">
                  Select an asset and click <strong className="text-brand">"Run AI Forensic Agent"</strong> to execute automated neural extraction and cryptographic validation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
