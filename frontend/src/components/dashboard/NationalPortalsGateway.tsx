import React, { useState } from 'react';
import {
  Globe, Shield, Fingerprint, Search, ExternalLink,
  Lock, CheckCircle2, AlertTriangle, Radio, Activity,
  Server, Database, Cpu, Zap, ArrowUpRight
} from 'lucide-react';

interface PortalItem {
  id: string;
  code: string;
  name: string;
  fullName: string;
  category: 'CORE_JUSTICE' | 'FORENSICS' | 'EMERGENCY' | 'CYBER' | 'VEHICLE';
  status: 'ONLINE' | 'ACTIVE' | 'SYNCHRONIZED';
  pingMs: number;
  lastSync: string;
  description: string;
  badge: string;
  directUrl: string;
  integrationStatus: string;
  stats: { label: string; value: string };
}

const NATIONAL_PORTALS: PortalItem[] = [
  {
    id: 'cctns',
    code: 'CCTNS 2.0',
    name: 'CCTNS National Portal',
    fullName: 'Crime and Criminal Tracking Network & Systems (MHA / NCRB)',
    category: 'CORE_JUSTICE',
    status: 'SYNCHRONIZED',
    pingMs: 14,
    lastSync: '10 sec ago',
    description: 'National centralized FIR, GD, and case dairy database linking 16,000+ police stations across India.',
    badge: 'MHA / NCRB',
    directUrl: 'https://ncrb.gov.in/en/cctns',
    integrationStatus: 'Realtime WebSocket Active',
    stats: { label: 'Statewide Dockets', value: '1,200 Synced' }
  },
  {
    id: 'icjs',
    code: 'ICJS',
    name: 'Inter-operable Criminal Justice System',
    fullName: 'Supreme Court of India e-Committee & MHA ICJS Core Grid',
    category: 'CORE_JUSTICE',
    status: 'ONLINE',
    pingMs: 22,
    lastSync: '1 min ago',
    description: 'Seamless data exchange between Police (CCTNS), Courts (e-Courts), e-Prisons, Prosecution, and Forensics (e-Forensics).',
    badge: 'SCI / NIC',
    directUrl: 'https://icjs.gov.in',
    integrationStatus: 'Bi-directional e-Courts Relay',
    stats: { label: 'Case Relays', value: '448 Court Notices' }
  },
  {
    id: 'nafis',
    code: 'NAFIS',
    name: 'National AFIS Biometrics',
    fullName: 'National Automated Fingerprint Identification System (NCRB)',
    category: 'FORENSICS',
    status: 'ONLINE',
    pingMs: 18,
    lastSync: '2 min ago',
    description: 'Country-wide searchable repository of criminal fingerprint biometrics with 10-digit instant match.',
    badge: 'NCRB Central',
    directUrl: 'https://ncrb.gov.in',
    integrationStatus: '10-Print Match Engine Online',
    stats: { label: 'Biometric Hits', value: '98.4% Confidence' }
  },
  {
    id: 'itsso',
    code: 'ITSSO',
    name: 'Sexual Offences Tracking (ITSSO)',
    fullName: 'Investigation Tracking System for Sexual Offences (MHA)',
    category: 'CORE_JUSTICE',
    status: 'ACTIVE',
    pingMs: 28,
    lastSync: '5 min ago',
    description: 'Statutory 60-day time-bound investigation monitoring system mandated under Criminal Law Amendment Act.',
    badge: 'Statutory 60D',
    directUrl: 'https://itsso.gov.in',
    integrationStatus: 'Compliance Clock Synced',
    stats: { label: 'Active Monitored', value: '18 Dockets' }
  },
  {
    id: 'erss112',
    code: '112 ERSS',
    name: 'Emergency Response Support Grid',
    fullName: 'Dial 112 Pan-India Single Emergency Response System',
    category: 'EMERGENCY',
    status: 'SYNCHRONIZED',
    pingMs: 9,
    lastSync: 'Live CAD',
    description: 'Computer Aided Dispatch (CAD) receiving live distress calls and automated patrol GPS fleet routing.',
    badge: 'Live CAD Stream',
    directUrl: 'https://erss.in',
    integrationStatus: 'GPS Telemetry Active',
    stats: { label: 'Dispatch Latency', value: '< 6.4 mins' }
  },
  {
    id: 'i4c',
    code: 'I4C / 1930',
    name: 'Indian Cyber Crime Coordination',
    fullName: 'National Cybercrime Reporting Portal (NCRP & 1930 Helpline)',
    category: 'CYBER',
    status: 'ONLINE',
    pingMs: 31,
    lastSync: '3 min ago',
    description: 'Rapid coordination platform for immediate cyber fraud reporting, suspect bank lien, and mule tracking.',
    badge: 'MHA Cyber Division',
    directUrl: 'https://cybercrime.gov.in',
    integrationStatus: 'NCRP API Gateway Live',
    stats: { label: 'Mule Accounts Flagged', value: '47 Frozen' }
  },
  {
    id: 'vahan',
    code: 'VAHAN / SARATHI',
    name: 'National Vehicle & DL Registry',
    fullName: 'MoRTH National Transport Database & High Speed OCR',
    category: 'VEHICLE',
    status: 'ONLINE',
    pingMs: 25,
    lastSync: '4 min ago',
    description: 'Real-time vehicle registration, chassis number, engine number, and driver license verification.',
    badge: 'MoRTH / NIC',
    directUrl: 'https://vahan.parivahan.gov.in',
    integrationStatus: 'ANPR Link Active',
    stats: { label: 'ANPR Lookups', value: '382 Checked' }
  },
  {
    id: 'ndso',
    code: 'NDSO Registry',
    name: 'National Database on Sexual Offenders',
    fullName: 'NCRB Inter-State Recidivism & Offender Registry',
    category: 'CORE_JUSTICE',
    status: 'ONLINE',
    pingMs: 35,
    lastSync: '12 min ago',
    description: 'Inter-state database maintained by NCRB for tracking repeat offenders and background verifications.',
    badge: 'NCRB Inter-State',
    directUrl: 'https://ncrb.gov.in',
    integrationStatus: 'Cross-State Nexus Match',
    stats: { label: 'Registry Match', value: 'Zero Recidivism' }
  }
];

export function NationalPortalsGateway() {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedPortal, setSelectedPortal] = useState<PortalItem | null>(null);

  const filteredPortals = NATIONAL_PORTALS.filter((p) => {
    if (activeCategory === 'ALL') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-xs dark:shadow-2xl font-sans transition-all space-y-4">
      {/* Header with official Govt seal badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-soft dark:border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 dark:bg-[#38BDF8]/10 border border-accent/30 dark:border-[#38BDF8]/30 flex items-center justify-center text-accent dark:text-[#38BDF8]">
            <Globe size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold font-mono text-text dark:text-[#F8FAFC] tracking-tight">
                NATIONAL POLICE & LAW ENFORCEMENT PORTALS GATEWAY
              </h2>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                8/8 LIVE
              </span>
            </div>
            <p className="text-xs text-text-dim dark:text-[#94A3B8] font-mono mt-0.5">
              Government of India & Odisha Police Inter-Agency Intelligence & Biometrics Highway
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 font-mono text-[11px]">
          {['ALL', 'CORE_JUSTICE', 'FORENSICS', 'CYBER', 'EMERGENCY', 'VEHICLE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap font-bold ${
                activeCategory === cat
                  ? 'bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#0B0F17]'
                  : 'bg-surface-2 dark:bg-[#0E1422] text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] border border-border-soft dark:border-[#1E293B]'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of National Portal Connectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredPortals.map((portal) => (
          <div
            key={portal.id}
            onClick={() => setSelectedPortal(portal)}
            className="p-3.5 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] hover:border-accent/50 dark:hover:border-[#38BDF8]/50 transition-all cursor-pointer group flex flex-col justify-between space-y-3 relative overflow-hidden"
          >
            {/* Top Indicator */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-accent dark:text-[#38BDF8]">
                    {portal.code}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface dark:bg-[#131B2E] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8]">
                    {portal.badge}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-text dark:text-[#F8FAFC] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors leading-tight">
                  {portal.name}
                </h3>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {portal.pingMs}ms
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-[11px] text-text-dim dark:text-[#94A3B8] leading-relaxed line-clamp-2">
              {portal.description}
            </p>

            {/* Bottom Status & Quick Action */}
            <div className="pt-2 border-t border-border-soft dark:border-[#1E293B]/60 flex items-center justify-between text-[10px] font-mono">
              <span className="text-text-dim dark:text-[#64748B]">
                {portal.stats.label}: <strong className="text-text dark:text-[#F8FAFC]">{portal.stats.value}</strong>
              </span>
              <a
                href={portal.directUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-accent dark:text-[#38BDF8] hover:underline font-bold"
              >
                <span>Launch</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Portal Modal / Detail Drawer */}
      {selectedPortal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedPortal(null)}
        >
          <div
            className="bg-surface dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 dark:bg-[#38BDF8]/10 border border-accent/30 dark:border-[#38BDF8]/30 flex items-center justify-center text-accent dark:text-[#38BDF8]">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text dark:text-[#F8FAFC] font-mono">
                    {selectedPortal.fullName}
                  </h3>
                  <p className="text-xs text-text-dim dark:text-[#94A3B8] font-mono">
                    Protocol: {selectedPortal.integrationStatus}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPortal(null)}
                className="text-text-dim hover:text-text dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] font-mono text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text dark:text-[#E2E8F0] leading-relaxed">
              {selectedPortal.description}
            </p>

            <div className="grid grid-cols-2 gap-2 p-3 bg-surface-2 dark:bg-[#070A0F] rounded-lg border border-border-soft dark:border-[#1E293B] text-xs font-mono">
              <div>
                <span className="text-text-dim dark:text-[#64748B] text-[10px]">Gateway Status:</span>
                <div className="text-emerald-500 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={12} /> {selectedPortal.status}
                </div>
              </div>
              <div>
                <span className="text-text-dim dark:text-[#64748B] text-[10px]">Round-Trip Latency:</span>
                <div className="text-text dark:text-[#F8FAFC] font-bold mt-0.5">
                  {selectedPortal.pingMs} ms (State Grid)
                </div>
              </div>
              <div>
                <span className="text-text-dim dark:text-[#64748B] text-[10px]">Last Heartbeat:</span>
                <div className="text-text dark:text-[#F8FAFC] font-bold mt-0.5">
                  {selectedPortal.lastSync}
                </div>
              </div>
              <div>
                <span className="text-text-dim dark:text-[#64748B] text-[10px]">{selectedPortal.stats.label}:</span>
                <div className="text-accent dark:text-[#38BDF8] font-bold mt-0.5">
                  {selectedPortal.stats.value}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPortal(null)}
                className="px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#131B2E] text-text-dim dark:text-[#94A3B8] hover:text-text font-mono text-xs font-bold border border-border-soft dark:border-[#1E293B]"
              >
                Close
              </button>
              <a
                href={selectedPortal.directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 rounded-lg bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#0B0F17] font-mono text-xs font-bold hover:brightness-110 flex items-center gap-1.5"
              >
                <span>Access Official Portal</span>
                <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
