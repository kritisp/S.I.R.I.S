/**
 * CaseKnowledgeGraph — S.I.R.I.S Case-Specific Entity Relationship Graph
 * High-precision tactical intelligence graph visualizing incident entities,
 * forensic evidence, and cross-station related cases with strict RBAC preservation.
 */
import React, { useState, useEffect } from 'react';
import {
  Lock, FileText, Smartphone, Car, MapPin, User,
  Shield, AlertTriangle, ArrowRight, CheckCircle2, ExternalLink
} from 'lucide-react';
import { useMockState } from '../../mockServices/MockStateContext';
import { Entity, CaseRecord } from '../../mockServices/types';
import { useNavigate } from 'react-router-dom';
import { LIGHT_NODE_COLORS, DARK_NODE_COLORS, NODE_ICONS, getNodeColors } from './IntelligenceGraph';

export function CaseKnowledgeGraph({ caseId }: { caseId: string }) {
  const { state, dispatch } = useMockState();
  const navigate = useNavigate();
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Theme detection
  const [isLight, setIsLight] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('theme-light') || !document.documentElement.classList.contains('theme-dark');
    }
    return true;
  });

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('theme-dark') || document.documentElement.classList.contains('dark');
      setIsLight(!isDark);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const colorPalette = isLight ? LIGHT_NODE_COLORS : DARK_NODE_COLORS;

  const currentCase = state.cases.find(c => c.id === caseId);
  if (!currentCase) return null;

  // Identify related cases sharing any entity value
  const relatedCases = state.cases.filter(c =>
    c.id !== caseId &&
    c.entities.some(e1 => currentCase.entities.some(e2 => e1.value === e2.value))
  );

  const getEntityIconSvg = (type: string) => {
    const key = (type || '').toUpperCase();
    switch (key) {
      case 'PHONE': return NODE_ICONS.PHONE;
      case 'VEHICLE': return NODE_ICONS.VEHICLE;
      case 'LOCATION': return NODE_ICONS.LOCATION;
      case 'PERSON': return NODE_ICONS.PERSON;
      default: return NODE_ICONS.EVIDENCE;
    }
  };

  const handleRequestAccess = (targetCaseId: string, targetStationId: string) => {
    dispatch({
      type: 'ADD_ACCESS_REQUEST',
      payload: {
        id: `REQ-${Date.now()}`,
        requestingStationId: state.currentUser?.stationId || '',
        requestingOfficerId: state.currentUser?.id || '',
        targetStationId,
        targetCaseId,
        reason: `Cross-station entity overlap discovered in Case Knowledge Graph for Case ${caseId}.`,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
    });
    navigate('/requests');
  };

  return (
    <div className={`relative w-full min-h-[540px] border rounded-2xl overflow-hidden flex flex-col items-center justify-between p-6 select-none font-sans ${
      isLight ? 'bg-[#F8FAFC] border-[#D9E0E8]' : 'bg-[#070b14] border-[#1e293b]'
    }`}>
      {/* Background Tactical Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <svg width="100%" height="100%">
          <pattern id="case-tactical-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke={isLight ? '#E8EDF3' : '#162036'}
              strokeWidth="0.75"
            />
            <circle cx="0" cy="0" r="1" fill={isLight ? '#D9E0E8' : '#253554'} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#case-tactical-grid)" />
        </svg>
      </div>

      {/* Top Telemetry Bar */}
      <div className={`relative z-10 w-full flex items-center justify-between gap-4 px-4 py-2 rounded-xl shadow-xs backdrop-blur-md border ${
        isLight ? 'bg-white/95 border-[#D9E0E8]' : 'bg-[#0b1222]/90 border-[#1e293b]'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-blue-600 animate-ping' : 'bg-cyan-400 animate-ping'}`} />
          <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isLight ? 'text-[#172033]' : 'text-slate-300'}`}>
            CASE INTEL GRAPH // {currentCase.id}
          </span>
        </div>
        <div className={`flex items-center gap-3 text-[10px] font-mono ${isLight ? 'text-[#5B6678]' : 'text-slate-400'}`}>
          <div>ENTITIES: <span className={`font-bold ${isLight ? 'text-[#B88922]' : 'text-amber-400'}`}>{currentCase.entities.length}</span></div>
          <span>|</span>
          <div>CROSS-STATION MATCHES: <span className={`font-bold ${isLight ? 'text-[#B91C1C]' : 'text-red-400'}`}>{relatedCases.length}</span></div>
        </div>
      </div>

      {/* ── Main Graph Visual Layout ── */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center my-6">

        {/* Central Root Case Node */}
        <div className="flex flex-col items-center mb-10 group">
          <div className="relative">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-transform duration-200 group-hover:scale-105 ${
              isLight
                ? 'bg-white border-[#2563EB] shadow-[0_2px_12px_rgba(37,99,235,0.15)] text-[#2563EB]'
                : 'bg-gradient-to-br from-sky-600 to-cyan-700 border-sky-300 shadow-[0_0_25px_rgba(2,132,199,0.4)] text-white'
            }`}>
              <FileText size={26} className={isLight ? 'text-[#2563EB]' : 'text-white'} />
            </div>
            <div className={`absolute -top-1.5 -right-1.5 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
              isLight ? 'bg-blue-50 border-blue-300 text-[#1D4ED8]' : 'bg-sky-950 border-sky-400 text-sky-200'
            }`}>
              PRIMARY
            </div>
          </div>
          <div className="mt-2 text-center">
            <div className={`text-xs font-mono font-bold px-3 py-1 rounded-md shadow-xs border ${
              isLight ? 'text-[#172033] bg-white border-[#D9E0E8]' : 'text-slate-100 bg-[#0b1222] border-[#1e293b]'
            }`}>
              {currentCase.id}
            </div>
            <div className={`text-[10px] mt-0.5 max-w-xs truncate font-medium ${
              isLight ? 'text-[#5B6678]' : 'text-slate-400'
            }`}>
              {currentCase.title}
            </div>
          </div>
        </div>

        {/* Extracted Entities Row */}
        <div className="w-full flex justify-center gap-6 md:gap-12 flex-wrap items-start">
          {currentCase.entities.map(ent => {
            const colors = getNodeColors(colorPalette, ent.type);
            const isSelected = selectedEntityId === ent.id;

            const linkedCase = relatedCases.find(rc => rc.entities.some(re => re.value === ent.value));

            return (
              <div
                key={ent.id}
                className="relative flex flex-col items-center group cursor-pointer"
                onClick={() => setSelectedEntityId(isSelected ? null : ent.id)}
              >
                {/* Connecting Line to Root Case */}
                <div
                  className="absolute -top-10 left-1/2 -translate-x-1/2 w-[2px] h-10 transition-colors duration-200"
                  style={{
                    backgroundColor: isSelected ? colors.border : (isLight ? '#CBD5E1' : '#334155'),
                  }}
                />

                {/* Entity Node Bubble */}
                <div
                  className="relative w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-200 group-hover:scale-105"
                  style={{
                    backgroundColor: isSelected ? (isLight ? '#EFF6FF' : colors.base) : (isLight ? '#FFFFFF' : '#0f172a'),
                    borderColor: isSelected ? (isLight ? '#1D4ED8' : '#ffffff') : colors.border,
                    boxShadow: isSelected ? (isLight ? `0 2px 10px rgba(29,78,216,0.2)` : `0 0 16px ${colors.base}80`) : undefined,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isSelected ? (isLight ? '#1D4ED8' : '#ffffff') : colors.light}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={getEntityIconSvg(ent.type)} />
                  </svg>
                  {linkedCase && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border border-white" />
                    </span>
                  )}
                </div>

                {/* Entity Text Labels */}
                <div className="mt-2 text-center max-w-[120px]">
                  <div
                    className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded"
                    style={{ color: colors.light }}
                  >
                    {ent.type}
                  </div>
                  <div className={`text-[10px] font-mono font-semibold truncate mt-0.5 ${
                    isLight ? 'text-[#172033]' : 'text-slate-200'
                  }`}>
                    {ent.value}
                  </div>
                </div>

                {/* Linked Case Branch */}
                {linkedCase && (
                  <div className="relative mt-4 flex flex-col items-center">
                    <div className={`w-[2px] h-6 border-l-2 border-dashed mb-2 ${isLight ? 'border-[#DC2626]' : 'border-red-500'}`} />
                    <div className="w-52">
                      <LinkedCaseCard
                        targetCase={linkedCase}
                        currentStationId={state.currentUser?.stationId || ''}
                        onRequestAccess={() => handleRequestAccess(linkedCase.id, linkedCase.stationId)}
                        onViewCase={() => navigate(`/cases/${linkedCase.id}`)}
                        isLight={isLight}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className={`relative z-10 w-full flex items-center justify-between text-[10px] font-mono border-t pt-3 ${
        isLight ? 'border-[#E4E7EC] text-[#5B6678]' : 'border-[#1e293b] text-slate-500'
      }`}>
        <div className="flex items-center gap-1.5">
          <Shield size={11} className={isLight ? 'text-[#1D4ED8]' : 'text-cyan-400'} />
          <span>Odisha Police Link Analysis Workstation · Probabilistic Match Engine Active</span>
        </div>
        <div className={isLight ? 'text-[#172033] font-medium' : 'text-slate-400'}>
          STATION: {currentCase.stationId}
        </div>
      </div>
    </div>
  );
}

// ─── Linked Case Subcard ──────────────────────────────────────────────────────

function LinkedCaseCard({
  targetCase,
  currentStationId,
  onRequestAccess,
  onViewCase,
  isLight,
}: {
  targetCase: CaseRecord;
  currentStationId: string;
  onRequestAccess: () => void;
  onViewCase: () => void;
  isLight: boolean;
}) {
  const { state } = useMockState();
  const isSameStation = targetCase.stationId === currentStationId;
  const isSuperAdmin = state.currentUser?.role === 'SUPER_ADMIN';

  const existingRequest = state.accessRequests.find(
    r => r.targetCaseId === targetCase.id && r.requestingStationId === currentStationId
  );
  const isApproved = existingRequest?.status === 'APPROVED';
  const hasAccess = isSameStation || isSuperAdmin || isApproved;

  if (hasAccess) {
    return (
      <div className={`border rounded-xl p-3 text-center shadow-xs transition-colors ${
        isLight
          ? 'bg-white border-blue-200 hover:border-blue-400 text-[#172033]'
          : 'bg-[#0b1222]/95 border-cyan-800/80 hover:border-cyan-400 text-white'
      }`}>
        <div className={`flex items-center justify-center gap-1 text-xs font-mono font-bold mb-1 ${
          isLight ? 'text-[#1D4ED8]' : 'text-cyan-300'
        }`}>
          <FileText size={13} /> {targetCase.id}
        </div>
        <div className={`text-[10px] truncate font-medium ${isLight ? 'text-[#5B6678]' : 'text-slate-300'}`}>
          {targetCase.title}
        </div>
        <div className={`flex items-center justify-center gap-1 mt-1 text-[9px] font-mono rounded px-1.5 py-0.5 border ${
          isLight ? 'text-[#15803D] bg-emerald-50 border-emerald-200' : 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
        }`}>
          <CheckCircle2 size={10} /> Authorized Access
        </div>
        <button
          onClick={onViewCase}
          className={`mt-2 w-full text-[9px] font-mono font-bold py-1 rounded transition-colors flex items-center justify-center gap-1 border ${
            isLight
              ? 'bg-blue-50 border-blue-200 text-[#1D4ED8] hover:bg-blue-100'
              : 'bg-cyan-950 border-cyan-700 text-cyan-200 hover:bg-cyan-900'
          }`}
        >
          <span>Open Case</span>
          <ExternalLink size={10} />
        </button>
      </div>
    );
  }

  // Restricted Access State
  return (
    <div className={`border rounded-xl p-3 text-center shadow-xs relative overflow-hidden ${
      isLight ? 'bg-red-50/90 border-red-200 text-[#B91C1C]' : 'bg-[#140b10]/95 border-red-800/60 text-white'
    }`}>
      <div className="flex flex-col items-center">
        <div className={`flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider mb-1 ${
          isLight ? 'text-[#B91C1C]' : 'text-red-400'
        }`}>
          <Lock size={12} className={isLight ? 'text-[#DC2626]' : 'text-red-400'} /> Restricted Dossier
        </div>
        <div className={`text-xs font-mono font-bold mb-0.5 ${isLight ? 'text-[#172033]' : 'text-slate-200'}`}>{targetCase.id}</div>
        <div className={`text-[9px] font-mono mb-2 ${isLight ? 'text-[#5B6678]' : 'text-slate-400'}`}>Station: {targetCase.stationId}</div>

        {existingRequest?.status === 'PENDING' ? (
          <div className={`text-[9px] font-mono px-2 py-1 rounded w-full border flex items-center justify-center gap-1 ${
            isLight ? 'bg-amber-50 text-[#B45309] border-amber-200' : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
          }`}>
            <span>⏳ Request Pending</span>
          </div>
        ) : existingRequest?.status === 'REJECTED' ? (
          <div className={`text-[9px] font-mono px-2 py-1 rounded w-full border flex items-center justify-center gap-1 ${
            isLight ? 'bg-red-100 text-[#B91C1C] border-red-300' : 'bg-red-950/40 text-red-300 border-red-800/40'
          }`}>
            <span>✕ Request Denied</span>
          </div>
        ) : (
          <button
            onClick={onRequestAccess}
            className={`w-full text-[9px] font-mono font-bold py-1 rounded transition-colors flex items-center justify-center gap-1 shadow-xs border ${
              isLight
                ? 'bg-[#B91C1C] text-white border-red-700 hover:bg-red-800'
                : 'bg-red-950 border border-red-700 text-red-200 hover:bg-red-900'
            }`}
          >
            <span>Request Access</span>
            <ArrowRight size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
