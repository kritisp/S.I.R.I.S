import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMockState } from '../mockServices/MockStateContext';
import { CaseKnowledgeGraph } from '../components/graph/CaseKnowledgeGraph';
import { Shield, FileText, Share2, AlertTriangle, FileBarChart, Scale, Bot, Lock, CheckCircle, Clock, Network, AlertCircle, ChevronRight, HelpCircle, Eye, Car, Navigation, Sparkles } from 'lucide-react';

import { HERO_CASE_PROVISIONS, ROBBERY_CASE_PROVISIONS, FIR_ANALYSIS_PROVISIONS } from '../mockServices/legalProvisionMockData';
import { LegalProvisionList } from '../components/legal/LegalProvisionList';
import { requestsApi, generateFirDraft } from '../services/api';
import { VehicleIntelligenceModal } from '../components/intelligence/VehicleIntelligenceModal';
import { VehicleGeoTrailModal } from '../components/intelligence/VehicleGeoTrailModal';
import { InvestigationActionQueue } from '../components/intelligence/InvestigationActionQueue';
import { RiskIntelligenceCard } from '../components/intelligence/RiskIntelligenceCard';
import { ExplainableLeadCard } from '../components/intelligence/ExplainableLeadCard';
import { explainableIntelStore } from '../services/explainableIntelService';



export function CaseWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useMockState();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'legal' | 'reports'>('overview');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'overview' || tabParam === 'graph' || tabParam === 'legal' || tabParam === 'reports') {
      setActiveTab(tabParam);
    }
  }, [location.search]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftGenerated, setDraftGenerated] = useState(false);

  // DRISHTI Phase 1 Modal States
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showTrailModal, setShowTrailModal] = useState(false);
  const [selectedPlate, setSelectedPlate] = useState("OD-02-AB-1234");

  // Similar cases modals / states
  const [showSimilarityModal, setShowSimilarityModal] = useState(false);
  const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);
  const [justificationText, setJustificationText] = useState("S.I.R.I.S detected a 94% relationship based on shared entity and crime signature. Access requested for investigation correlation.");


  const currentCase = state.cases.find(c => c.id === id);

  if (!currentCase) {
    return <div className="p-8 text-danger-bright font-bold font-mono">Case not found.</div>;
  }

  // Pick provisions based on crime type
  const caseProvisions =
    currentCase.id === 'OD-BBSR-2026-0001' || currentCase.id === 'CR-KHD-2026-004821' ? HERO_CASE_PROVISIONS
    : currentCase.crimeType?.toLowerCase().includes('robbery') || currentCase.crimeType?.toLowerCase().includes('heist')
      ? ROBBERY_CASE_PROVISIONS
      : FIR_ANALYSIS_PROVISIONS;

  const isHeroCase = currentCase.id === 'CR-KHD-2026-004821';
  
  // Check access request status for cross-station case OD-CTC-2026-00981
  const crossStationRequest = state.accessRequests.find(
    r => r.targetCaseId === 'OD-CTC-2026-00981' && r.requestingStationId === (state.currentUser?.stationId || 'OP-BBSR-CAP')
  );
  
  const hasAccessToCrossStation = crossStationRequest?.status === 'APPROVED';

  const tabClass = (tab: string, color = 'accent') =>
    `px-5 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
      activeTab === tab
        ? `border-${color}-bright text-${color}-bright`
        : 'border-transparent text-text-dim hover:text-text'
    }`;

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    try {
      await generateFirDraft(`Generate FIR draft report for ${currentCase.firNumber}: ${currentCase.description}`, 'en');
    } catch (err) {
      console.warn('Draft API notice:', err);
    } finally {
      setIsGenerating(false);
      setDraftGenerated(true);
    }
  };

  const handleSendAccessRequest = async () => {
    let newReq: any = null;
    try {
      newReq = await requestsApi.createRequest('OD-CTC-2026-00981', justificationText);
    } catch (err) {
      console.warn('Access request API notice:', err);
    }

    const requestPayload = newReq || {
      id: `REQ-${Date.now()}`,
      requestingStationId: state.currentUser?.stationId || 'OP-BBSR-CAP',
      requestingOfficerId: state.currentUser?.id || 'INV-BBSR-001',
      targetStationId: 'OP-CTC-CITY',
      targetCaseId: 'OD-CTC-2026-00981',
      reason: justificationText,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_ACCESS_REQUEST', payload: requestPayload });
    
    // Create notifications/logs
    dispatch({
      type: 'ADD_ALERT',
      payload: {
        id: `ALT-${Date.now()}`,
        type: 'CROSS_STATION_MATCH',
        message: `Outgoing access request created for Cuttack case OD-CTC-2026-00981 by Insp. Vikram.`,
        relatedCaseId: currentCase.id,
        targetCaseId: 'OD-CTC-2026-00981',
        targetStationId: 'OP-CTC-CITY',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    });

    setShowRequestAccessModal(false);
    alert('Access request submitted successfully. Outgoing Requests updated.');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="glass p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border-soft">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono bg-surface-2 border border-border-soft px-2 py-0.5 rounded text-text-dim">
              {currentCase.firNumber}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent-bright px-2 py-0.5 rounded border border-accent/30">
              {currentCase.status}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-danger/20 text-danger-bright px-2 py-0.5 rounded border border-danger/30">
              PRIORITY: {currentCase.priority}
            </span>
            {isHeroCase && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-brand/20 text-brand px-2 py-0.5 rounded border border-brand/30 animate-pulse">
                S.I.R.I.S Linkage Detected
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-text font-display">{currentCase.title}</h1>
          <p className="text-sm text-text-dim mt-1">
            Station: Khandagiri Police Station (KHD-KND-014) · Khordha District · Created: {new Date(currentCase.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button className="bg-surface-2 border border-border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-surface-hover text-text flex items-center gap-2 transition-colors">
            <Share2 size={16} /> Share
          </button>
          <button className="bg-brand text-bg px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-bright flex items-center gap-2 transition-colors">
            <AlertTriangle size={16} /> Mark Critical
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-soft overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
          Overview & Timeline
        </button>
        <button onClick={() => setActiveTab('graph')} className={tabClass('graph', 'brand')}>
          Knowledge Graph
        </button>
        <button onClick={() => setActiveTab('legal')} className={tabClass('legal', 'brand')}>
          Legal Intelligence
        </button>
        <button onClick={() => setActiveTab('reports')} className={tabClass('reports')}>
          Reports & Drafts
        </button>
      </div>

      {/* Content */}
      <div className="py-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* ─── 2. SIMILAR CASE DETECTION BACKGROUND LOADER ─── */}
            {isHeroCase && state.isProcessingIntelligence && (
              <div className="glass p-5 rounded-2xl border border-brand/40 bg-brand/5 animate-pulse text-xs space-y-3 font-mono">
                <div className="flex items-center gap-2 text-brand font-bold text-sm">
                  <Bot className="animate-spin" size={18} /> INTELLIGENCE ENGINE RUNNING...
                </div>
                <div className="space-y-1 text-text-dim text-[11px] leading-snug">
                  <div>[SCANNING] Analyzing FIR incident narrative patterns...</div>
                  <div>[NER] Extracting suspect vehicles, phone numbers, and location anchors...</div>
                  <div>[SIGNATURE] Profiling crime MO signatures...</div>
                  <div>[MATCH] Querying Odisha Police central intelligence index...</div>
                  <div className="text-brand font-bold">[ACTIVE] Mapping relationship networks...</div>
                </div>
              </div>
            )}

            {/* ─── 3. SIMILAR CASE DETECTED NOTIFICATIONS ─── */}
            {isHeroCase && !state.isProcessingIntelligence && (
              <div className="grid md:grid-cols-2 gap-4">
                {/* Local match alert */}
                <div className="glass p-5 rounded-2xl border border-success/30 bg-success/5 flex flex-col justify-between text-xs space-y-3">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-success bg-success/15 px-2 py-0.5 rounded border border-success/20 inline-block">
                      NEW SIMILAR CASE DETECTED
                    </div>
                    <h4 className="text-sm font-bold text-text mt-2 font-mono">CR-KHD-2025-00812</h4>
                    <p className="text-[11px] text-text-dim mt-1">Khandagiri Police Station · Similarity: <strong>87%</strong></p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] mt-2 font-semibold text-text-dim">
                      <span>✓ Similar crime category</span>
                      <span>✓ Similar entry method</span>
                      <span>✓ Similar vehicle pattern</span>
                      <span>✓ Similar location pattern</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSimilarityModal(true)}
                    className="w-full bg-success text-bg font-bold py-2 rounded-lg hover:bg-success-bright transition-colors uppercase tracking-wider text-center"
                  >
                    View Similarity
                  </button>
                </div>

                {/* Cross station match alert */}
                <div className="glass p-5 rounded-2xl border-danger/30 bg-danger/5 flex flex-col justify-between text-xs space-y-3">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-danger-bright bg-danger/10 px-2 py-0.5 rounded border border-danger/20 inline-block animate-pulse">
                      CROSS-STATION RELATIONSHIP DETECTED
                    </div>
                    <h4 className="text-sm font-bold text-text mt-2 font-mono">CR-CTC-2026-00981</h4>
                    <p className="text-[11px] text-text-dim mt-1">Cuttack Sadar Police Station · Similarity: <strong>91%</strong></p>
                    <div className="mt-2 text-[10px] text-text-dim">
                      <p><strong>Matched entities:</strong> Mobile Number, Vehicle, Crime Pattern</p>
                      <p className="mt-0.5"><strong>Relationship:</strong> SHARED ENTITY + SIMILAR CRIME SIGNATURE</p>
                    </div>
                    
                    <div className="mt-3 p-2 bg-surface rounded border border-border-soft flex items-center gap-1.5 font-bold">
                      <Lock size={12} className="text-danger-bright shrink-0" />
                      <span className="text-[10px] uppercase text-danger-bright">
                        {hasAccessToCrossStation ? '✓ Access Granted by Station Admin' : '🔒 Case Details Restricted'}
                      </span>
                    </div>
                  </div>

                  {hasAccessToCrossStation ? (
                    <button 
                      onClick={() => alert('Access Granted. Permitted Details unlocked in Relationship tab.')}
                      className="w-full bg-success text-bg font-bold py-2 rounded-lg hover:bg-success-bright transition-colors uppercase tracking-wider text-center"
                    >
                      Access Active
                    </button>
                  ) : crossStationRequest?.status === 'PENDING' ? (
                    <div className="p-2 bg-warning/10 border border-warning/25 text-warning font-bold text-center rounded-lg uppercase tracking-wider font-mono text-[10px]">
                      Access Request Pending Approval
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowRequestAccessModal(true)}
                      className="w-full bg-brand text-bg font-bold py-2 rounded-lg hover:bg-brand-bright transition-colors uppercase tracking-wider text-center"
                    >
                      Request Access
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Glass-Box Explainable Intelligence & Officer Verification Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand font-mono flex items-center gap-1.5">
                <Sparkles size={14} /> Glass-Box Explainable Intelligence Leads
              </h3>
              {explainableIntelStore.getLeads().slice(0, 2).map(lead => (
                <ExplainableLeadCard key={lead.id} lead={lead} />
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="glass p-6 rounded-xl bg-surface border border-border-soft">
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider mb-4 border-b border-border-soft pb-2">Incident Narrative</h3>
                  <p className="text-sm text-text-dim leading-relaxed">{currentCase.description}</p>
                </div>


                {/* ─── 5. SIMILAR & RELATED CASES DEDICATED SECTION ─── */}
                {!state.isProcessingIntelligence && (
                  <div className="glass p-6 rounded-xl bg-surface border border-border-soft space-y-4">
                    <h3 className="text-sm font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2">
                      RELATIONSHIP INTELLIGENCE (SIMILAR & RELATED CASES)
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Same Station Category */}
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-text-faint font-mono mb-2">Same Station Index</div>
                        <div className="p-4 bg-surface-2 border border-border-soft rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <div className="font-mono font-bold text-text text-sm">CR-KHD-2025-00812</div>
                            <div className="text-text-dim mt-0.5">Khandagiri PS · Residential Burglary · <strong>87% similarity</strong></div>
                            <p className="text-[10px] text-text-faint mt-1.5">Matching factors: Entry method, location pattern</p>
                          </div>
                          <button 
                            onClick={() => setShowSimilarityModal(true)}
                            className="bg-success/10 border border-success/20 text-success font-bold px-3 py-1.5 rounded hover:bg-success/25"
                          >
                            Compare Case
                          </button>
                        </div>
                      </div>

                      {/* Cross Station Category */}
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-text-faint font-mono mb-2">Cross-Station Index</div>
                        <div className="p-4 bg-surface-2 border border-border-soft rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <div className="font-mono font-bold text-text text-sm flex items-center gap-1.5">
                              CR-CTC-2026-00981 
                              {!hasAccessToCrossStation && <Lock size={12} className="text-danger-bright" />}
                            </div>
                            <div className="text-text-dim mt-0.5">Cuttack Sadar PS · Armed Heist · <strong>91% similarity</strong></div>
                            <p className="text-[10px] text-text-faint mt-1.5">Matching factors: Mobile Number, Vehicle Number, MO signature</p>
                          </div>
                          <div>
                            {hasAccessToCrossStation ? (
                              <button 
                                onClick={() => setActiveTab('graph')}
                                className="bg-success text-bg font-bold px-3.5 py-1.5 rounded hover:bg-success-bright transition-colors"
                              >
                                View graph
                              </button>
                            ) : crossStationRequest?.status === 'PENDING' ? (
                              <span className="text-[9px] font-bold uppercase font-mono tracking-wider text-warning bg-warning/5 border border-warning/20 px-2.5 py-1.5 rounded inline-block">
                                Pending Approval
                              </span>
                            ) : (
                              <button 
                                onClick={() => setShowRequestAccessModal(true)}
                                className="bg-brand text-bg font-bold px-3.5 py-1.5 rounded hover:bg-brand-bright transition-colors"
                              >
                                Request Access
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Evidence log */}
                <div className="glass p-6 rounded-xl bg-surface border border-border-soft">
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider mb-4 border-b border-border-soft pb-2 flex justify-between items-center">
                    Evidence Log
                    <button onClick={() => navigate('/evidence')} className="text-[10px] text-accent-bright hover:underline font-bold">Add Evidence</button>
                  </h3>
                  <div className="space-y-3">
                    {state.evidence.filter(e => e.caseId === currentCase.id).map(ev => (
                      <div key={ev.id} className="p-3 bg-surface-2 border border-border-soft/60 rounded-lg">
                        <div className="text-xs font-bold text-text">{ev.type}</div>
                        <div className="text-sm text-text-dim mt-1">{ev.description}</div>
                      </div>
                    ))}
                    {state.evidence.filter(e => e.caseId === currentCase.id).length === 0 && (
                      <div className="text-xs text-text-faint italic">No evidence logged yet.</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* DRISHTI Risk Intelligence Card */}
                <RiskIntelligenceCard
                  accusedName={currentCase.suspects?.[0] || 'Rajesh Kumar'}
                  firCount={3}
                  crimeTypes={[currentCase.crimeType, 'Burglary', 'Vehicle Theft']}
                  priorConvictions={2}
                />

                {/* DRISHTI Investigation Action Queue */}
                <InvestigationActionQueue
                  caseId={currentCase.id}
                  onOpenVehicleIntel={(plate) => {
                    setSelectedPlate(plate);
                    setShowVehicleModal(true);
                  }}
                  onOpenGeoTrail={() => setShowTrailModal(true)}
                />

                {/* Extracted Entities */}
                <div className="glass p-6 rounded-xl bg-surface border border-border-soft space-y-3">
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2">Extracted Entities</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentCase.entities.map(e => (
                      <div
                        key={e.id}
                        onClick={() => {
                          if (e.type === 'VEHICLE') {
                            setSelectedPlate(e.value);
                            setShowVehicleModal(true);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                          e.type === 'VEHICLE'
                            ? 'bg-brand/10 border-brand/40 text-brand cursor-pointer hover:bg-brand/20 font-bold flex items-center gap-1.5'
                            : 'bg-surface-2 border-border-soft text-text'
                        }`}
                      >
                        {e.type === 'VEHICLE' && <Car size={12} />}
                        <span className="text-text-dim">{e.type}:</span> <span className="font-bold text-text">{e.value}</span>
                        {e.type === 'VEHICLE' && <span className="text-[9px] bg-brand text-bg px-1.5 py-0.2 rounded ml-1 font-bold">ANPR INTEL</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legal intelligence preview card */}
                <div className="glass p-4 rounded-xl border border-brand/20 bg-surface">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                      <Scale size={12} /> Legal Intelligence
                    </h3>
                    <button
                      onClick={() => setActiveTab('legal')}
                      className="text-[10px] text-brand hover:underline font-mono"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {caseProvisions.slice(0, 2).map(p => (
                      <div key={p.section} className="flex items-center justify-between text-xs">
                        <span className="font-mono text-text">{p.section}</span>
                        <span className={`font-bold ${p.relevanceLevel === 'HIGH' ? 'text-success' : 'text-warning'}`}>
                          {p.relevance}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('legal')}
                    className="mt-3 w-full text-[10px] text-center font-bold text-brand bg-brand/10 border border-brand/20 rounded px-3 py-1.5 hover:bg-brand/20 transition-colors"
                  >
                    Explore {caseProvisions.length} BNS Provisions →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'graph' && (
          <div className="animate-fade-in space-y-4">
            {/* If approved, show Authorized details banner */}
            {isHeroCase && hasAccessToCrossStation && (
              <div className="p-3.5 bg-success/10 border border-success/20 text-success text-xs font-semibold rounded-xl flex items-center gap-1.5">
                <CheckCircle size={14} /> AUTHORIZED CROSS-STATION INTELLIGENCE: Case relationship network mapped. Permitted node details unlocked.
              </div>
            )}
            <CaseKnowledgeGraph caseId={currentCase.id} />
          </div>
        )}

        {activeTab === 'legal' && (
          <div className="animate-fade-in">
            <LegalProvisionList
              provisions={caseProvisions}
              title={`Legal Intelligence — ${currentCase.id}`}
              showDisclaimer
              compact={false}
            />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-fade-in grid md:grid-cols-2 gap-6">
             <div className="glass p-6 rounded-xl border border-border-soft text-center bg-surface">
               <FileBarChart size={32} className="text-accent mx-auto mb-4" />
               <h3 className="text-lg font-bold text-text mb-2">Charge Sheet Draft</h3>
               <p className="text-sm text-text-dim mb-6">AI-assisted generation of the initial charge sheet based on FIR and evidence.</p>
               
               {isGenerating ? (
                 <div className="space-y-3">
                   <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                     <div className="h-full bg-accent animate-pulse w-full"></div>
                   </div>
                   <p className="text-xs text-accent-bright font-mono">GENERATING DRAFT...</p>
                 </div>
               ) : draftGenerated ? (
                 <div className="space-y-3">
                   <div className="bg-success/10 border border-success/20 text-success p-3 rounded-lg text-sm font-bold">
                     Draft Generated Successfully
                   </div>
                   <div className="flex gap-2 justify-center">
                     <button className="bg-surface border border-border px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-surface-hover text-text">Preview</button>
                     <button className="bg-accent text-bg px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-accent-bright">Download PDF</button>
                   </div>
                 </div>
               ) : (
                 <button 
                   onClick={handleGenerateDraft}
                   className="bg-accent text-bg px-4 py-2 rounded-lg font-bold text-sm w-full hover:bg-accent-bright"
                 >
                   Generate Draft
                 </button>
               )}
               
               <p className="text-[9px] text-text-faint mt-4 uppercase font-bold">Requires authorized review and approval</p>
             </div>
          </div>
        )}
      </div>

      {/* ─── 6. SIMILARITY DETAILS PANEL MODAL ─── */}
      {showSimilarityModal && (
        <div className="fixed inset-0 bg-bg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-xl shadow-glass overflow-hidden animate-fade-in text-xs space-y-4">
            <div className="p-5 border-b border-border-soft flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                <Network size={16} className="text-brand" /> CASE RELATIONSHIP ANALYSIS
              </h3>
              <button type="button" onClick={() => setShowSimilarityModal(false)} className="text-text-dim hover:text-text font-bold text-lg">&times;</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-surface-2 border border-border-soft rounded-lg">
                  <div className="text-[9px] text-text-faint uppercase font-mono">Current Investigation</div>
                  <div className="text-sm font-bold text-text mt-1">{currentCase.id}</div>
                </div>
                <div className="p-3 bg-surface-2 border border-border-soft rounded-lg">
                  <div className="text-[9px] text-text-faint uppercase font-mono">Compared Case</div>
                  <div className="text-sm font-bold text-brand mt-1">CR-CTC-2026-00981</div>
                </div>
              </div>

              {/* Similarity bars */}
              <div className="space-y-3.5 border-t border-b border-border-soft/40 py-4">
                {[
                  { label: 'CRIME TYPE', val: 92, color: 'bg-brand' },
                  { label: 'ENTRY METHOD', val: 89, color: 'bg-brand' },
                  { label: 'VEHICLE PATTERN', val: 94, color: 'bg-brand' },
                  { label: 'LOCATION PATTERN', val: 81, color: 'bg-brand' },
                  { label: 'TIME PATTERN', val: 73, color: 'bg-brand' },
                  { label: 'SHARED ENTITY', val: 96, color: 'bg-brand' }
                ].map(bar => (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex justify-between font-mono font-bold text-[10px] text-text-dim">
                      <span>{bar.label}</span>
                      <span>{bar.val}%</span>
                    </div>
                    <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-border-soft/40">
                      <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-surface-2 p-3 border border-border-soft rounded-xl">
                <div className="text-[9px] text-text-faint uppercase font-mono font-bold">Why this case was flagged</div>
                <p className="text-text mt-1 leading-relaxed text-[11px] font-sans">
                  "Both investigations contain a matching mobile number and similar vehicle movement patterns. The extracted crime signatures also show a high degree of similarity."
                </p>
              </div>

              {!hasAccessToCrossStation && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger-bright rounded-lg font-mono font-bold text-center">
                  🔒 CASE INFORMATION REMAINS RESTRICTED UNTIL APPROVAL.
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-border-soft flex justify-end gap-3 bg-surface-2">
              <button type="button" onClick={() => setShowSimilarityModal(false)} className="px-4 py-2 font-bold text-text-dim hover:text-text">Close</button>
              {!hasAccessToCrossStation && crossStationRequest?.status !== 'PENDING' && (
                <button 
                  onClick={() => { setShowSimilarityModal(false); setShowRequestAccessModal(true); }}
                  className="bg-brand text-bg px-6 py-2 rounded-lg font-bold hover:bg-brand-bright transition-colors"
                >
                  Request Case Access
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 7. REQUEST ACCESS WORKFLOW MODAL ─── */}
      {showRequestAccessModal && (
        <div className="fixed inset-0 bg-bg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-glass overflow-hidden animate-fade-in text-xs space-y-4">
            <div className="p-5 border-b border-border-soft flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                <Lock size={16} className="text-brand" /> REQUEST CASE ACCESS
              </h3>
              <button type="button" onClick={() => setShowRequestAccessModal(false)} className="text-text-dim hover:text-text font-bold text-lg">&times;</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1">Requesting Station</label>
                  <input type="text" readOnly value="Khandagiri Police Station" className="w-full bg-surface-2 border border-border rounded p-2 text-text-faint outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1">Requesting Officer</label>
                  <input type="text" readOnly value="Insp. Vikram" className="w-full bg-surface-2 border border-border rounded p-2 text-text-faint outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1">Target Station</label>
                  <input type="text" readOnly value="Cuttack Sadar Police Station" className="w-full bg-surface-2 border border-border rounded p-2 text-text-faint outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1">Target Case ID</label>
                  <input type="text" readOnly value="CR-CTC-2026-00981" className="w-full bg-surface-2 border border-border rounded p-2 text-text-faint outline-none cursor-not-allowed font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1.5">Request Justification</label>
                <textarea
                  rows={4}
                  value={justificationText}
                  onChange={e => setJustificationText(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2.5 text-text outline-none focus:border-brand resize-none font-sans"
                />
              </div>
            </div>

            <div className="p-5 border-t border-border-soft flex justify-end gap-3 bg-surface-2">
              <button type="button" onClick={() => setShowRequestAccessModal(false)} className="px-4 py-2 font-bold text-text-dim hover:text-text">Cancel</button>
              <button 
                type="button" 
                onClick={handleSendAccessRequest}
                className="bg-brand text-bg px-6 py-2 rounded-lg font-bold hover:bg-brand-bright transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRISHTI Vehicle Intelligence & Geo-Trail Modals */}
      <VehicleIntelligenceModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        plateNumber={selectedPlate}
        onOpenTrail={() => setShowTrailModal(true)}
        onOpenCctv={() => navigate('/cctv')}
      />

      <VehicleGeoTrailModal
        isOpen={showTrailModal}
        onClose={() => setShowTrailModal(false)}
        plateNumber={selectedPlate}
        onOpenCctv={() => navigate('/cctv')}
      />
    </div>
  );
}

