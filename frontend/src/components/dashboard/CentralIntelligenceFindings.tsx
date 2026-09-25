import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Network, ArrowUpRight, ShieldAlert,
  GitMerge, Smartphone, Car, Fingerprint, Layers, ExternalLink,
  CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useMockState } from '../../mockServices/MockStateContext';
import { CaseRecord } from '../../mockServices/types';

interface CentralIntelligenceFindingsProps {
  cases?: CaseRecord[];
}

export function CentralIntelligenceFindings({ cases: propsCases }: CentralIntelligenceFindingsProps) {
  const { state } = useMockState();
  const navigate = useNavigate();

  const currentStation = state.stations.find(s => s.id === state.currentUser?.stationId) || state.stations[0];
  const stationName = currentStation?.name || 'Kharavela Nagar PS';
  const activeCases = propsCases || state.cases || [];

  // Dynamically compute intelligence findings based on station's real cases
  const dynamicFindings = useMemo(() => {
    if (!activeCases || activeCases.length === 0) return [];

    const findings = [];
    const cyberCases = activeCases.filter(c => (c.crimeType || '').toUpperCase().includes('CYBER') || (c.crimeType || '').toUpperCase().includes('FRAUD'));
    const vehicleCases = activeCases.filter(c => (c.crimeType || '').toUpperCase().includes('THEFT') || (c.crimeType || '').toUpperCase().includes('ROBBERY') || (c.crimeType || '').toUpperCase().includes('BURGLARY'));
    const violentCases = activeCases.filter(c => (c.crimeType || '').toUpperCase().includes('EXTORTION') || (c.crimeType || '').toUpperCase().includes('HEIST') || (c.crimeType || '').toUpperCase().includes('HOMICIDE'));

    // Finding 1: Modus Operandi
    if (cyberCases.length > 0) {
      const sample = cyberCases[0];
      findings.push({
        id: 'find-mo-01',
        type: 'MODUS_OPERANDI' as const,
        title: `Syndicate Modus Operandi: ${sample.crimeType?.replace(/_/g, ' ') || 'Coercive Cyber Extortion'}`,
        description: `Crime pattern analysis identified recurring transaction routing patterns across ${Math.min(cyberCases.length, 5)} active station dockets.`,
        statusText: 'PATTERN VERIFIED',
        statusColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30',
        entities: [`Target: Financial Fraud Vectors`, `Primary FIR: ${sample.firNumber || sample.id}`],
        cases: [sample.firNumber || sample.id],
        stations: [stationName, 'Cuttack Cyber Cell'],
        caseId: sample.id,
      });
    }

    // Finding 2: Cross-Station Nexus / Device IMEI
    if (violentCases.length > 0 || activeCases.length > 1) {
      const sample = violentCases[0] || activeCases[1] || activeCases[0];
      findings.push({
        id: 'find-ph-02',
        type: 'PHONE_CROSS_MATCH' as const,
        title: 'Cross-Jurisdiction Telephony & CDR Overlap',
        description: `Tower location logs and call-detail records in ${sample.firNumber || sample.id} match flagged phone activity in neighboring police station.`,
        statusText: 'INTER-DISTRICT LINK',
        statusColor: 'bg-accent/15 text-accent dark:text-[#38BDF8] border-accent/30 dark:border-[#38BDF8]/30',
        entities: [`Flagged MSISDN Cluster`, `Station: ${stationName}`],
        cases: [sample.firNumber || sample.id],
        stations: [stationName, 'Saheed Nagar PS'],
        caseId: sample.id,
      });
    }

    // Finding 3: Vehicle ANPR & Movement Overlap
    if (vehicleCases.length > 0 || activeCases.length > 2) {
      const sample = vehicleCases[0] || activeCases[2] || activeCases[0];
      findings.push({
        id: 'find-vh-03',
        type: 'VEHICLE_SYNDICATE' as const,
        title: 'Vehicle Movement Correlated with Crime Window',
        description: `Automated high-speed camera lookup spotted suspect getaway registration traversing ${stationName} perimeter prior to incident filing.`,
        statusText: 'ANPR POSITIVE HIT',
        statusColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        entities: [`Vehicle Track: OD-02 Gateway`, `Linked FIR: ${sample.firNumber || sample.id}`],
        cases: [sample.firNumber || sample.id],
        stations: [stationName, 'Puri Highway Toll'],
        caseId: sample.id,
      });
    }

    // Finding 4: Identity Resolution / Alias convergence
    if (activeCases.length > 3) {
      const sample = activeCases[3];
      findings.push({
        id: 'find-id-04',
        type: 'IDENTITY_RESOLUTION' as const,
        title: 'Identity Resolution: Known Alias Convergence',
        description: `Automated alias and suspect profile matching linked record with existing NCRB & State Police criminal dossier.`,
        statusText: 'DOSSIER RESOLVED',
        statusColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        entities: [`Resolved Persona Match`, `Docket: ${sample.firNumber || sample.id}`],
        cases: [sample.firNumber || sample.id],
        stations: [stationName, 'State CID HQ'],
        caseId: sample.id,
      });
    }

    return findings;
  }, [activeCases, stationName]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'MODUS_OPERANDI':
        return <GitMerge size={14} className="text-purple-500" />;
      case 'PHONE_CROSS_MATCH':
        return <Smartphone size={14} className="text-accent dark:text-[#38BDF8]" />;
      case 'VEHICLE_SYNDICATE':
        return <Car size={14} className="text-amber-500" />;
      default:
        return <Fingerprint size={14} className="text-emerald-500" />;
    }
  };

  return (
    <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 flex flex-col justify-between shadow-xs dark:shadow-2xl font-sans select-none h-full transition-colors">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-[#1E293B] mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <h2 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-text dark:text-[#F8FAFC]">
              LIVE INTELLIGENCE FINDINGS · {stationName}
            </h2>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-bold">
            CRIME INTELLIGENCE RADAR
          </span>
        </div>

        {/* Findings List */}
        <div className="space-y-2.5 font-sans">
          {dynamicFindings.map((finding) => (
            <div
              key={finding.id}
              onClick={() => {
                if (finding.caseId) {
                  navigate(`/cases/${finding.caseId}`);
                } else {
                  navigate('/network');
                }
              }}
              className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B]/70 hover:border-purple-500/50 transition-all cursor-pointer group shadow-2xs"
            >
              {/* Finding Title & Status Badge */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] flex items-center justify-center shrink-0">
                    {getIcon(finding.type)}
                  </div>
                  <h3 className="text-xs font-bold text-text dark:text-[#F8FAFC] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                    {finding.title}
                  </h3>
                </div>

                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${finding.statusColor}`}>
                  {finding.statusText}
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] text-text-dim dark:text-[#94A3B8] line-clamp-2 mb-2">
                {finding.description}
              </p>

              {/* Entity Tags & Cross-Station Badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                {finding.entities.map((ent, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.2 rounded bg-surface dark:bg-[#070A0F] text-text dark:text-[#E2E8F0] border border-border-soft dark:border-[#1E293B]"
                  >
                    {ent}
                  </span>
                ))}

                <span className="text-text-dim dark:text-[#64748B]">across</span>

                {finding.stations.map((st, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.2 rounded bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] border border-accent/20 dark:border-[#38BDF8]/20 font-bold"
                  >
                    {st}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-3 mt-3 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between font-mono text-[11px]">
        <span className="text-text-dim dark:text-[#64748B]">Station intelligence verified against Odisha CCTNS database</span>
        <button
          onClick={() => navigate('/network')}
          className="text-accent dark:text-[#38BDF8] hover:underline flex items-center gap-1 font-bold cursor-pointer"
        >
          <span>Open Full Network Graph</span>
          <ArrowUpRight size={12} />
        </button>
      </div>
    </div>
  );
}
