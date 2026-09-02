import React, { useState } from 'react';
import {
  Scale, BookOpen, Search,
  FileCheck, CheckCircle2, Gavel,
  Copy, Check, X, ArrowUpRight, ShieldAlert,
  Lock, Unlock, Car, Zap,
  Crosshair, Binary, FlaskConical, Target, HeartHandshake
} from 'lucide-react';

const STATUTES_DATA = [
  {
    id: 'ipc-379',
    actCode: 'IPC',
    actName: 'Indian Penal Code, 1860 / Bharatiya Nyaya Sanhita, 2023',
    section: '379',
    bnsSection: 'BNS § 303(2)',
    title: 'Punishment for Theft & Motor Vehicle Larceny',
    crimeHead: 'Crimes Against Property',
    crimeSubHead: 'Vehicle Theft & Larceny',
    theme: {
      accent: 'from-blue-600 to-indigo-700',
      badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      borderHover: 'hover:border-blue-500/40',
      glow: 'group-hover:shadow-blue-500/10',
      illustration: 'car'
    },
    gravity: 'Non-Heinous',
    bailable: false,
    cognizable: true,
    compoundable: false,
    triableBy: 'Magistrate of First Class (JMFC)',
    maxPunishment: 'Imprisonment up to 3 years, or fine, or both',
    avgConvictionRate: 68,
    totalCasesActive: 1420,
    arrestGuideline: 'Section 41A CrPC / Sec 35 BNSS Notice mandatory unless recorded flight risk or repeat habitual offender.',
    essentialIngredients: [
      'Dishonest intention to take movable property out of possession.',
      'Property taken without the lawful possessor’s consent.',
      'Actual moving of the property in order to effect such taking.',
      'Ownership or lawful possession established via RC / Invoice.'
    ],
    investigationChecklist: [
      'Seizure Panchanama (Mahazar) under Sec 100 CrPC / 105 BNSS at recovery locus.',
      'Vehicle Chassis & Engine number verification via VAHAN database.',
      'CCTV / ANPR trajectory footage extraction & Sec 65B IEA / 63 BSA certificate.',
      'Statement of complainant & eyewitnesses under Sec 161 CrPC / 180 BNSS.'
    ],
    landmarkPrecedent: 'State of Odisha v. Ramesh Sahoo (2024) — Transfer of physical possession constitutes theft even if temporary.'
  },
  {
    id: 'ipc-392',
    actCode: 'IPC',
    actName: 'Indian Penal Code, 1860 / Bharatiya Nyaya Sanhita, 2023',
    section: '392',
    bnsSection: 'BNS § 309(4)',
    title: 'Punishment for Robbery & Highway Dacoity',
    crimeHead: 'Crimes Against Property',
    crimeSubHead: 'Armed Robbery & Highway Heist',
    theme: {
      accent: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      borderHover: 'hover:border-amber-500/40',
      glow: 'group-hover:shadow-amber-500/10',
      illustration: 'robbery'
    },
    gravity: 'Heinous',
    bailable: false,
    cognizable: true,
    compoundable: false,
    triableBy: 'Court of Session / Magistrate First Class',
    maxPunishment: 'Rigorous imprisonment up to 10 years and fine; highway robbery up to 14 years',
    avgConvictionRate: 74,
    totalCasesActive: 890,
    arrestGuideline: 'Immediate arrest under Sec 41(1) CrPC. Mandatory custodial interrogation for recovery of weapon and looted property.',
    essentialIngredients: [
      'Theft or extortion with wrongful restraint or fear of instant death/hurt.',
      'Force or threat applied for committing theft or carrying away stolen goods.',
      'Active participation of offender with overt aggressive act.'
    ],
    investigationChecklist: [
      'Scene of Crime examination with Forensic Fingerprint Expert.',
      'Test Identification Parade (TIP) of suspects before Judicial Magistrate.',
      'Recovery of stolen property / weapon under Sec 27 Evidence Act / Sec 23 BSA.',
      'Call Detail Records (CDR) & Tower dump analysis for gang movement.'
    ],
    landmarkPrecedent: 'Dasarathi Jena v. State of Odisha (2022) — Identification in TIP is substantive corroborative evidence.'
  },
  {
    id: 'ipc-302',
    actCode: 'IPC',
    actName: 'Indian Penal Code, 1860 / Bharatiya Nyaya Sanhita, 2023',
    section: '302',
    bnsSection: 'BNS § 103(1)',
    title: 'Punishment for Murder & First-Degree Homicide',
    crimeHead: 'Crimes Against Body',
    crimeSubHead: 'Homicide & Murder',
    theme: {
      accent: 'from-rose-600 to-red-700',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      borderHover: 'hover:border-rose-500/40',
      glow: 'group-hover:shadow-rose-500/10',
      illustration: 'murder'
    },
    gravity: 'Heinous',
    bailable: false,
    cognizable: true,
    compoundable: false,
    triableBy: 'Court of Session Exclusively',
    maxPunishment: 'Death penalty or imprisonment for life, and liability to fine',
    avgConvictionRate: 81,
    totalCasesActive: 310,
    arrestGuideline: 'Immediate non-bailable arrest. Bail exclusively in High Court or Supreme Court on exceptional merits.',
    essentialIngredients: [
      'Death of a human being caused by the act of the accused.',
      'Act done with intention of causing death or bodily injury sufficient to cause death.',
      'Knowledge that act is so imminently dangerous that it must cause death.'
    ],
    investigationChecklist: [
      'Inquest Panchanama (Sec 174 CrPC / 194 BNSS) and Post-Mortem Request to Govt Forensic Surgeon.',
      'Seizure of crime weapon, blood-stained clothes, and earth sample with FSL seal.',
      'DNA profiling & chain of custody preservation for blood spatter.',
      'Dying declaration recording before Executive Magistrate if victim was conscious.'
    ],
    landmarkPrecedent: 'State of Odisha v. Balaram Naik (2023) — "Rarest of Rare" doctrine for capital punishment.'
  },
  {
    id: 'ipc-307',
    actCode: 'IPC',
    actName: 'Indian Penal Code, 1860 / Bharatiya Nyaya Sanhita, 2023',
    section: '307',
    bnsSection: 'BNS § 109(1)',
    title: 'Attempt to Murder & Grievous Assault with Deadly Weapon',
    crimeHead: 'Crimes Against Body',
    crimeSubHead: 'Assault & Grievous Hurt',
    theme: {
      accent: 'from-orange-600 to-amber-700',
      badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      borderHover: 'hover:border-orange-500/40',
      glow: 'group-hover:shadow-orange-500/10',
      illustration: 'assault'
    },
    gravity: 'Heinous',
    bailable: false,
    cognizable: true,
    compoundable: false,
    triableBy: 'Court of Session',
    maxPunishment: 'Imprisonment up to 10 years and fine; if hurt caused, imprisonment for life',
    avgConvictionRate: 71,
    totalCasesActive: 460,
    arrestGuideline: 'Immediate custodial arrest. Weapon recovery under Sec 27 Evidence Act critical for conviction.',
    essentialIngredients: [
      'Act done with intention or knowledge that if death had occurred, it would be murder.',
      'Execution of act goes beyond mere preparation and reaches attempt stage.',
      'Causation of bodily injury or dangerous weapon usage.'
    ],
    investigationChecklist: [
      'Wound Certificate with Medico-Legal Opinion on Nature of Injury (Grievous vs Simple).',
      'Recovery and seizure of sharp-edged/blunt weapon with blood stains.',
      'FSL examination of biological stains on weapon and clothing.',
      'Eyewitness identification and electronic surveillance corroboration.'
    ],
    landmarkPrecedent: 'Prakash Chandra v. State of Odisha (2021) — Bodily injury not mandatory; intention and capability suffice.'
  },
  {
    id: 'it-66d',
    actCode: 'ITACT',
    actName: 'Information Technology Act, 2000 (Amended 2008)',
    section: '66D',
    bnsSection: 'IT Act § 66D',
    title: 'Cheating by Personation Using Computer Resource & Digital Phishing',
    crimeHead: 'Cyber & Economic Crimes',
    crimeSubHead: 'Financial Fraud & Digital Phishing',
    theme: {
      accent: 'from-cyan-600 to-teal-700',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      borderHover: 'hover:border-cyan-500/40',
      glow: 'group-hover:shadow-cyan-500/10',
      illustration: 'cyber'
    },
    gravity: 'Non-Heinous',
    bailable: true,
    cognizable: true,
    compoundable: false,
    triableBy: 'Magistrate of First Class / Special Cyber Court',
    maxPunishment: 'Imprisonment up to 3 years and fine up to 1 lakh rupees',
    avgConvictionRate: 59,
    totalCasesActive: 620,
    arrestGuideline: 'Notice under Section 41A CrPC applicable. Immediate lien / freezing of beneficiary bank accounts under Sec 102 CrPC.',
    essentialIngredients: [
      'Cheating by personating another person or entity.',
      'Usage of computer resource, mobile communication device, or network endpoint.',
      'Inducement causing financial or reputational loss to victim.'
    ],
    investigationChecklist: [
      '1930 Cyber Helpline & CFCFRMS portal beneficiary lien freeze.',
      'IPDR / CDR logs requisition from ISPs and Telecom operators.',
      'Bank Account KYC, beneficiary trails, and ATM CCTV extraction.',
      'Certificate under Section 65B Indian Evidence Act / Section 63 BSA.'
    ],
    landmarkPrecedent: 'Subhashree v. State of Odisha (2023) — Strict procedural safeguards for digital evidence admissibility.'
  },
  {
    id: 'ndps-20b',
    actCode: 'NDPS',
    actName: 'Narcotic Drugs and Psychotropic Substances Act, 1985',
    section: '20B',
    bnsSection: 'NDPS Act § 20(b)',
    title: 'Contravention in Relation to Cannabis & Synthetic Contraband',
    crimeHead: 'Narcotics & Contraband',
    crimeSubHead: 'Commercial Drug Trafficking',
    theme: {
      accent: 'from-emerald-600 to-teal-700',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      borderHover: 'hover:border-emerald-500/40',
      glow: 'group-hover:shadow-emerald-500/10',
      illustration: 'narcotics'
    },
    gravity: 'Heinous',
    bailable: false,
    cognizable: true,
    compoundable: false,
    triableBy: 'Special NDPS Court / Sessions Court',
    maxPunishment: 'Commercial: Rigorous imprisonment 10 to 20 years, fine 1 to 2 lakh rupees',
    avgConvictionRate: 86,
    totalCasesActive: 280,
    arrestGuideline: 'Strict non-bailable bar under Section 37 NDPS for commercial quantity. Strict compliance with Sec 42 & 50 search mandates.',
    essentialIngredients: [
      'Unlawful possession, transportation, sale, or trafficking of contraband.',
      'Weight quantification into Small vs Commercial Quantity.',
      'Conscious possession established beyond reasonable doubt.'
    ],
    investigationChecklist: [
      'Compliance with Section 50 NDPS: Notice to suspect offering search before Gazetted Officer.',
      'Field Drug Detection Kit (FDDK) primary positive chemical test.',
      'Sampling & Sealing with brass seal in presence of independent panch witnesses.',
      'Inventory Certification before Judicial Magistrate under Section 52A NDPS within 24 hours.'
    ],
    landmarkPrecedent: 'State of Odisha v. Gagan Behera (2024) — Strict compliance with Section 50 search mandate is mandatory.'
  },
  {
    id: 'arms-25',
    actCode: 'ARMS',
    actName: 'The Arms Act, 1959 (Amended 2019)',
    section: '25',
    bnsSection: 'Arms Act § 25(1B)',
    title: 'Possession & Trafficking of Unlicensed Firearms',
    crimeHead: 'Violent Crime & Gangs',
    crimeSubHead: 'Armed Gang & Illegal Weaponry',
    theme: {
      accent: 'from-slate-700 to-zinc-900',
      badgeBg: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
      borderHover: 'hover:border-slate-500/40',
      glow: 'group-hover:shadow-slate-500/10',
      illustration: 'arms'
    },
    gravity: 'Heinous',
    bailable: false,
    cognizable: true,
    compoundable: false,
    triableBy: 'Court of Session / Magistrate First Class',
    maxPunishment: 'Imprisonment 7 years extending to life imprisonment, and fine',
    avgConvictionRate: 79,
    totalCasesActive: 195,
    arrestGuideline: 'Immediate non-bailable arrest. Interrogation for illicit arms supply chain and interstate procurement.',
    essentialIngredients: [
      'Acquisition, possession, or carrying of prohibited arms without license.',
      'Manufacture, conversion, or sale of illicit country-made firearms.',
      'Proof of functioning firing mechanism via Ballistic Expert report.'
    ],
    investigationChecklist: [
      'Recovery Panchanama recording serial numbers and proof of make.',
      'Dispatch of weapon and fired cartridge cases to Forensic Ballistics Division.',
      'Sanction for Prosecution from District Magistrate under Section 39 Arms Act.',
      'Interstate arms trafficking nexus interrogation.'
    ],
    landmarkPrecedent: 'Paras Ram v. State (1992) Supp (1) SCC 671 — Possession must be conscious and physical for Section 25.'
  },
  {
    id: 'pocso-4',
    actCode: 'POCSO',
    actName: 'Protection of Children from Sexual Offences Act, 2012',
    section: '4',
    bnsSection: 'POCSO § 4 / BNS § 65',
    title: 'Punishment for Penetrative Sexual Assault on Minor',
    crimeHead: 'Child & Women Safety',
    crimeSubHead: 'Special POCSO Offenses',
    theme: {
      accent: 'from-purple-600 to-pink-700',
      badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      borderHover: 'hover:border-purple-500/40',
      glow: 'group-hover:shadow-purple-500/10',
      illustration: 'pocso'
    },
    gravity: 'Heinous',
    bailable: false,
    cognizable: true,
    compoundable: false,
    triableBy: 'Special POCSO Court / Sessions Court',
    maxPunishment: 'Rigorous imprisonment 20 years extending to life imprisonment, and fine',
    avgConvictionRate: 89,
    totalCasesActive: 140,
    arrestGuideline: 'Immediate non-bailable arrest. Statutory presumption of guilt under Section 29 & 30 POCSO Act.',
    essentialIngredients: [
      'Victim verified to be child below 18 years of age.',
      'Penetrative sexual act committed without lawful consent.',
      'Age proof established via School Admission Register or Birth Certificate.'
    ],
    investigationChecklist: [
      'Medical examination of child victim within 24 hours under Sec 164A CrPC / Sec 27 POCSO.',
      'Statement recording before Judicial Magistrate under Section 164 CrPC / 183 BNSS.',
      'Child Welfare Committee (CWC) immediate notification and child-friendly counseling.',
      'Charge-sheet filing strictly within 60 days of FIR registration.'
    ],
    landmarkPrecedent: 'Independent Thought v. Union of India (2017) 10 SCC 800 — Strict child protection principles apply universally.'
  }
];

const ACT_FILTERS = [
  { id: 'all', label: 'All Statutes' },
  { id: 'IPC', label: 'IPC / BNS' },
  { id: 'NDPS', label: 'NDPS Act' },
  { id: 'ITACT', label: 'Cyber IT' },
  { id: 'ARMS', label: 'Arms Act' },
  { id: 'POCSO', label: 'POCSO' }
];

const BAIL_FILTERS = [
  { id: 'all', label: 'All Bail Statuses' },
  { id: 'non-bailable', label: 'Non-Bailable' },
  { id: 'bailable', label: 'Bailable' },
  { id: 'heinous', label: 'Heinous Offenses' }
];

function StatuteIllustration({ type }: { type: string }) {
  switch (type) {
    case 'car':
      return (
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
          <Car className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
        </div>
      );
    case 'robbery':
      return (
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
          <ShieldAlert className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
        </div>
      );
    case 'murder':
      return (
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
          <Target className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
        </div>
      );
    case 'assault':
      return (
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 shadow-inner">
          <Zap className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-500" />
        </div>
      );
    case 'cyber':
      return (
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
          <Binary className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        </div>
      );
    case 'narcotics':
      return (
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
          <FlaskConical className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
      );
    case 'arms':
      return (
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500/20 to-zinc-500/20 border border-slate-500/30 flex items-center justify-center text-slate-300 shrink-0 shadow-inner">
          <Crosshair className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-slate-500" />
        </div>
      );
    case 'pocso':
      return (
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
          <HeartHandshake className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-500" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border-soft flex items-center justify-center text-text shrink-0">
          <Scale className="w-5 h-5" />
        </div>
      );
  }
}

export function LegalIntelligence() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAct, setSelectedAct] = useState('all');
  const [selectedBailFilter, setSelectedBailFilter] = useState('all');
  const [activeStatuteModal, setActiveStatuteModal] = useState<typeof STATUTES_DATA[0] | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyCitation = (statute: typeof STATUTES_DATA[0]) => {
    const text = `${statute.actCode} § ${statute.section} (${statute.bnsSection}) - ${statute.title} [${statute.actName}]`;
    navigator.clipboard.writeText(text);
    setCopiedKey(statute.section);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredStatutes = STATUTES_DATA.filter(s => {
    const matchesSearch = s.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.bnsSection.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.crimeSubHead.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.crimeHead.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.actCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAct = selectedAct === 'all' || s.actCode === selectedAct;
    
    let matchesBail = true;
    if (selectedBailFilter === 'non-bailable') matchesBail = !s.bailable;
    if (selectedBailFilter === 'bailable') matchesBail = s.bailable;
    if (selectedBailFilter === 'heinous') matchesBail = s.gravity === 'Heinous';

    return matchesSearch && matchesAct && matchesBail;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-fade-in p-4 md:p-6">
      {/* ─── COMMAND HEADER WITH STATS ─── */}
      <div className="glass rounded-2xl p-5 border border-border-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-text tracking-tight">
                  Odisha Police Statutory Acts & Legal Repository
                </h1>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
                  IPC ↔ BNS Dual Ref
                </span>
              </div>
              <p className="text-xs text-text-dim mt-0.5 font-medium">
                Investigative Checklists · Bail Classifications · Judicial Precedents Matrix
              </p>
            </div>
          </div>

          {/* Metric Summary Badges */}
          <div className="flex items-center gap-2 text-xs flex-wrap font-mono">
            <span className="px-3 py-1 rounded-xl bg-surface-2 text-text font-semibold border border-border-soft">
              <span className="font-bold text-brand">{STATUTES_DATA.length}</span> Active Sections
            </span>
            <span className="px-3 py-1 rounded-xl bg-error/10 text-error border border-error/20 font-semibold">
              <span className="font-bold">{STATUTES_DATA.filter(s => !s.bailable).length}</span> Non-Bailable
            </span>
          </div>
        </div>

        {/* Search Bar & Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-border-soft font-mono">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search section (e.g. 379, 302, 66D), crime head, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-surface-2 border border-border-soft text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-dim hover:text-text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedBailFilter}
              onChange={(e) => setSelectedBailFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-border-soft text-xs font-semibold text-text focus:outline-none cursor-pointer"
            >
              {BAIL_FILTERS.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono">
          {ACT_FILTERS.map((act) => {
            const isActive = selectedAct === act.id;
            return (
              <button
                key={act.id}
                onClick={() => setSelectedAct(act.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-brand text-white shadow-sm font-bold'
                    : 'bg-surface-2 text-text-dim hover:text-text hover:bg-surface-hover border border-border-soft'
                }`}
              >
                {act.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── CARDS GRID ─── */}
      {filteredStatutes.length === 0 ? (
        <div className="glass p-8 rounded-2xl text-center space-y-3 border border-border-soft">
          <Gavel className="w-8 h-8 text-text-dim mx-auto" />
          <p className="text-xs font-bold text-text">No matching statutory sections found</p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedAct('all'); setSelectedBailFilter('all'); }}
            className="px-4 py-1.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStatutes.map((item, idx) => (
            <div
              key={idx}
              className={`group glass rounded-2xl p-5 border border-border-soft ${item.theme.borderHover} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden`}
            >
              <div className="space-y-3.5 relative z-10">
                {/* Card Top Row: Illustration Emblem + Codes + Bail */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <StatuteIllustration type={item.theme.illustration} />
                    <div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-xs font-black text-text">
                          {item.actCode} § {item.section}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-2 text-brand border border-border-soft">
                          {item.bnsSection}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono font-medium text-text-dim mt-0.5">
                        {item.gravity}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 uppercase ${
                    item.bailable 
                      ? 'bg-success/10 text-success border border-success/20' 
                      : 'bg-error/10 text-error border border-error/20'
                  }`}>
                    {item.bailable ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>{item.bailable ? 'Bailable' : 'Non-Bailable'}</span>
                  </span>
                </div>

                {/* Offense Title */}
                <div>
                  <h2 className="text-sm font-bold text-text leading-snug line-clamp-2 group-hover:text-brand transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-xs text-text-dim line-clamp-1 mt-1 font-medium">
                    {item.crimeHead} · {item.crimeSubHead}
                  </p>
                </div>

                {/* Penalty Matrix Pill */}
                <div className="bg-surface-2/70 rounded-xl p-3 space-y-1.5 border border-border-soft text-xs font-mono">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-text-dim uppercase tracking-wider">Statutory Penalty</span>
                    <span className="font-semibold text-brand truncate max-w-[170px]">{item.triableBy.split('/')[0]}</span>
                  </div>
                  <p className="text-text font-bold text-xs leading-relaxed">
                    {item.maxPunishment}
                  </p>
                </div>

                {/* Conviction Benchmark & Case Count */}
                <div className="space-y-1.5 font-mono text-xs pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Empirical Conviction Rate</span>
                    <span className="font-bold text-text">{item.avgConvictionRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.avgConvictionRate >= 75 ? 'bg-success' : item.avgConvictionRate >= 65 ? 'bg-brand' : 'bg-warning'
                      }`}
                      style={{ width: `${item.avgConvictionRate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-dim pt-1">
                    <span>Active Cases Under Investigation</span>
                    <span className="font-bold text-text">{item.totalCasesActive} Cases</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 mt-3 border-t border-border-soft grid grid-cols-2 gap-3.5 relative z-10 font-mono">
                <button
                  onClick={() => handleCopyCitation(item)}
                  className="py-2 px-3 rounded-xl bg-surface-2 hover:bg-surface-hover text-text text-xs font-semibold flex items-center justify-center gap-1.5 border border-border-soft transition active:scale-95"
                >
                  {copiedKey === item.section ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span className="text-success font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-text-dim" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActiveStatuteModal(item)}
                  className="py-2 px-3 rounded-xl bg-slate-950 text-white hover:bg-brand text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md active:scale-95"
                >
                  <span>Legal Guide</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── LEGAL GUIDE MODAL ─── */}
      {activeStatuteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-4xl w-full rounded-2xl border border-border-soft p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveStatuteModal(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-surface-2 text-text-dim hover:text-text"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 border-b border-border-soft pb-4">
              <div className="flex items-center gap-2 font-mono flex-wrap">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
                  {activeStatuteModal.actCode} § {activeStatuteModal.section}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-surface-2 text-text border border-border-soft">
                  {activeStatuteModal.bnsSection}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase ${
                  activeStatuteModal.bailable 
                    ? 'bg-success/10 text-success border border-success/20' 
                    : 'bg-error/10 text-error border border-error/20'
                }`}>
                  {activeStatuteModal.bailable ? 'Bailable' : 'Non-Bailable'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-text">
                {activeStatuteModal.title}
              </h3>
              <p className="text-xs text-text-dim font-mono">
                {activeStatuteModal.actName}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-surface-2/70 border border-border-soft space-y-1.5 text-xs">
                  <p className="font-mono font-bold text-brand uppercase text-[10px] flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Arrest & BNSS Procedure Rules
                  </p>
                  <p className="text-text-dim leading-relaxed text-xs">
                    {activeStatuteModal.arrestGuideline}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 space-y-1.5 text-xs">
                  <p className="font-mono font-bold text-warning uppercase text-[10px] flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Landmark Judicial Precedent
                  </p>
                  <p className="text-text font-medium text-xs leading-relaxed">
                    {activeStatuteModal.landmarkPrecedent}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-border-soft text-xs space-y-1 font-mono">
                  <p className="text-[10px] uppercase font-bold text-text-dim">Statutory Penalty Limit</p>
                  <p className="font-bold text-text">{activeStatuteModal.maxPunishment}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Essential Ingredients of Offense
                  </h4>
                  <div className="space-y-1.5">
                    {activeStatuteModal.essentialIngredients.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl bg-surface border border-border-soft text-xs text-text">
                        <span className="w-4 h-4 rounded-full bg-success/10 text-success flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-brand" />
                    Investigation Checklist for IOs
                  </h4>
                  <div className="space-y-1.5">
                    {activeStatuteModal.investigationChecklist.map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl bg-brand/5 text-xs text-text border border-brand/10">
                        <span className="text-brand font-bold text-xs mt-0.5">✓</span>
                        <span className="leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-soft flex justify-between items-center font-mono">
              <button
                onClick={() => handleCopyCitation(activeStatuteModal)}
                className="px-4 py-2 rounded-xl bg-surface-2 text-text text-xs font-semibold hover:bg-surface-hover transition flex items-center gap-2 border border-border-soft"
              >
                <Copy className="w-4 h-4 text-text-dim" />
                <span>Copy Citation</span>
              </button>

              <button
                onClick={() => setActiveStatuteModal(null)}
                className="px-5 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover transition shadow-md"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
