import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, FileText, CheckCircle, AlertTriangle, Sparkles, Upload, FileUp, AlertCircle, RefreshCw, CheckCircle2, Shield, Scale, Info, Mic, Square, Languages, Volume2 } from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { firAnalysisService, ProcessFirResponse } from '../services/firAnalysisService';
import { casesApi } from '../services/api';
import { AudioRecorder } from '../utils/audioRecorder';
import { bhasiniTranslationService, SupportedLanguage } from '../services/bhasiniTranslationService';

const QUICK_SCENARIOS = [
  {
    title: "Night Burglary (BNS 305/331)",
    icon: "🏠",
    text: "On the night of 14.08.2026, unknown intruders broke the rear latch of residence at Plot 412, Khandagiri, Bhubaneswar, and stole 40 grams of gold jewelry and Rs 85,000 cash while family was away."
  },
  {
    title: "Cyber UPI Scam (BNS 318(4))",
    icon: "💳",
    text: "On 22.08.2026, complainant received a fraudulent call from +91-9876543210 posing as bank manager, sent a malicious APK link, and unauthorizedly debited Rs 1,50,000 via UPI to an unknown beneficiary account."
  },
  {
    title: "Armed Robbery (BNS 309)",
    icon: "🏍️",
    text: "On 01.09.2026 near Saheed Nagar flyover, two masked men on motorcycle OD-02-AK-4455 brandished a sharp knife, physically threatened complainant, and snatched a mobile phone and wallet containing Rs 12,000."
  },
  {
    title: "Assault & Hurt (BNS 115/117)",
    icon: "⚔️",
    text: "On 28.08.2026 at Rasulgarh square, an altercation occurred where accused Ramesh struck the victim with an iron rod causing severe fracture on left arm and bleeding head injury."
  }
];

export function RegisterFIR() {
  const { state, dispatch } = useMockState();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [narrative, setNarrative] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ProcessFirResponse | null>(null);

  // Auto-fill FIR narrative if passed from AI Assistant draft
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlNarrative = params.get('narrative');
      if (urlNarrative && urlNarrative.trim()) {
        setNarrative(urlNarrative.trim());
      }
    }
  }, []);

  // Bhasini ASR Speech-to-Text State
  const [asrLang, setAsrLang] = useState<SupportedLanguage>('hi');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recorder] = useState(() => new AudioRecorder());

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsTranscribing(true);
      try {
        const audioBase64 = await recorder.stop();
        const res = await bhasiniTranslationService.speechToText(audioBase64, asrLang);
        if (res.transcribedText) {
          setNarrative(prev => prev ? `${prev}\n${res.transcribedText}` : res.transcribedText);
        }
      } catch (err) {
        console.error('Bhasini ASR error:', err);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      try {
        await recorder.start();
        setIsRecording(true);
      } catch (err) {
        alert('Microphone access permission required for Bhasini Indian Language voice dictation.');
        console.error('Microphone error:', err);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setValidationWarning(null);
    }
  };

  const handleAnalyze = async () => {
    const trimmed = narrative.trim();
    if (!selectedFile && trimmed.length < 15) {
      setValidationWarning("⚠️ Statement is too brief or unreadable. Please enter descriptive incident particulars (what happened, date, location, loss) or choose a preset below.");
      return;
    }
    setValidationWarning(null);

    setIsAnalyzing(true);
    setAnalysisError(null);
    setStep(2);

    try {
      // Call Real Backend FIR/BNS RAG Pipeline
      const result = await firAnalysisService.processFIR(narrative, selectedFile || undefined);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error("FIR RAG Pipeline Analysis error:", err);
      setAnalysisError(err.message || "Failed to execute backend FIR/BNS RAG pipeline.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateCase = async () => {
    if (!state.currentUser) return;
    
    let createdCase: any = null;
    const firNum = analysisResult?.fir_metadata?.fir_number || `FIR-KHD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const crimeTitle = analysisResult?.crime_type ? `${analysisResult.crime_type} Incident Report` : 'FIR Incident Report';
    
    // Map RAG extracted entities to case record format
    const caseEntities: any[] = [];
    if (analysisResult?.entities?.phones) {
      analysisResult.entities.phones.forEach(p => caseEntities.push({ id: `ENT-${Date.now()}`, type: 'PHONE', value: p.number }));
    }
    if (analysisResult?.entities?.vehicles) {
      analysisResult.entities.vehicles.forEach(v => caseEntities.push({ id: `ENT-${Date.now()}`, type: 'VEHICLE', value: v.registration_number }));
    }

    try {
      createdCase = await casesApi.createCase({
        firNumber: firNum,
        stationId: state.currentUser.stationId || 'OP-BBSR-CAP',
        investigatorId: state.currentUser.id,
        title: crimeTitle,
        description: narrative,
        crimeType: analysisResult?.crime_type || 'General Offence',
        status: 'INVESTIGATING',
        priority: 'HIGH',
        entities: caseEntities,
      });
    } catch (err) {
      console.warn('Backend FIR persistence warning:', err);
    }

    const newCaseId = createdCase?.id || `CR-KHD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCase = createdCase || {
      id: newCaseId,
      firNumber: firNum,
      stationId: state.currentUser.stationId || 'OP-BBSR-CAP',
      investigatorId: state.currentUser.id,
      title: crimeTitle,
      description: narrative,
      crimeType: analysisResult?.crime_type || 'General Offence',
      status: 'INVESTIGATING' as const,
      priority: 'HIGH' as const,
      createdAt: new Date().toISOString(),
      entities: caseEntities,
    };

    dispatch({ type: 'ADD_CASE', payload: newCase });
    
    // Transition to the unique Case Workspace
    navigate(`/workspace/case/${newCase.id}`);
  };

  return (
    <div className="max-w-[1520px] mx-auto space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      {/* ── 1. COMMAND HEADER & STATUTORY RAG HUB ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-text dark:text-[#F8FAFC] uppercase">
                  REGISTER NEW FIR & LEGAL RAG INTAKE
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-accent/15 dark:bg-[#38BDF8]/15 border border-accent/30 dark:border-[#38BDF8]/30 text-accent dark:text-[#38BDF8]">
                  BNS / BNSS STATUTORY ENGINE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  BHASINI ASR ACTIVE
                </span>
              </div>
              <p className="text-xs text-text-dim dark:text-[#94A3B8] font-mono mt-0.5">
                Smart FIR intake powered by BNS/BNSS Statutory RAG, Dual BGE-M3 + BM25 Hybrid Retrieval & CrossEncoder
              </p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-bold ${
              step === 1 
                ? 'bg-accent/15 dark:bg-[#38BDF8]/15 border-accent dark:border-[#38BDF8] text-accent dark:text-[#38BDF8]' 
                : 'bg-surface-2 dark:bg-[#0E1422] border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8]'
            }`}>
              <span>1. STATEMENT INTAKE</span>
            </div>
            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-bold ${
              step === 2 
                ? 'bg-accent/15 dark:bg-[#38BDF8]/15 border-accent dark:border-[#38BDF8] text-accent dark:text-[#38BDF8]' 
                : 'bg-surface-2 dark:bg-[#0E1422] border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8]'
            }`}>
              <span>2. STATUTORY RAG REVIEW</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. MAIN WORKSPACE CONTAINER ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl overflow-hidden shadow-xs dark:shadow-xl">
        {step === 1 && (
          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="text-[11px] font-bold text-text-dim dark:text-[#94A3B8] uppercase font-mono tracking-wider">
                  FIR Incident Narrative (Text & Voice Input)
                </label>
                
                {/* Bhasini Voice Dictation Control Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={asrLang}
                    onChange={(e) => setAsrLang(e.target.value as SupportedLanguage)}
                    className="bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] rounded-lg px-2.5 py-1 text-[11px] font-mono text-text dark:text-[#F8FAFC] outline-none cursor-pointer"
                  >
                    <option value="hi">🇮🇳 हिन्दी (Hindi Voice)</option>
                    <option value="or">🏛️ ଓଡ଼ିଆ (Odia Voice)</option>
                    <option value="bn">🐯 বাংলা (Bengali Voice)</option>
                    <option value="mr">🚩 मराठी (Marathi Voice)</option>
                    <option value="en">🇬🇧 English Voice</option>
                  </select>

                  <button
                    type="button"
                    onClick={toggleRecording}
                    disabled={isTranscribing}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      isRecording ? 'bg-rose-600 text-white animate-pulse' :
                      isTranscribing ? 'bg-accent/20 dark:bg-[#38BDF8]/20 text-accent dark:text-[#38BDF8]' :
                      'bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover border border-accent/40 dark:border-[#38BDF8]/40 text-accent dark:text-[#38BDF8]'
                    }`}
                  >
                    {isRecording ? <Square size={13} /> : <Mic size={13} />}
                    <span>{isRecording ? 'STOP RECORDING' : isTranscribing ? 'TRANSCRIBING...' : 'VOICE DICTATION (BHASINI ASR)'}</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Quick Scenario Presets */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {QUICK_SCENARIOS.map((sc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setNarrative(sc.text); setValidationWarning(null); }}
                    className="p-2.5 bg-surface-2 dark:bg-[#0E1422] hover:border-accent/50 dark:hover:border-[#38BDF8]/50 border border-border-soft dark:border-[#1E293B] rounded-xl text-left transition-all group shadow-xs cursor-pointer"
                  >
                    <div className="text-xs font-bold text-text dark:text-[#F8FAFC] group-hover:text-accent dark:group-hover:text-[#38BDF8] flex items-center gap-1.5 font-mono">
                      <span>{sc.icon}</span>
                      <span className="truncate">{sc.title}</span>
                    </div>
                  </button>
                ))}
              </div>

              {validationWarning && (
                <div className="p-3 mb-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-400 font-mono flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{validationWarning}</span>
                </div>
              )}

              <textarea 
                rows={6}
                className="w-full bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 text-xs sm:text-sm text-text dark:text-[#F8FAFC] focus:border-accent dark:focus:border-[#38BDF8] outline-none transition-colors font-mono leading-relaxed"
                value={narrative}
                onChange={(e) => { setNarrative(e.target.value); if (validationWarning) setValidationWarning(null); }}
                placeholder="Enter raw FIR narrative, incident details, statement of informant... (or click a test scenario preset above)"
              />
            </div>

            {/* File Upload Option */}
            <div className="border border-dashed border-border-soft dark:border-[#1E293B] rounded-xl p-4 text-center bg-surface-2/50 dark:bg-[#0E1422]/50 space-y-2">
              <Upload className="mx-auto text-text-dim dark:text-[#94A3B8]" size={22} />
              <div className="text-xs text-text dark:text-[#F8FAFC] font-semibold font-mono">Or upload FIR Document (.pdf or .txt)</div>
              <input 
                type="file" 
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileChange}
                className="text-xs text-text-dim dark:text-[#94A3B8] cursor-pointer file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-mono file:font-bold file:bg-surface dark:file:bg-[#0B0F17] file:text-accent dark:file:text-[#38BDF8] hover:file:bg-surface-2"
              />
              {selectedFile && (
                <div className="text-xs font-mono text-emerald-400 font-bold mt-1">
                  Selected file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleAnalyze}
                className="bg-accent text-bg hover:bg-accent-bright dark:bg-[#38BDF8] dark:text-[#070A0F] dark:hover:bg-[#0284C7] px-6 py-2.5 rounded-lg font-mono font-bold text-xs transition-colors flex items-center gap-2 uppercase tracking-wider shadow-xs cursor-pointer"
              >
                <Sparkles size={15} /> Run Substantive BNS RAG Analysis
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-4 sm:p-6 space-y-4">
            {isAnalyzing ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/20 dark:bg-[#38BDF8]/20 blur-xl rounded-full animate-pulse" />
                  <Bot size={44} className="text-accent dark:text-[#38BDF8] animate-bounce relative z-10" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider">
                    Running BNS Statutory RAG Pipeline...
                  </h3>
                  <p className="text-xs font-mono text-text-dim dark:text-[#94A3B8] mt-1.5 max-w-lg">
                    Executing Query Expansion → Dual BGE-M3 + BM25 Hybrid Retrieval → CrossEncoder Reranking → Statutory Element Verification
                  </p>
                </div>
              </div>
            ) : analysisError ? (
              <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-3 text-center font-mono">
                <AlertCircle size={36} className="text-rose-400 mx-auto" />
                <h3 className="text-sm font-bold text-rose-400 uppercase">FIR RAG PIPELINE ERROR</h3>
                <p className="text-xs text-text-dim dark:text-[#94A3B8]">{analysisError}</p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] px-4 py-2 rounded-lg text-xs font-bold text-text dark:text-[#F8FAFC] hover:bg-surface-hover transition-colors"
                  >
                    Return to Input
                  </button>
                  <button
                    onClick={handleAnalyze}
                    className="bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#070A0F] px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent-bright transition-colors"
                  >
                    Retry Analysis
                  </button>
                </div>
              </div>
            ) : analysisResult ? (
              <div className="space-y-4">
                {/* Header Summary */}
                <div className="p-3.5 bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] rounded-xl space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-xs font-bold text-accent dark:text-[#38BDF8]">
                    <span className="uppercase">CRIME CATEGORY: {analysisResult.crime_category}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      analysisResult.execution_metadata?.source === 'statutory_engine_fallback'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {analysisResult.execution_metadata?.source === 'statutory_engine_fallback'
                        ? 'STATUTORY ENGINE INTAKE'
                        : 'RAG VERIFIED ANALYSIS'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-text dark:text-[#F8FAFC] font-mono mt-1">{analysisResult.crime_type}</h3>
                  <p className="text-xs text-text-dim dark:text-[#94A3B8] leading-relaxed">{analysisResult.summary}</p>
                </div>

                {analysisResult.execution_metadata?.source === 'statutory_engine_fallback' && (
                  <div className="p-2.5 bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] rounded-lg text-xs font-mono text-text-dim dark:text-[#94A3B8] flex items-center justify-between">
                    <span>⚡ Formulated via S.I.R.I.S BNS Statutory Intelligence Engine (Offline Hybrid Cache).</span>
                  </div>
                )}

                {/* Statutory Provisions or Preliminary Inquiry Mandate */}
                {analysisResult.bns_sections.length === 0 ? (
                  <div className="p-4 sm:p-5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3 font-mono">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
                      <AlertTriangle size={18} />
                      <span className="uppercase">INSUFFICIENT FACTUAL AVERMENTS — BNSS SECTION 173(3) MANDATE</span>
                    </div>
                    <p className="text-xs text-text-dim dark:text-[#94A3B8] leading-relaxed">
                      {analysisResult.summary}
                    </p>

                    {analysisResult.missing_information && analysisResult.missing_information.length > 0 && (
                      <div className="p-3 bg-surface-2 dark:bg-[#0E1422] rounded-lg border border-border-soft dark:border-[#1E293B] space-y-1.5">
                        <div className="text-xs font-bold text-accent dark:text-[#38BDF8] uppercase">
                          Particulars Required from Informant to Frame Charges:
                        </div>
                        <ul className="text-xs text-text-dim dark:text-[#94A3B8] space-y-1 list-disc list-inside">
                          {analysisResult.missing_information.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[11px] text-text-dim dark:text-[#94A3B8]">
                        Substantive charges withheld in compliance with BNSS 173(3) preliminary verification rule.
                      </span>
                      <button
                        onClick={() => setStep(1)}
                        className="bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#070A0F] px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent-bright transition-colors"
                      >
                        ← Return & Choose Scenario Preset
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Real RAG BNS Provisions */
                  <div className="bg-surface-2 dark:bg-[#0E1422] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-3">
                    <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2">
                      <h4 className="text-xs font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Scale size={14} /> BNS Statutory Recommendations ({analysisResult.bns_sections.length})
                      </h4>
                      <span className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">
                        {analysisResult.execution_metadata?.source === 'statutory_engine_fallback'
                          ? 'Source: S.I.R.I.S Statutory Corpus'
                          : 'Source: Multi-Law RAG Engine'}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {analysisResult.bns_sections.map((bns, idx) => (
                        <div key={idx} className="p-3 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-lg text-xs space-y-1.5">
                          <div className="flex items-center justify-between font-mono font-bold">
                            <span className="text-accent dark:text-[#38BDF8] text-xs sm:text-sm">{bns.law} {bns.section}: {bns.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase border ${
                              bns.confidence === 'HIGH' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              bns.confidence === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                              'bg-surface-2 text-text-dim border-border-soft'
                            }`}>
                              CONFIDENCE: {bns.confidence}
                            </span>
                          </div>
                          <p className="text-text-dim dark:text-[#94A3B8] leading-relaxed text-xs">{bns.reason}</p>
                          
                          {bns.confidence_reason && (
                            <div className="text-[10px] font-mono text-text dark:text-[#F8FAFC] bg-surface-2 dark:bg-[#0E1422] p-2 rounded border border-border-soft dark:border-[#1E293B]">
                              <strong className="text-accent dark:text-[#38BDF8]">Statutory Verification:</strong> {bns.confidence_reason}
                            </div>
                          )}

                          {bns.supporting_fir_evidence && bns.supporting_fir_evidence.length > 0 && (
                            <div className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8] space-y-0.5 pt-1">
                              <span className="font-bold uppercase text-text dark:text-[#F8FAFC]">Supporting FIR Evidence:</span>
                              {bns.supporting_fir_evidence.map((ev, eidx) => (
                                <div key={eidx} className="flex items-center gap-1.5 pl-2">
                                  <span className="w-1 h-1 bg-accent dark:bg-[#38BDF8] rounded-full" />
                                  <span>{ev}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BNSS Procedural Actions */}
                {analysisResult.bnss_procedural_actions.length > 0 && (
                  <div className="bg-surface-2 dark:bg-[#0E1422] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-2.5">
                    <h4 className="text-xs font-bold text-text dark:text-[#F8FAFC] uppercase tracking-wider border-b border-border-soft dark:border-[#1E293B] pb-2 font-mono">
                      BNSS Procedural Actions ({analysisResult.bnss_procedural_actions.length})
                    </h4>
                    <div className="space-y-2">
                      {analysisResult.bnss_procedural_actions.map((bnss, idx) => (
                        <div key={idx} className="p-2.5 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-lg text-xs flex items-center justify-between font-mono">
                          <span className="font-bold text-accent dark:text-[#38BDF8]">{bnss.law} {bnss.section}</span>
                          <span className="text-text-dim dark:text-[#94A3B8] text-right max-w-lg">{bnss.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prioritized Investigation Actions */}
                {analysisResult.investigation_actions.length > 0 && (
                  <div className="bg-surface-2 dark:bg-[#0E1422] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-2.5">
                    <h4 className="text-xs font-bold text-text dark:text-[#F8FAFC] uppercase tracking-wider border-b border-border-soft dark:border-[#1E293B] pb-2 font-mono">
                      Prioritized AI Investigation Strategy
                    </h4>
                    <div className="space-y-2">
                      {analysisResult.investigation_actions.slice(0, 3).map((act, idx) => (
                        <div key={idx} className="p-2.5 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-lg text-xs space-y-1 font-mono">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-text dark:text-[#F8FAFC]">{act.action}</span>
                            <span className="text-[9px] bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] px-2 py-0.5 rounded uppercase border border-accent/20 dark:border-[#38BDF8]/20">
                              {act.priority} PRIORITY
                            </span>
                          </div>
                          <p className="text-text-dim dark:text-[#94A3B8] text-[11px]">{act.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex justify-between items-center pt-3 border-t border-border-soft dark:border-[#1E293B]">
                  <button
                    onClick={() => setStep(1)}
                    className="bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] px-4 py-2 rounded-lg text-xs font-bold text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] transition-colors font-mono cursor-pointer"
                  >
                    ← Edit Narrative
                  </button>

                  <button 
                    onClick={handleCreateCase}
                    className="bg-accent text-bg hover:bg-accent-bright dark:bg-[#38BDF8] dark:text-[#070A0F] dark:hover:bg-[#0284C7] px-6 py-2.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-2 uppercase tracking-wider shadow-xs font-mono cursor-pointer"
                  >
                    Confirm Analysis & Create Case Workspace →
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
