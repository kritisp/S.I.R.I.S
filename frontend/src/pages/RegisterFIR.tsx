import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, FileText, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { intelligenceService } from '../mockServices/intelligenceService';
import { FIR_ANALYSIS_PROVISIONS } from '../mockServices/legalProvisionMockData';
import { LegalProvisionList } from '../components/legal/LegalProvisionList';
import { casesApi } from '../services/api';

export function RegisterFIR() {
  const { state, dispatch } = useMockState();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [narrative, setNarrative] = useState("On 2025-11-15, my jewelry store on 100ft road was robbed by two men. They stole 500g of gold and fled in a white van. One of them dropped a phone with number 9876543210.");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setStep(2);
    try {
      const result = await intelligenceService.analyzeFIR(narrative);
      setAnalysisResult(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateCase = async () => {
    if (!state.currentUser) return;
    
    let createdCase: any = null;
    try {
      const firNum = `FIR-KHD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      createdCase = await casesApi.createCase({
        firNumber: firNum,
        stationId: state.currentUser.stationId || 'OP-BBSR-CAP',
        investigatorId: state.currentUser.id,
        title: analysisResult?.crimeClassification || 'FIR Incident Report',
        description: narrative,
        crimeType: analysisResult?.crimeClassification || 'General Offence',
        status: 'INVESTIGATING',
        priority: 'HIGH',
        entities: analysisResult?.extractedEntities || [],
      });
    } catch (err) {
      console.warn('Backend FIR persistence warning:', err);
    }

    const newCase = createdCase || {
      id: `CR-KHD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      firNumber: `FIR-KHD-2026-004821`,
      stationId: state.currentUser.stationId || 'OP-BBSR-CAP',
      investigatorId: state.currentUser.id,
      title: analysisResult?.crimeClassification || 'Incident Report',
      description: narrative,
      crimeType: analysisResult?.crimeClassification || 'General Offence',
      status: 'INVESTIGATING' as const,
      priority: 'HIGH' as const,
      createdAt: new Date().toISOString(),
      entities: analysisResult?.extractedEntities || [],
    };

    dispatch({ type: 'ADD_CASE', payload: newCase });
    
    // Trigger background intelligence scan for the hero demo
    dispatch({ type: 'SET_PROCESSING', payload: true });
    
    // Simulate async background job
    setTimeout(async () => {
      const scanResult = await intelligenceService.scanCrossStationRelationships(
        newCase.entities || [],
        newCase.stationId,
        state.cases
      );
      
      if (scanResult.matchFound) {
        dispatch({
          type: 'ADD_ALERT',
          payload: {
            id: `ALT-${Date.now()}`,
            type: 'CROSS_STATION_MATCH',
            message: `Cross-station relationship detected with Case ${scanResult.targetCaseId}. Confidence: ${scanResult.confidence}%. ${scanResult.reason}`,
            relatedCaseId: newCase.id,
            targetCaseId: scanResult.targetCaseId,
            targetStationId: scanResult.targetStationId,
            isRead: false,
            createdAt: new Date().toISOString()
          }
        });
      }
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }, 2000);

    navigate(`/cases/${newCase.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-brand/20 text-brand rounded-xl flex items-center justify-center border border-brand/40">
          <FileText size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text font-display">Register New FIR</h2>
          <p className="text-sm text-text-dim mt-1">Smart intake with AI intelligence extraction</p>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {step === 1 && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-text-dim uppercase tracking-wider mb-2">Incident Narrative</label>
              <textarea 
                rows={6}
                className="w-full bg-surface border border-border-soft rounded-xl p-4 text-sm text-text focus:border-accent-bright outline-none transition-colors"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Enter unstructured FIR narrative..."
              />
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleAnalyze}
                className="bg-brand text-bg px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-brand-bright transition-colors flex items-center gap-2"
              >
                <Sparkles size={16} /> Run AI Analysis
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            {isAnalyzing ? (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full animate-pulse" />
                  <Bot size={48} className="text-accent-bright animate-bounce relative z-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text font-display">Extracting Intelligence...</h3>
                  <p className="text-sm text-text-dim mt-2">Running NER, classifying crime, mapping legal provisions.</p>
                </div>
              </>
            ) : (
              <div className="w-full text-left space-y-6 animate-slide-in">
                <div className="border-l-2 border-brand pl-4">
                  <p className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1">Crime Classification</p>
                  <p className="text-lg font-bold text-text">{analysisResult?.crimeClassification}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass p-4 rounded-xl">
                    <p className="text-xs font-bold text-accent-bright uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Sparkles size={14} /> Extracted Entities
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult?.extractedEntities.map((e: any, i: number) => (
                        <span key={i} className="bg-surface-hover border border-border px-2 py-1 rounded text-xs font-mono">
                          {e.type}: <span className="text-text">{e.value}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="glass p-4 rounded-xl border-brand/30 col-span-2">
                    <p className="text-xs font-bold text-brand uppercase tracking-wider mb-4 flex items-center gap-2">
                      <AlertTriangle size={14} /> Legal Intelligence (BNS)
                    </p>
                    <LegalProvisionList
                      provisions={FIR_ANALYSIS_PROVISIONS}
                      title="Applicable Provisions"
                      showDisclaimer={false}
                      compact={false}
                    />
                  </div>
                </div>

                <div className="glass p-4 rounded-xl bg-surface-hover">
                  <p className="text-xs font-bold text-text-dim uppercase tracking-wider mb-3">AI Recommended Actions</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {analysisResult?.recommendedActions.map((a: string, i: number) => (
                      <li key={i} className="text-sm text-text">{a}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-text-faint mt-4 italic uppercase">AI-GENERATED RECOMMENDATION - OFFICER VERIFICATION REQUIRED</p>
                </div>

                <div className="flex justify-end pt-4 border-t border-border-soft">
                  <button 
                    onClick={handleCreateCase}
                    className="bg-accent text-bg px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-accent-bright transition-colors flex items-center gap-2"
                  >
                    Confirm & Create Case Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
