import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, FileText, CheckCircle, AlertTriangle, Sparkles, Upload, FileUp, AlertCircle, RefreshCw, CheckCircle2, Shield, Scale, Info } from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { firAnalysisService, ProcessFirResponse } from '../services/firAnalysisService';
import { casesApi } from '../services/api';

export function RegisterFIR() {
  const { state, dispatch } = useMockState();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [narrative, setNarrative] = useState("On 2026-03-14 at 02:00 hrs, unknown culprits broke open the rear wooden door of House No. 45, Master Canteen, entered the residential premises, and stole gold jewellery worth Rs 3,50,000 and Rs 40,000 cash from the bedroom almirah. One of them dropped a mobile phone with number 9876543210.");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ProcessFirResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!narrative.trim() && !selectedFile) {
      alert("Please enter an FIR narrative or upload an FIR document file.");
      return;
    }

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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-brand/20 text-brand rounded-xl flex items-center justify-center border border-brand/40">
          <FileText size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text font-display">Register New FIR & Legal RAG Intake</h2>
          <p className="text-sm text-text-dim mt-1">Smart FIR intake powered by BNS/BNSS Statutory RAG & Legal Verification</p>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-border-soft bg-surface">
        {step === 1 && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-text-dim uppercase tracking-wider mb-2">
                FIR Incident Narrative (Text Input)
              </label>
              <textarea 
                rows={6}
                className="w-full bg-surface-2 border border-border-soft rounded-xl p-4 text-sm text-text focus:border-brand outline-none transition-colors font-sans leading-relaxed"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Enter raw FIR narrative, incident details, statement of informant..."
              />
            </div>

            {/* File Upload Option */}
            <div className="border-2 border-dashed border-border-soft/80 rounded-xl p-4 text-center bg-surface-2/50 space-y-2">
              <Upload className="mx-auto text-text-dim" size={24} />
              <div className="text-xs text-text font-semibold">Or upload FIR Document (.pdf or .txt)</div>
              <input 
                type="file" 
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileChange}
                className="text-xs text-text-dim cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
              />
              {selectedFile && (
                <div className="text-xs font-mono text-success font-bold mt-1">
                  Selected file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleAnalyze}
                className="bg-brand text-bg px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-brand-bright transition-colors flex items-center gap-2 uppercase tracking-wider shadow-sm"
              >
                <Sparkles size={16} /> Run Substantive BNS RAG Analysis
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 md:p-8 space-y-6">
            {isAnalyzing ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full animate-pulse" />
                  <Bot size={48} className="text-brand animate-bounce relative z-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text font-display uppercase tracking-wider">
                    Running BNS Statutory RAG Pipeline...
                  </h3>
                  <p className="text-xs font-mono text-text-dim mt-2">
                    Executing Query Expansion → Dual BGE-M3 + BM25 Hybrid Retrieval → CrossEncoder Reranking → Statutory Element Verification
                  </p>
                </div>
              </div>
            ) : analysisError ? (
              <div className="p-6 bg-danger/10 border border-danger/30 rounded-xl space-y-4 text-center">
                <AlertCircle size={40} className="text-danger-bright mx-auto" />
                <h3 className="text-base font-bold text-danger-bright uppercase font-mono">FIR RAG PIPELINE ERROR</h3>
                <p className="text-xs text-text-dim">{analysisError}</p>
                <button
                  onClick={() => setStep(1)}
                  className="bg-surface-2 border border-border-soft px-4 py-2 rounded-lg text-xs font-bold text-text hover:bg-surface-hover transition-colors"
                >
                  Return to Input
                </button>
              </div>
            ) : analysisResult ? (
              <div className="space-y-6 animate-slide-in">
                {/* Header Summary */}
                <div className="p-4 bg-brand/10 border border-brand/30 rounded-xl space-y-1 font-mono">
                  <div className="flex items-center justify-between text-xs font-bold text-brand">
                    <span className="uppercase">CRIME CATEGORY: {analysisResult.crime_category}</span>
                    <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded border border-success/30">
                      RAG VERIFIED ANALYSIS
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text font-sans mt-1">{analysisResult.crime_type}</h3>
                  <p className="text-xs text-text-dim leading-relaxed">{analysisResult.summary}</p>
                </div>

                {/* Real RAG BNS Provisions */}
                <div className="glass p-5 rounded-xl border border-brand/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-border-soft pb-2">
                    <h4 className="text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Scale size={15} /> Real Backend BNS Statutory Recommendations ({analysisResult.bns_sections.length})
                    </h4>
                    <span className="text-[9px] font-mono text-text-dim">Source: Multi-Law RAG Engine</span>
                  </div>

                  <div className="space-y-3">
                    {analysisResult.bns_sections.map((bns, idx) => (
                      <div key={idx} className="p-4 bg-surface-2 border border-border-soft rounded-xl text-xs space-y-2">
                        <div className="flex items-center justify-between font-mono font-bold">
                          <span className="text-brand text-sm">{bns.law} {bns.section}: {bns.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase border ${
                            bns.confidence === 'HIGH' ? 'bg-success/10 text-success border-success/30' :
                            bns.confidence === 'MEDIUM' ? 'bg-warning/10 text-warning border-warning/30' :
                            'bg-surface-2 text-text-dim border-border-soft'
                          }`}>
                            CONFIDENCE: {bns.confidence}
                          </span>
                        </div>
                        <p className="text-text-dim leading-relaxed">{bns.reason}</p>
                        
                        {bns.confidence_reason && (
                          <div className="text-[11px] font-mono text-text-bright bg-surface p-2 rounded border border-border-soft/60">
                            <strong>Statutory Verification:</strong> {bns.confidence_reason}
                          </div>
                        )}

                        {bns.supporting_fir_evidence && bns.supporting_fir_evidence.length > 0 && (
                          <div className="text-[10px] font-mono text-text-dim space-y-1">
                            <span className="font-bold uppercase text-text-faint">Supporting FIR Evidence:</span>
                            {bns.supporting_fir_evidence.map((ev, eidx) => (
                              <div key={eidx} className="flex items-center gap-1.5 pl-2">
                                <span className="w-1 h-1 bg-brand rounded-full" />
                                <span>{ev}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* BNSS Procedural Actions */}
                {analysisResult.bnss_procedural_actions.length > 0 && (
                  <div className="glass p-5 rounded-xl border border-border-soft space-y-3">
                    <h4 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2 font-mono">
                      BNSS Procedural Actions ({analysisResult.bnss_procedural_actions.length})
                    </h4>
                    <div className="space-y-2">
                      {analysisResult.bnss_procedural_actions.map((bnss, idx) => (
                        <div key={idx} className="p-3 bg-surface-2 border border-border-soft rounded-lg text-xs flex items-center justify-between font-mono">
                          <span className="font-bold text-accent-bright">{bnss.law} {bnss.section}</span>
                          <span className="text-text-dim text-right max-w-lg">{bnss.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prioritized Investigation Actions */}
                {analysisResult.investigation_actions.length > 0 && (
                  <div className="glass p-5 rounded-xl border border-border-soft space-y-3">
                    <h4 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2 font-mono">
                      Prioritized AI Investigation Strategy
                    </h4>
                    <div className="space-y-2">
                      {analysisResult.investigation_actions.slice(0, 3).map((act, idx) => (
                        <div key={idx} className="p-3 bg-surface-2 border border-border-soft rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-text">{act.action}</span>
                            <span className="text-[9px] font-mono bg-brand/10 text-brand px-2 py-0.5 rounded uppercase border border-brand/20">
                              {act.priority} PRIORITY
                            </span>
                          </div>
                          <p className="text-text-dim text-[11px]">{act.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex justify-between items-center pt-4 border-t border-border-soft">
                  <button
                    onClick={() => setStep(1)}
                    className="bg-surface-2 border border-border-soft px-4 py-2 rounded-lg text-xs font-bold text-text-dim hover:text-text transition-colors font-mono"
                  >
                    ← Edit Narrative
                  </button>

                  <button 
                    onClick={handleCreateCase}
                    className="bg-accent text-bg px-6 py-2.5 rounded-lg font-bold text-xs hover:bg-accent-bright transition-colors flex items-center gap-2 uppercase tracking-wider shadow-sm font-mono"
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
