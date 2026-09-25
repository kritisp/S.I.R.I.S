import React, { useState } from 'react';
import {
  Globe, Shield, Fingerprint, Search, ExternalLink,
  Lock, CheckCircle2, AlertTriangle, Radio, Activity,
  Server, Database, Cpu, Zap, ArrowUpRight, Plus, RefreshCw
} from 'lucide-react';

export interface PolicePortal {
  id: string;
  code: string;
  name: string;
  agency: string;
  category: 'CORE_JUSTICE' | 'FORENSICS' | 'EMERGENCY' | 'CYBER' | 'VEHICLE' | 'STATE_CUSTOM';
  status: 'ONLINE' | 'ACTIVE' | 'SYNCHRONIZED';
  pingMs: number;
  lastSync: string;
  description: string;
  badge: string;
  directUrl: string;
  protocol: string;
  stats: { label: string; value: string };
}

const INITIAL_PORTALS: PolicePortal[] = [
  {
    id: 'cctns',
    code: 'CCTNS 2.0',
    name: 'CCTNS National Portal',
    agency: 'Ministry of Home Affairs / NCRB',
    category: 'CORE_JUSTICE',
    status: 'SYNCHRONIZED',
    pingMs: 14,
    lastSync: '10 sec ago',
    description: 'National centralized FIR, GD, and case dairy database linking 16,000+ police stations across India.',
    badge: 'MHA / NCRB',
    directUrl: 'https://ncrb.gov.in/en/cctns',
    protocol: 'Realtime WebSocket v2.4',
    stats: { label: 'Statewide Dockets', value: '1,200 Synced' }
  },
  {
    id: 'icjs',
    code: 'ICJS',
    name: 'Inter-operable Criminal Justice System',
    agency: 'Supreme Court e-Committee & MHA',
    category: 'CORE_JUSTICE',
    status: 'ONLINE',
    pingMs: 22,
    lastSync: '1 min ago',
    description: 'Data exchange highway between Police (CCTNS), Courts (e-Courts), e-Prisons, Prosecution, and Forensics.',
    badge: 'SCI / NIC',
    directUrl: 'https://icjs.gov.in',
    protocol: 'Bi-directional e-Courts Relay',
    stats: { label: 'Case Relays', value: '448 Court Notices' }
  },
  {
    id: 'nafis',
    code: 'NAFIS',
    name: 'National AFIS Biometrics',
    agency: 'NCRB National Biometrics Division',
    category: 'FORENSICS',
    status: 'ONLINE',
    pingMs: 18,
    lastSync: '2 min ago',
    description: 'Country-wide searchable repository of criminal fingerprint biometrics with 10-digit instant match.',
    badge: 'NCRB Central',
    directUrl: 'https://ncrb.gov.in',
    protocol: '10-Print Match Engine API',
    stats: { label: 'Biometric Hits', value: '98.4% Confidence' }
  },
  {
    id: 'itsso',
    code: 'ITSSO',
    name: 'Sexual Offences Tracking (ITSSO)',
    agency: 'Ministry of Home Affairs',
    category: 'CORE_JUSTICE',
    status: 'ACTIVE',
    pingMs: 28,
    lastSync: '5 min ago',
    description: 'Statutory 60-day time-bound investigation monitoring system mandated under Criminal Law Amendment Act.',
    badge: 'Statutory 60D',
    directUrl: 'https://itsso.gov.in',
    protocol: 'Compliance Clock Synced',
    stats: { label: 'Active Monitored', value: '18 Dockets' }
  },
  {
    id: 'erss112',
    code: '112 ERSS',
    name: 'Emergency Response Support Grid',
    agency: 'Odisha Police Emergency Grid',
    category: 'EMERGENCY',
    status: 'SYNCHRONIZED',
    pingMs: 9,
    lastSync: 'Live CAD',
    description: 'Computer Aided Dispatch (CAD) receiving live distress calls and automated patrol GPS fleet routing.',
    badge: 'Live CAD Stream',
    directUrl: 'https://erss.in',
    protocol: 'GPS Telemetry Active',
    stats: { label: 'Dispatch Latency', value: '< 6.4 mins' }
  },
  {
    id: 'i4c',
    code: 'I4C / 1930',
    name: 'Indian Cyber Crime Coordination',
    agency: 'National Cyber Crime Reporting Portal',
    category: 'CYBER',
    status: 'ONLINE',
    pingMs: 31,
    lastSync: '3 min ago',
    description: 'Rapid coordination platform for immediate cyber fraud reporting, suspect bank lien, and mule tracking.',
    badge: 'MHA Cyber Division',
    directUrl: 'https://cybercrime.gov.in',
    protocol: 'NCRP API Gateway Live',
    stats: { label: 'Mule Accounts Flagged', value: '47 Frozen' }
  },
  {
    id: 'vahan',
    code: 'VAHAN / SARATHI',
    name: 'National Vehicle & DL Registry',
    agency: 'Ministry of Road Transport & Highways',
    category: 'VEHICLE',
    status: 'ONLINE',
    pingMs: 25,
    lastSync: '4 min ago',
    description: 'Real-time vehicle registration, chassis number, engine number, and driver license verification.',
    badge: 'MoRTH / NIC',
    directUrl: 'https://vahan.parivahan.gov.in',
    protocol: 'ANPR Link Active',
    stats: { label: 'ANPR Lookups', value: '382 Checked' }
  },
  {
    id: 'ndso',
    code: 'NDSO Registry',
    name: 'National Database on Sexual Offenders',
    agency: 'NCRB Inter-State Recidivism Registry',
    category: 'CORE_JUSTICE',
    status: 'ONLINE',
    pingMs: 35,
    lastSync: '12 min ago',
    description: 'Inter-state database maintained by NCRB for tracking repeat offenders and background verifications.',
    badge: 'NCRB Inter-State',
    directUrl: 'https://ncrb.gov.in',
    protocol: 'Cross-State Nexus Match',
    stats: { label: 'Registry Match', value: 'Zero Recidivism' }
  }
];

export function NationalPortalsPage() {
  const [portals, setPortals] = useState<PolicePortal[]>(INITIAL_PORTALS);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPortal, setSelectedPortal] = useState<PolicePortal | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Portal Form State
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newAgency, setNewAgency] = useState('');
  const [newCategory, setNewCategory] = useState<'CORE_JUSTICE' | 'FORENSICS' | 'EMERGENCY' | 'CYBER' | 'VEHICLE' | 'STATE_CUSTOM'>('STATE_CUSTOM');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const filteredPortals = portals.filter((p) => {
    if (activeCategory !== 'ALL' && p.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.agency.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddPortal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    const newPortal: PolicePortal = {
      id: `custom-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      agency: newAgency.trim() || 'Odisha Police Specialised Wing',
      category: newCategory,
      status: 'ONLINE',
      pingMs: Math.floor(Math.random() * 20) + 12,
      lastSync: 'Just now',
      description: newDesc.trim() || 'Custom integrated law enforcement portal link and secure data gateway.',
      badge: 'Custom Integration',
      directUrl: newUrl.trim() || 'https://odishapolice.gov.in',
      protocol: 'Secure API Bridge Active',
      stats: { label: 'Integration Status', value: 'Connected' }
    };

    setPortals([newPortal, ...portals]);
    setShowAddModal(false);
    setNewCode('');
    setNewName('');
    setNewAgency('');
    setNewUrl('');
    setNewDesc('');
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-[1520px] mx-auto pb-24 font-sans select-none text-text">
      {/* Header */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-xs dark:shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#B88922]/15 border border-[#B88922]/40 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
            <img src="/siris.png" alt="Odisha Police" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#D1A33A] bg-[#B88922]/15 px-2 py-0.5 rounded border border-[#B88922]/30">
                GOVT OF ODISHA · LAW ENFORCEMENT HIGHWAY
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {portals.length} PORTALS CONNECTED
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-mono text-text dark:text-[#F8FAFC] tracking-tight">
              National & State Police Portals Gateway
            </h1>
            <p className="text-xs text-text-dim dark:text-[#94A3B8] font-mono mt-0.5">
              Secure Central Intelligence, CCTNS 2.0, ICJS, NAFIS, and Specialized Crime Database Interconnects
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#0B0F17] font-mono text-xs font-bold hover:brightness-110 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Connect Custom Portal</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 font-mono text-xs">
          {['ALL', 'CORE_JUSTICE', 'FORENSICS', 'CYBER', 'EMERGENCY', 'VEHICLE', 'STATE_CUSTOM'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap font-bold ${
                activeCategory === cat
                  ? 'bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#0B0F17]'
                  : 'bg-surface-2 dark:bg-[#0E1422] text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] border border-border-soft dark:border-[#1E293B]'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search portal name, agency, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] placeholder:text-text-dim dark:placeholder:text-[#64748B] focus:outline-none focus:border-accent font-mono"
          />
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim dark:text-[#64748B]" />
        </div>
      </div>

      {/* Portals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPortals.map((portal) => (
          <div
            key={portal.id}
            onClick={() => setSelectedPortal(portal)}
            className="p-4 rounded-xl bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] hover:border-accent/60 dark:hover:border-[#38BDF8]/60 transition-all cursor-pointer flex flex-col justify-between space-y-3.5 group shadow-xs hover:shadow-lg"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-bold text-accent dark:text-[#38BDF8] px-2 py-0.5 rounded bg-accent/10 dark:bg-[#38BDF8]/10 border border-accent/30 dark:border-[#38BDF8]/30">
                  {portal.code}
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {portal.pingMs}ms
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-text dark:text-[#F8FAFC] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors font-mono">
                  {portal.name}
                </h3>
                <p className="text-[11px] text-text-dim dark:text-[#64748B] font-mono mt-0.5">
                  {portal.agency}
                </p>
              </div>

              <p className="text-xs text-text-dim dark:text-[#94A3B8] leading-relaxed line-clamp-3">
                {portal.description}
              </p>
            </div>

            <div className="pt-3 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between text-xs font-mono">
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
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Portal Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-surface dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-accent dark:text-[#38BDF8]" />
                <h3 className="text-base font-bold text-text dark:text-[#F8FAFC] font-mono">
                  Connect Additional Law Enforcement Portal
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-dim hover:text-text font-mono text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPortal} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-text-dim mb-1 font-bold">Portal Code / Acronym (e.g. C-DAT, NCRP, E-FORENSICS)</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. C-DAT"
                  className="w-full p-2 bg-surface-2 dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] rounded text-text dark:text-[#F8FAFC] focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-text-dim mb-1 font-bold">Portal Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Cyber Data Analytics & Tracking System"
                  className="w-full p-2 bg-surface-2 dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] rounded text-text dark:text-[#F8FAFC] focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-text-dim mb-1 font-bold">Agency / Department</label>
                <input
                  type="text"
                  value={newAgency}
                  onChange={(e) => setNewAgency(e.target.value)}
                  placeholder="e.g. Crime Branch CID Odisha"
                  className="w-full p-2 bg-surface-2 dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] rounded text-text dark:text-[#F8FAFC] focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-text-dim mb-1 font-bold">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full p-2 bg-surface-2 dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] rounded text-text dark:text-[#F8FAFC] focus:outline-none focus:border-accent"
                >
                  <option value="CORE_JUSTICE">CORE JUSTICE</option>
                  <option value="FORENSICS">FORENSICS</option>
                  <option value="CYBER">CYBER CRIME</option>
                  <option value="EMERGENCY">EMERGENCY & FLEET</option>
                  <option value="VEHICLE">VEHICLE & TRANSPORT</option>
                  <option value="STATE_CUSTOM">STATE / CUSTOM WING</option>
                </select>
              </div>

              <div>
                <label className="block text-text-dim mb-1 font-bold">Official Portal URL</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 bg-surface-2 dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] rounded text-text dark:text-[#F8FAFC] focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-text-dim mb-1 font-bold">Description / Interconnect Purpose</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="Explain the statutory or forensic function of this portal..."
                  className="w-full p-2 bg-surface-2 dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] rounded text-text dark:text-[#F8FAFC] focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-2 dark:bg-[#131B2E] text-text-dim font-bold border border-border-soft dark:border-[#1E293B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#0B0F17] font-bold hover:brightness-110"
                >
                  Connect Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
