import React, { useState } from 'react';
import { 
  Bot, ShieldAlert, Sparkles, Languages, CheckCircle2, AlertTriangle, 
  CreditCard, PhoneCall, Scale, ArrowRight, X, Play, RefreshCw, FileText, Volume2, VolumeX
} from 'lucide-react';
import { 
  agenticIntelligenceService, 
  AgenticAnalysisReport, 
  AgentExecutionStep 
} from '../../services/agenticIntelligenceService';
import { SupportedLanguage } from '../../services/bhasiniTranslationService';

interface AgenticInvestigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceContextText?: string;
  targetPhone?: string;
}

const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'or', label: 'ଓଡ଼ିଆ (Odia)', flag: '🏛️' },
  { code: 'bn', label: 'বাংলা (Bengali)', flag: '🐯' },
  { code: 'mr', label: 'मराठी (Marathi)', flag: '🚩' },
];

export function AgenticInvestigatorModal({
  isOpen,
  onClose,
  evidenceContextText,
  targetPhone = '+919876543210'
}: AgenticInvestigatorModalProps) {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const [executionSteps, setExecutionSteps] = useState<AgentExecutionStep[]>([]);
  const [report, setReport] = useState<AgenticAnalysisReport | null>(null);

  const handlePlayTts = async () => {
    if (!report) return;
    if (isPlayingTts) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlayingTts(false);
      return;
    }

    setIsPlayingTts(true);
    try {
      const res = await bhasiniTranslationService.textToSpeech(report.summary, selectedLang);
      if (res.audioUrl) {
        await bhasiniTranslationService.playAudio(res.audioUrl);
      } else {
        bhasiniTranslationService.speakNativeSpeechSynthesis(report.summary, selectedLang);
      }
    } catch (err) {
      console.warn('Bhasini TTS fallback notice:', err);
      bhasiniTranslationService.speakNativeSpeechSynthesis(report.summary, selectedLang);
    } finally {
      setIsPlayingTts(false);
    }
  };

  if (!isOpen) return null;

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setReport(null);

    try {
      const res = await agenticIntelligenceService.runAgenticAnalysis(
        evidenceContextText,
        targetPhone,
        selectedLang,
        (steps) => setExecutionSteps(steps)
      );
      setReport(res);
    } catch (err) {
      console.error('Agentic AI analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLangChange = async (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    if (report) {
      // Re-run analysis with newly selected Bhasini translation target
      setIsAnalyzing(true);
      try {
        const res = await agenticIntelligenceService.runAgenticAnalysis(
          evidenceContextText,
          targetPhone,
          lang
        );
        setReport(res);
      } catch (err) {
        console.error('Bhasini translation change error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-surface border border-brand/40 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 bg-surface-2 border-b border-border-soft flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand shadow-inner">
              <Bot size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text font-display">S.I.R.I.S Multi-Agentic AI Investigator</h2>
                <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/30 text-[9px] font-mono font-bold uppercase">
                  AGENTIC REASONING + BHASINI NLU
                </span>
              </div>
              <p className="text-xs text-text-dim mt-0.5">Autonomous Financial Crime (Money Trail) + Telecom CDR Multi-Agentic Synthesis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Multilingual Bhasini Language Switcher */}
            <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-border-soft">
              <Languages size={14} className="text-brand ml-1" />
              <select
                value={selectedLang}
                onChange={(e) => handleLangChange(e.target.value as SupportedLanguage)}
                className="bg-transparent text-xs font-mono font-bold text-text outline-none cursor-pointer pr-2"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code} className="bg-surface text-text">
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-surface hover:bg-surface-hover flex items-center justify-center text-text-dim hover:text-text border border-border-soft transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {!report && !isAnalyzing && (
            <div className="py-10 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand mx-auto shadow-lg">
                <Sparkles size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text font-display uppercase tracking-wider">
                  Invoke Agentic AI Evidence Analysis
                </h3>
                <p className="text-xs text-text-dim mt-2 leading-relaxed font-sans">
                  Dispatches specialized autonomous agents to process uploaded bank ledgers, CDR call detail records, cell tower dumps, and FIR notes simultaneously.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left font-mono text-[11px]">
                <div className="p-3 bg-surface-2 rounded-xl border border-border-soft space-y-1">
                  <span className="font-bold text-brand flex items-center gap-1">
                    <CreditCard size={13} /> Money Trail Agent
                  </span>
                  <p className="text-text-dim">Pass-through mules, structuring, frozen accounts (BNSS 107)</p>
                </div>
                <div className="p-3 bg-surface-2 rounded-xl border border-border-soft space-y-1">
                  <span className="font-bold text-brand flex items-center gap-1">
                    <PhoneCall size={13} /> Telecom CDR Agent
                  </span>
                  <p className="text-text-dim">Tower hoppers, nocturnal bursts, IMEI switches</p>
                </div>
              </div>

              <button
                onClick={handleStartAnalysis}
                className="w-full py-3 bg-brand hover:bg-brand-bright text-bg font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer font-mono flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <Play size={16} /> Execute Multi-Agentic AI Analysis
              </button>
            </div>
          )}

          {/* Running Execution Steps Animation */}
          {isAnalyzing && (
            <div className="py-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs font-mono font-bold animate-pulse">
                  <Bot size={14} className="animate-spin" /> AGENTS EXECUTING CROSS-DOMAIN REASONING...
                </div>
                <h3 className="text-sm font-bold text-text font-mono">Bhasini Multilingual Target: {LANGUAGES.find(l => l.code === selectedLang)?.label}</h3>
              </div>

              <div className="space-y-3 max-w-xl mx-auto font-mono text-xs">
                {executionSteps.map((step, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl border transition-all ${
                      step.status === 'COMPLETED' ? 'bg-success/5 border-success/30 text-text' :
                      step.status === 'RUNNING' ? 'bg-brand/10 border-brand/40 text-brand animate-pulse' :
                      'bg-surface-2 border-border-soft text-text-dim opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-2">
                        {step.status === 'COMPLETED' ? <CheckCircle2 size={15} className="text-success" /> : <Bot size={15} />}
                        {step.agentName}
                      </span>
                      <span>{step.progressPct}%</span>
                    </div>
                    {step.findingSummary && (
                      <p className="text-[11px] text-text-dim mt-1.5 font-sans leading-relaxed">{step.findingSummary}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agentic Analysis Report View */}
          {report && !isAnalyzing && (
            <div className="space-y-6 animate-slide-in">
              
              {/* Executive Summary Card */}
              <div className="p-5 bg-brand/10 border border-brand/30 rounded-2xl space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-brand" />
                    <span className="text-xs font-bold text-brand uppercase tracking-wider">
                      AGENTIC SYNTHESIS REPORT (LANGUAGE: {LANGUAGES.find(l => l.code === selectedLang)?.label})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePlayTts}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        isPlayingTts ? 'bg-brand text-bg animate-pulse' : 'bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30'
                      }`}
                    >
                      {isPlayingTts ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      <span>{isPlayingTts ? 'STOP BRIEFING' : 'LISTEN VOICE BRIEFING (BHASINI TTS)'}</span>
                    </button>

                    <span className="px-2.5 py-0.5 rounded-full bg-danger/20 text-danger-bright border border-danger/30 text-[10px] font-bold uppercase">
                      THREAT SCORE: {report.threatScore} / 100 ({report.overallThreatLevel})
                    </span>
                  </div>
                </div>

                <p className="text-xs text-text leading-relaxed font-sans font-medium bg-surface/80 p-3 rounded-xl border border-border-soft">
                  {report.summary}
                </p>
              </div>

              {/* Identified Key Suspect Leads */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Bot size={14} className="text-brand" /> Primary Suspect Leads Identified by Agentic Consensus ({report.suspectLeads.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  {report.suspectLeads.map((s, idx) => (
                    <div key={idx} className="p-4 bg-surface-2 border border-border-soft rounded-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-border-soft pb-2">
                        <div>
                          <h5 className="font-bold text-text">{s.suspectName}</h5>
                          <span className="text-[10px] text-brand font-semibold">{s.role}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-danger/20 text-danger-bright text-[9px] font-bold border border-danger/30">
                          CONFIDENCE: {s.confidenceScore}%
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] text-text-dim font-sans">
                        {s.reasons.map((r, ridx) => (
                          <div key={ridx} className="flex items-start gap-1.5">
                            <span className="text-brand mt-0.5">•</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>

                      {/* Multi-Source Matrix */}
                      <div className="pt-2 border-t border-border-soft/60 flex items-center gap-2 text-[9px]">
                        <span className={`px-2 py-0.5 rounded border ${s.multiSourceEvidence.hasMoneyTrail ? 'bg-success/10 text-success border-success/30' : 'bg-surface text-text-dim border-border-soft'}`}>
                          MONEY TRAIL MATCH
                        </span>
                        <span className={`px-2 py-0.5 rounded border ${s.multiSourceEvidence.hasCdrOverlap ? 'bg-success/10 text-success border-success/30' : 'bg-surface text-text-dim border-border-soft'}`}>
                          CDR TOWER OVERLAP
                        </span>
                        <span className={`px-2 py-0.5 rounded border ${s.multiSourceEvidence.hasCrossFirMatch ? 'bg-success/10 text-success border-success/30' : 'bg-surface text-text-dim border-border-soft'}`}>
                          CROSS-FIR MATCH
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial & Telecom Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                
                {/* Financial Agent Breakdown */}
                <div className="glass p-5 rounded-2xl border border-border-soft space-y-3">
                  <div className="flex items-center justify-between border-b border-border-soft pb-2">
                    <h4 className="font-bold text-brand flex items-center gap-1.5">
                      <CreditCard size={14} /> Money Trail Agent Findings
                    </h4>
                    <span className="text-[10px] text-text-dim">Total: {report.financialAgentResults.totalFlowAmountFormatted}</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-text-dim">Mule Accounts Detected:</span>
                      <span className="font-bold text-text">{report.financialAgentResults.muleAccountsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">Controller Hubs Identified:</span>
                      <span className="font-bold text-danger-bright">{report.financialAgentResults.controllersCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">Cash-out Exit Channels:</span>
                      <span className="font-bold text-text">{report.financialAgentResults.cashoutDestinations.join(', ')}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-surface-2 rounded-xl border border-brand/30 text-[10px] text-brand">
                    <strong>Enforcement Action:</strong> {report.financialAgentResults.recommendedFreezeAction}
                  </div>
                </div>

                {/* Telecom CDR Agent Breakdown */}
                <div className="glass p-5 rounded-2xl border border-border-soft space-y-3">
                  <div className="flex items-center justify-between border-b border-border-soft pb-2">
                    <h4 className="font-bold text-brand flex items-center gap-1.5">
                      <PhoneCall size={14} /> Telecom CDR Agent Findings
                    </h4>
                    <span className="text-[10px] text-text-dim">Calls: {report.telecomAgentResults.totalCallsAnalyzed}</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-text-dim">Primary Cell Tower:</span>
                      <span className="font-bold text-text">{report.telecomAgentResults.primaryTowerLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">Primary Handset IMEI:</span>
                      <span className="font-bold text-text">{report.telecomAgentResults.primaryImei}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">Nocturnal Call Bursts:</span>
                      <span className="font-bold text-warning">{report.telecomAgentResults.nocturnalBurstCallsCount} calls (22:00–04:00)</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Statutory BNSS Enforcement Actions */}
              <div className="glass p-5 rounded-2xl border border-border-soft space-y-3">
                <h4 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Scale size={14} className="text-brand" /> Recommended BNSS 2023 Statutory Enforcement Actions ({report.statutoryEnforcementActions.length})
                </h4>

                <div className="space-y-2 font-mono text-xs">
                  {report.statutoryEnforcementActions.map((act, idx) => (
                    <div key={idx} className="p-3 bg-surface-2 rounded-xl border border-border-soft flex items-center justify-between gap-3">
                      <div>
                        <span className="text-brand font-bold mr-2">[{act.law} {act.section}]</span>
                        <span className="text-text font-sans">{act.action}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/30 text-[9px] font-bold shrink-0">
                        {act.priority} PRIORITY
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex justify-between items-center font-mono">
                <button
                  onClick={handleStartAnalysis}
                  className="px-4 py-2 bg-surface-2 hover:bg-surface-hover text-text font-bold text-xs rounded-xl border border-border-soft transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw size={13} /> Re-run Agentic Analysis
                </button>

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-brand hover:bg-brand-bright text-bg font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Accept & Save Agentic Report
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
