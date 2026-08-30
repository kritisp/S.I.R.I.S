import React, { useState } from 'react';
import { Upload, FileText, Bot, AlertTriangle } from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { intelligenceService } from '../mockServices/intelligenceService';
import { evidenceApi } from '../services/api';

export function EvidenceVault() {
  const { state, dispatch } = useMockState();
  
  const [selectedCase, setSelectedCase] = useState('');
  const [evidenceText, setEvidenceText] = useState("Found a parking receipt near the crime scene. The vehicle registration was OD-02-AB-1234.");
  const [isProcessing, setIsProcessing] = useState(false);

  const myCases = state.cases.filter(c => c.investigatorId === state.currentUser?.id);

  const handleUpload = async () => {
    if (!selectedCase) return alert("Select a case first");

    setIsProcessing(true);
    dispatch({ type: 'SET_PROCESSING', payload: true });

    try {
      // 1. Process evidence via mock AI
      const result = await intelligenceService.processEvidence(evidenceText);
      
      // 2. Save Evidence via backend API
      let createdEv: any = null;
      try {
        createdEv = await evidenceApi.addEvidence({
          caseId: selectedCase,
          description: evidenceText,
          type: 'DOCUMENT',
          entitiesExtracted: result.entitiesExtracted,
        });
      } catch (err) {
        console.warn('Evidence API notice:', err);
      }

      const newEvidence = createdEv || {
        id: `EV-${Date.now()}`,
        caseId: selectedCase,
        description: evidenceText,
        type: 'DOCUMENT',
        uploadedAt: new Date().toISOString(),
        entitiesExtracted: result.entitiesExtracted
      };
      
      dispatch({ type: 'ADD_EVIDENCE', payload: newEvidence });
      
      // 3. Update the Case with new entities
      const caseToUpdate = state.cases.find(c => c.id === selectedCase);
      if (caseToUpdate) {
        const updatedCase = {
          ...caseToUpdate,
          entities: [...caseToUpdate.entities, ...result.entitiesExtracted]
        };
        dispatch({ type: 'UPDATE_CASE', payload: updatedCase });

        // 4. Trigger Cross-Station Scan with new entities
        const scanResult = await intelligenceService.scanCrossStationRelationships(
          result.entitiesExtracted,
          caseToUpdate.stationId,
          state.cases
        );

        if (scanResult.matchFound) {
          dispatch({
            type: 'ADD_ALERT',
            payload: {
              id: `ALT-${Date.now()}`,
              type: 'CROSS_STATION_MATCH',
              message: `New intelligence discovered from evidence. Relationship detected with Case ${scanResult.targetCaseId}. ${scanResult.reason}`,
              relatedCaseId: updatedCase.id,
              targetCaseId: scanResult.targetCaseId,
              targetStationId: scanResult.targetStationId,
              isRead: false,
              createdAt: new Date().toISOString()
            }
          });
        }
      }
      
      setEvidenceText('');
    } finally {
      setIsProcessing(false);
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-text font-display flex items-center gap-2">
          <FileText className="text-accent" /> Evidence Vault
        </h2>
        <p className="text-sm text-text-dim mt-1">Upload unstructured evidence for AI extraction and intelligence mapping.</p>
      </div>

      <div className="glass p-6 rounded-2xl space-y-6">
        <div>
          <label className="block text-xs font-bold text-text-dim uppercase tracking-wider mb-2">Target Case</label>
          <select 
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="w-full bg-surface border border-border-soft rounded-xl p-3 text-sm text-text focus:border-accent-bright outline-none"
          >
            <option value="">-- Select Case --</option>
            {myCases.map(c => (
              <option key={c.id} value={c.id}>{c.firNumber} - {c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-dim uppercase tracking-wider mb-2">Evidence Content / Transcription</label>
          <textarea 
            rows={5}
            className="w-full bg-surface border border-border-soft rounded-xl p-4 text-sm text-text focus:border-accent-bright outline-none"
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            placeholder="Describe the evidence or paste document text..."
          />
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleUpload}
            disabled={isProcessing || !selectedCase || !evidenceText}
            className="bg-accent text-bg px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-accent-bright disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isProcessing ? <Bot className="animate-spin" size={16} /> : <Upload size={16} />}
            Process Evidence
          </button>
        </div>
      </div>

      <div className="bg-surface-2 p-4 rounded-xl border border-border flex items-start gap-3">
        <AlertTriangle className="text-brand shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-text-dim leading-relaxed">
          <strong>How this works:</strong> Uploading evidence triggers the background intelligence engine. Entities (like phone numbers or vehicle plates) are extracted and appended to the case knowledge graph. A cross-station similarity scan runs automatically. If an overlap is found, a global alert will appear.
        </p>
      </div>
    </div>
  );
}
