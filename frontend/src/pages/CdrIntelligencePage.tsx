import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PhoneCall, Upload, RefreshCw, FileSpreadsheet, ShieldAlert, CheckCircle, XCircle, 
  Clock, PhoneIncoming, PhoneOutgoing, PhoneMissed, Search, UserCheck, AlertTriangle, 
  Share2, Network, Calendar, Filter, ArrowUpRight, Zap, Check, Eye, HelpCircle, Layers, CreditCard, Car
} from 'lucide-react';
import { 
  cdrEngine, CdrRecord, CdrOverviewStats, PhoneIntelligence, TopContact, 
  CommunicationPatternLead, IncidentCorrelationResult, DEMO_CDR_DATASET 
} from '../services/cdrIntelligenceService';
import { explainableIntelStore, VerificationDecision } from '../services/explainableIntelService';

export function CdrIntelligencePage() {
  const navigate = useNavigate();

  // State
  const [records, setRecords] = useState<CdrRecord[]>(cdrEngine.getRecords());
  const [isUserUploaded, setIsUserUploaded] = useState<boolean>(false);
  const [selectedPhone, setSelectedPhone] = useState<string>('+919876543210');
  const [selectedFir, setSelectedFir] = useState<string>('CR-KHD-2026-0142');
  const [windowMinutes, setWindowMinutes] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<'timeline' | 'leads' | 'network'>('timeline');

  // Filters
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Calculated Telemetry (Computed Dynamically from Dataset)
  const overviewStats: CdrOverviewStats = cdrEngine.getOverviewStats();
  const phoneIntel: PhoneIntelligence = cdrEngine.getPhoneIntelligence(selectedPhone);
  const topContacts: TopContact[] = cdrEngine.getTopContacts(selectedPhone, 5);
  const patternLeads: CommunicationPatternLead[] = cdrEngine.detectCommunicationLeads(selectedPhone);
  const incidentResult: IncidentCorrelationResult = cdrEngine.getIncidentCorrelation(selectedFir, windowMinutes);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-subscribe to Explainable Intel Store for decision updates
  const [, setStoreTick] = useState<number>(0);
  useEffect(() => {
    return explainableIntelStore.subscribe(() => setStoreTick(prev => prev + 1));
  }, []);

  // ── CSV Upload Handler ──────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length <= 1) return;

        const parsed: CdrRecord[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 5) {
            parsed.push({
              id: `CSV-${i}`,
              timestamp: cols[0] || new Date().toISOString().slice(0, 19).replace('T', ' '),
              caller: cols[1],
              receiver: cols[2],
              duration_seconds: parseInt(cols[3], 10) || 0,
              call_type: (cols[4]?.toUpperCase() === 'INCOMING' ? 'INCOMING' : cols[4]?.toUpperCase() === 'MISSED' ? 'MISSED' : 'OUTGOING') as any,
              tower_id: cols[5] || 'TOWER-LOCAL-01',
              imei: cols[6] || '358291048201948',
              imsi: cols[7] || '404450192830192'
            });
          }
        }

        if (parsed.length > 0) {
          cdrEngine.loadRecords(parsed);
          setRecords(cdrEngine.getRecords());
          setIsUserUploaded(true);
          if (parsed[0].caller) setSelectedPhone(parsed[0].caller);
        }
      } catch (err) {
        console.error('[CDR Parser] Error reading CSV:', err);
      }
    };
    reader.readAsText(file);
  };

  // Reset to Demo Dataset
  const handleResetDemo = () => {
    cdrEngine.loadRecords(DEMO_CDR_DATASET);
    setRecords(cdrEngine.getRecords());
    setIsUserUploaded(false);
    setSelectedPhone('+919876543210');
  };

  // Download Sample CSV Template
  const handleDownloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "timestamp,caller,receiver,duration_seconds,call_type,tower_id,imei\n" +
      "2026-08-18 18:05:12,+919876543210,+919937012345,95,OUTGOING,TOWER-BBSR-KHANDAGIRI-01,864201049281042\n" +
      "2026-08-18 18:29:40,+919937012345,+919876543210,35,INCOMING,TOWER-BBSR-KHANDAGIRI-01,864201049281042\n" +
      "2026-08-18 18:44:10,+919876543210,+919437188200,180,OUTGOING,TOWER-BBSR-PALASUNI-05,864201049281042\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "siris_sample_cdr_format.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Decision Updates for Glass-Box Explainability
  const handleDecision = (leadId: string, decision: VerificationDecision) => {
    explainableIntelStore.updateDecision(leadId, decision, undefined, 'Comm. Mahapatra');
  };

  // Filtered Call Records
  const filteredCalls = records.filter(r => {
    const isTarget = r.caller === phoneIntel.normalizedNumber || r.receiver === phoneIntel.normalizedNumber;
    if (!isTarget) return false;

    if (typeFilter !== 'ALL' && r.call_type !== typeFilter) return false;
    if (searchFilter && !r.caller.includes(searchFilter) && !r.receiver.includes(searchFilter) && !r.timestamp.includes(searchFilter)) return false;

    return true;
  });

  return (
    <div className="max-w-[1520px] mx-auto space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      
      {/* ── 1. MODULE HEADER & DATA HONESTY BANNER ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-text dark:text-[#F8FAFC] uppercase">
                  CDR INTELLIGENCE MODULE
                </h1>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                  isUserUploaded
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-accent/15 dark:bg-[#38BDF8]/15 border-accent/30 dark:border-[#38BDF8]/30 text-accent dark:text-[#38BDF8]'
                }`}>
                  {isUserUploaded ? 'USER-PROVIDED CDR' : 'CCTNS-ALIGNED CDR TELEMETRY'}
                </span>
              </div>
              <p className="text-xs text-text-dim dark:text-[#94A3B8] font-mono mt-0.5">
                Automated communication pattern extraction, incident-window correlation, and multi-source intelligence integration
              </p>
            </div>
          </div>

          {/* Action Buttons & File Input */}
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg hover:bg-accent-bright dark:bg-[#38BDF8] dark:text-[#070A0F] dark:hover:bg-[#0284C7] font-bold text-xs transition-all shadow-xs cursor-pointer uppercase"
            >
              <Upload size={13} />
              <span>UPLOAD CDR CSV</span>
            </button>

            <button
              onClick={handleResetDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] text-xs font-bold transition-colors cursor-pointer"
              title="Reload Odisha Police Demo CDR Dataset"
            >
              <RefreshCw size={12} />
              <span>LOAD DEMO DATA</span>
            </button>

            <button
              onClick={handleDownloadSampleCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-accent dark:text-[#38BDF8] hover:bg-surface-hover text-xs font-bold transition-colors cursor-pointer"
              title="Download Sample CSV Schema"
            >
              <FileSpreadsheet size={12} />
              <span>SCHEMA CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. DYNAMIC CDR OVERVIEW STATISTIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
        <div className="bg-surface dark:bg-[#0B0F17] p-3 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs space-y-0.5">
          <span className="text-[10px] text-text-dim dark:text-[#94A3B8] font-bold uppercase tracking-wider block">TOTAL CALLS</span>
          <p className="text-xl font-bold text-accent dark:text-[#38BDF8]">{overviewStats.totalCalls}</p>
          <span className="text-[9px] text-text-dim dark:text-[#94A3B8]">Calculated from dataset</span>
        </div>

        <div className="bg-surface dark:bg-[#0B0F17] p-3 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs space-y-0.5">
          <span className="text-[10px] text-text-dim dark:text-[#94A3B8] font-bold uppercase tracking-wider block">UNIQUE NUMBERS</span>
          <p className="text-xl font-bold text-text dark:text-[#F8FAFC]">{overviewStats.uniqueNumbers}</p>
          <span className="text-[9px] text-text-dim dark:text-[#94A3B8]">{overviewStats.uniqueContacts} Contacts</span>
        </div>

        <div className="bg-surface dark:bg-[#0B0F17] p-3 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs space-y-0.5">
          <span className="text-[10px] text-text-dim dark:text-[#94A3B8] font-bold uppercase tracking-wider block">TOTAL DURATION</span>
          <p className="text-xl font-bold text-amber-400">{overviewStats.formattedDuration}</p>
          <span className="text-[9px] text-text-dim dark:text-[#94A3B8]">Cumulative talktime</span>
        </div>

        <div className="bg-surface dark:bg-[#0B0F17] p-3 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs space-y-0.5">
          <span className="text-[10px] text-text-dim dark:text-[#94A3B8] font-bold uppercase tracking-wider block">PEAK ACTIVITY</span>
          <p className="text-xl font-bold text-rose-400">{overviewStats.peakActivityPeriod}</p>
          <span className="text-[9px] text-text-dim dark:text-[#94A3B8]">Nocturnal burst</span>
        </div>

        <div className="bg-surface dark:bg-[#0B0F17] p-3 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs space-y-0.5">
          <span className="text-[10px] text-text-dim dark:text-[#94A3B8] font-bold uppercase tracking-wider block">OUTGOING</span>
          <p className="text-xl font-bold text-emerald-400 flex items-center gap-1">
            <PhoneOutgoing size={13} /> {overviewStats.outgoingCount}
          </p>
          <span className="text-[9px] text-text-dim dark:text-[#94A3B8]">Initiated calls</span>
        </div>

        <div className="bg-surface dark:bg-[#0B0F17] p-3 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs space-y-0.5">
          <span className="text-[10px] text-text-dim dark:text-[#94A3B8] font-bold uppercase tracking-wider block">INCOMING</span>
          <p className="text-xl font-bold text-sky-400 flex items-center gap-1">
            <PhoneIncoming size={13} /> {overviewStats.incomingCount}
          </p>
          <span className="text-[9px] text-text-dim dark:text-[#94A3B8]">Received calls</span>
        </div>
      </div>

      {/* ── 3. OPERATIONAL 3-COLUMN LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* ── LEFT COLUMN (4 Cols): PHONE INTELLIGENCE & CASE SELECTOR ── */}
        <div className="lg:col-span-4 space-y-4">

          {/* Search / Target Selector */}
          <div className="bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-2.5 font-mono shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
                <Search size={13} /> TARGET PHONE SEARCH
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={selectedPhone}
                onChange={(e) => setSelectedPhone(e.target.value)}
                placeholder="Search phone number (+91...)"
                className="w-full bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-text dark:text-[#F8FAFC] outline-none focus:border-accent dark:focus:border-[#38BDF8] transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <button
                onClick={() => setSelectedPhone('+919876543210')}
                className={`text-[10px] px-2 py-1 rounded-md border font-bold transition-all cursor-pointer ${
                  selectedPhone === '+919876543210' ? 'bg-accent/20 dark:bg-[#38BDF8]/20 text-accent dark:text-[#38BDF8] border-accent dark:border-[#38BDF8]' : 'bg-surface-2 dark:bg-[#0E1422] text-text-dim dark:text-[#94A3B8] border-border-soft dark:border-[#1E293B] hover:text-text dark:hover:text-[#F8FAFC]'
                }`}
              >
                +91 98765 43210 (Rajesh)
              </button>
              <button
                onClick={() => setSelectedPhone('+919937012345')}
                className={`text-[10px] px-2 py-1 rounded-md border font-bold transition-all cursor-pointer ${
                  selectedPhone === '+919937012345' ? 'bg-accent/20 dark:bg-[#38BDF8]/20 text-accent dark:text-[#38BDF8] border-accent dark:border-[#38BDF8]' : 'bg-surface-2 dark:bg-[#0E1422] text-text-dim dark:text-[#94A3B8] border-border-soft dark:border-[#1E293B] hover:text-text dark:hover:text-[#F8FAFC]'
                }`}
              >
                +91 99370 12345 (Rakesh)
              </button>
            </div>
          </div>

          {/* Phone Intelligence Resolved Profile Card */}
          <div className="bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-3 shadow-xs font-mono">
            <div className="border-b border-border-soft dark:border-[#1E293B] pb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={13} /> RESOLVED PHONE DOSSIER
              </span>
              <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                S.I.R.I.S. LINKED
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] font-bold text-base shrink-0">
                {phoneIntel.associatedPerson?.name.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-text dark:text-[#F8FAFC] truncate">{phoneIntel.associatedPerson?.name}</h3>
                {phoneIntel.associatedPerson?.alias && (
                  <p className="text-xs text-accent dark:text-[#38BDF8] font-bold">Alias: “{phoneIntel.associatedPerson.alias}”</p>
                )}
                <p className="text-[11px] text-text-dim dark:text-[#94A3B8]">{phoneIntel.associatedPerson?.role}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-text-dim dark:text-[#94A3B8]">TARGET NUMBER:</span>
                <span className="font-bold text-accent dark:text-[#38BDF8]">{phoneIntel.normalizedNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim dark:text-[#94A3B8]">LINKED VEHICLE:</span>
                <span className="font-bold text-amber-400">{phoneIntel.associatedVehicle || 'OD-02-AB-1234'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim dark:text-[#94A3B8]">PRIMARY TOWER:</span>
                <span className="font-bold text-text dark:text-[#F8FAFC] truncate max-w-[170px]">{phoneIntel.primaryTower}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim dark:text-[#94A3B8]">IMEI SENSOR:</span>
                <span className="font-bold text-text-dim dark:text-[#94A3B8]">{phoneIntel.primaryImei}</span>
              </div>
            </div>

            {/* Associated Cases */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-text-dim dark:text-[#94A3B8] uppercase tracking-wider block">ASSOCIATED CASES ({phoneIntel.associatedFirs.length})</span>
              <div className="space-y-1">
                {phoneIntel.associatedFirs.map((fir, idx) => (
                  <div 
                    key={idx}
                    onClick={() => navigate(`/cases/${fir.id}`)}
                    className="p-2 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] hover:border-accent/40 dark:hover:border-[#38BDF8]/40 flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div>
                      <span className="text-xs font-bold text-accent dark:text-[#38BDF8] group-hover:underline">{fir.firNumber}</span>
                      <p className="text-[10px] text-text-dim dark:text-[#94A3B8] truncate max-w-[180px]">{fir.title}</p>
                    </div>
                    <ArrowUpRight size={13} className="text-text-dim dark:text-[#94A3B8] group-hover:text-accent dark:group-hover:text-[#38BDF8]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-border-soft dark:border-[#1E293B]">
              <div>
                <span className="text-text-dim dark:text-[#94A3B8] block text-[9px]">TOTAL TALK TIME</span>
                <span className="font-bold text-amber-400">{phoneIntel.totalDurationFormatted}</span>
              </div>
              <div>
                <span className="text-text-dim dark:text-[#94A3B8] block text-[9px]">AVG CALL DURATION</span>
                <span className="font-bold text-text dark:text-[#F8FAFC]">{phoneIntel.averageDurationSeconds}s</span>
              </div>
              <div>
                <span className="text-text-dim dark:text-[#94A3B8] block text-[9px]">FIRST ACTIVITY</span>
                <span className="font-bold text-text-dim dark:text-[#94A3B8] text-[10px]">{phoneIntel.firstActivity}</span>
              </div>
              <div>
                <span className="text-text-dim dark:text-[#94A3B8] block text-[9px]">LAST ACTIVITY</span>
                <span className="font-bold text-text-dim dark:text-[#94A3B8] text-[10px]">{phoneIntel.lastActivity}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER COLUMN (5 Cols): INCIDENT CORRELATION & TIMELINE ── */}
        <div className="lg:col-span-5 space-y-4">

          {/* INCIDENT-WINDOW CORRELATION PANEL */}
          <div className="bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-rose-500/30 space-y-3 shadow-xs font-mono relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2">
              <div className="flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-rose-400" />
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  INCIDENT-WINDOW CORRELATION
                </span>
              </div>

              {/* Window Selector */}
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-text-dim dark:text-[#94A3B8] mr-1">WINDOW:</span>
                {[15, 30, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setWindowMinutes(mins)}
                    className={`px-2 py-0.5 rounded font-bold border transition-all cursor-pointer ${
                      windowMinutes === mins ? 'bg-rose-500 text-white border-rose-500' : 'bg-surface-2 dark:bg-[#0E1422] text-text-dim dark:text-[#94A3B8] border-border-soft dark:border-[#1E293B]'
                    }`}
                  >
                    ±{mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Case Selector Banner */}
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-400">FIR-2026-0142 (Unit IV Robbery)</span>
                <p className="text-[10px] text-text-dim dark:text-[#94A3B8] mt-0.5">Incident Time: <strong className="text-text dark:text-[#F8FAFC]">18:40 IST (18 Aug 2026)</strong></p>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                {incidentResult.callsInWindow.length} Calls in Window
              </span>
            </div>

            {/* Incident Stream Timeline */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {incidentResult.callsInWindow.map((item, idx) => (
                <div 
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                    item.offsetMinutes === 0
                      ? 'bg-rose-500/20 border-rose-500 text-white font-bold animate-pulse'
                      : item.isPreIncident
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.isPreIncident ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {item.offsetMinutes <= 0 ? `${item.offsetMinutes}m` : `+${item.offsetMinutes}m`}
                    </span>
                    <div>
                      <span className="font-bold text-text dark:text-[#F8FAFC]">{item.record.timestamp.slice(11, 16)} IST</span>
                      <p className="text-[10px] text-text-dim dark:text-[#94A3B8]">{item.record.caller === selectedPhone ? `Outgoing → ${item.contactName}` : `Incoming ← ${item.contactName}`}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-text-dim dark:text-[#94A3B8]">{item.record.duration_seconds}s ({item.record.tower_id?.split('-')[2] || 'TOWER'})</span>
                </div>
              ))}
            </div>

            {/* Analytical Lead Box */}
            <div className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">⚡ POTENTIAL COMMUNICATION CORRELATION</span>
              <p className="text-text-dim dark:text-[#94A3B8] text-[11px]">
                Target <strong className="text-text dark:text-[#F8FAFC]">{selectedPhone}</strong> communicated with <strong className="text-text dark:text-[#F8FAFC]">+91 99370 12345</strong> within ±{windowMinutes} mins of incident. <strong className="text-rose-400">NOT PROOF OF INVOLVEMENT — REQUIRES FIELD CORROBORATION.</strong>
              </p>
            </div>
          </div>

          {/* VISUAL COMMUNICATION TIMELINE */}
          <div className="bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-3 shadow-xs font-mono">
            <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2">
              <span className="text-xs font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={13} /> CHRONOLOGICAL COMMUNICATION STREAM
              </span>

              {/* Type Filter */}
              <div className="flex items-center gap-1 text-[10px]">
                {['ALL', 'INCOMING', 'OUTGOING'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      typeFilter === t ? 'bg-accent/20 dark:bg-[#38BDF8]/20 text-accent dark:text-[#38BDF8] border border-accent/40 dark:border-[#38BDF8]/40' : 'bg-surface-2 dark:bg-[#0E1422] text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {filteredCalls.map((c, idx) => {
                const isIncidentHour = c.timestamp.includes('18:4');
                return (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                      isIncidentHour
                        ? 'bg-rose-500/10 border-rose-500/40 text-text dark:text-[#F8FAFC]'
                        : 'bg-surface-2 dark:bg-[#0E1422] border-border-soft dark:border-[#1E293B] hover:border-accent/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${
                        c.call_type === 'OUTGOING' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sky-500/10 text-sky-400'
                      }`}>
                        {c.call_type === 'OUTGOING' ? <PhoneOutgoing size={12} /> : <PhoneIncoming size={12} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text dark:text-[#F8FAFC]">{c.timestamp}</span>
                          {isIncidentHour && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-bold">
                              INCIDENT WINDOW
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-text-dim dark:text-[#94A3B8]">
                          {c.caller === phoneIntel.normalizedNumber ? `To: ${c.receiver}` : `From: ${c.caller}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-amber-400 block">{c.duration_seconds}s</span>
                      <span className="text-[9px] text-text-dim dark:text-[#94A3B8]">{c.tower_id || 'Khandagiri Tower'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (3 Cols): GLASS-BOX PATTERNS & LEADS ── */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-3 shadow-xs font-mono">
            <div className="border-b border-border-soft dark:border-[#1E293B] pb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={13} /> COMMUNICATION PATTERN LEADS
              </span>
              <span className="text-[9px] bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] px-2 py-0.5 rounded border border-accent/20 dark:border-[#38BDF8]/20">
                S.I.R.I.S.
              </span>
            </div>

            <div className="space-y-2.5">
              {patternLeads.map((lead) => {
                const storeLead = explainableIntelStore.getLeads().find(l => l.id === lead.id);
                const currentDecision = storeLead?.decision || lead.decision;

                return (
                  <div key={lead.id} className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-text dark:text-[#F8FAFC] text-xs leading-snug">{lead.title}</h4>
                      <span className="px-1.5 py-0.5 rounded bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] font-bold text-[9px] shrink-0 border border-accent/20 dark:border-[#38BDF8]/20">
                        {lead.confidence}
                      </span>
                    </div>

                    {/* WHY FLAGGED */}
                    <div className="space-y-1 bg-surface dark:bg-[#0B0F17] p-2 rounded border border-border-soft dark:border-[#1E293B]">
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">WHY FLAGGED:</span>
                      <ul className="space-y-0.5 text-[10px] text-text-dim dark:text-[#94A3B8] list-disc list-inside">
                        {lead.whyFlagged.map((why, idx) => (
                          <li key={idx}>{why}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Multi-Source Correlation Badge */}
                    {lead.multiSourceCorrelation && (
                      <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] space-y-0.5">
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle size={11} /> MULTI-SOURCE INTELLIGENCE LEAD
                        </span>
                        <p className="text-text-dim dark:text-[#94A3B8] text-[9px] leading-tight">{lead.multiSourceCorrelation.summary}</p>
                      </div>
                    )}

                    {/* Officer Verification Decision Buttons */}
                    <div className="pt-1.5 border-t border-border-soft dark:border-[#1E293B] flex items-center gap-1.5">
                      <button
                        onClick={() => handleDecision(lead.id, 'CONFIRMED')}
                        className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentDecision === 'CONFIRMED'
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-surface dark:bg-[#0B0F17] text-text-dim dark:text-[#94A3B8] hover:text-emerald-400 border border-border-soft dark:border-[#1E293B]'
                        }`}
                      >
                        <Check size={11} /> CONFIRM
                      </button>

                      <button
                        onClick={() => handleDecision(lead.id, 'NEEDS_FIELD_VERIFICATION')}
                        className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentDecision === 'NEEDS_FIELD_VERIFICATION'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-surface dark:bg-[#0B0F17] text-text-dim dark:text-[#94A3B8] hover:text-amber-400 border border-border-soft dark:border-[#1E293B]'
                        }`}
                      >
                        <HelpCircle size={11} /> VERIFY
                      </button>

                      <button
                        onClick={() => handleDecision(lead.id, 'REJECTED')}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          currentDecision === 'REJECTED'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'bg-surface dark:bg-[#0B0F17] text-text-dim dark:text-[#94A3B8] hover:text-rose-400 border border-border-soft dark:border-[#1E293B]'
                        }`}
                      >
                        <XCircle size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── 4. BOTTOM ANALYTICS & COMMUNICATION NETWORK ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* TOP CONTACTS TABLE (6 Cols) */}
        <div className="lg:col-span-6 bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-3 shadow-xs font-mono">
          <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2">
            <span className="text-xs font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={13} /> TOP FREQUENT CONTACTS RANKING
            </span>
            <span className="text-[10px] text-text-dim dark:text-[#94A3B8]">Calculated from CDR Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] text-text-dim dark:text-[#94A3B8] uppercase border-b border-border-soft dark:border-[#1E293B]">
                  <th className="pb-2">RANK / CONTACT</th>
                  <th className="pb-2">CALLS</th>
                  <th className="pb-2">DURATION</th>
                  <th className="pb-2">DIRECTION</th>
                  <th className="pb-2">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft dark:divide-[#1E293B]">
                {topContacts.map((c, idx) => (
                  <tr key={idx} className="hover:bg-surface-hover/60 transition-colors">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-surface-2 dark:bg-[#0E1422] text-accent dark:text-[#38BDF8] font-bold text-[10px] flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-text dark:text-[#F8FAFC]">{c.associatedName || c.contactNumber}</span>
                          {c.associatedName && (
                            <span className="block text-[9px] text-text-dim dark:text-[#94A3B8]">{c.contactNumber}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 font-bold text-accent dark:text-[#38BDF8]">{c.callCount} calls</td>
                    <td className="py-2.5 font-bold text-amber-400">{c.formattedDuration}</td>
                    <td className="py-2.5">
                      <div className="w-20 bg-surface-2 dark:bg-[#0E1422] h-1.5 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-emerald-400 h-full" 
                          style={{ width: `${(c.outgoingCount / c.callCount) * 100}%` }}
                          title={`${c.outgoingCount} Outgoing`}
                        />
                        <div 
                          className="bg-sky-400 h-full" 
                          style={{ width: `${(c.incomingCount / c.callCount) * 100}%` }}
                          title={`${c.incomingCount} Incoming`}
                        />
                      </div>
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => setSelectedPhone(c.contactNumber)}
                        className="px-2 py-1 rounded bg-surface-2 dark:bg-[#0E1422] text-accent dark:text-[#38BDF8] hover:bg-accent/20 font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        INSPECT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* COMMUNICATION NETWORK GRAPH (6 Cols) */}
        <div className="lg:col-span-6 bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-3 shadow-xs font-mono">
          <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2">
            <span className="text-xs font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
              <Network size={13} /> INTEGRATED COMMUNICATION NETWORK GRAPH
            </span>
            <button
              onClick={() => navigate('/network')}
              className="text-[10px] text-accent dark:text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>EXPLORE IN GLOBAL GRAPH</span>
              <ArrowUpRight size={12} />
            </button>
          </div>

          {/* SVG Visual Graph Representation */}
          <div className="w-full h-64 rounded-lg bg-surface-2 dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] relative overflow-hidden flex items-center justify-center p-4">
            <svg className="w-full h-full" viewBox="0 0 500 220">
              {/* Connection Lines */}
              <line x1="80" y1="110" x2="250" y2="110" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,4" />
              <line x1="250" y1="110" x2="420" y2="60" stroke="#ef4444" strokeWidth="2" />
              <line x1="250" y1="110" x2="420" y2="160" stroke="#f59e0b" strokeWidth="2" />
              <line x1="250" y1="110" x2="250" y2="190" stroke="#10b981" strokeWidth="2" />

              {/* Node 1: Target Person */}
              <g transform="translate(80, 110)">
                <circle r="26" fill="#0B0F17" stroke="#38bdf8" strokeWidth="2" />
                <text y="-32" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold">Rajesh Kumar</text>
                <text y="4" textAnchor="middle" fill="#38bdf8" fontSize="9">+91 98765 43210</text>
              </g>

              {/* Node 2: Central CDR Link */}
              <g transform="translate(250, 110)">
                <circle r="30" fill="#0E1422" stroke="#f59e0b" strokeWidth="2" />
                <text y="-36" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">CDR Call Network</text>
                <text y="4" textAnchor="middle" fill="#94a3b8" fontSize="8">147 Records</text>
              </g>

              {/* Node 3: Co-Accused Rakesh Swain */}
              <g transform="translate(420, 60)">
                <circle r="22" fill="#0B0F17" stroke="#ef4444" strokeWidth="2" />
                <text y="-28" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="bold">Rakesh Swain</text>
                <text y="3" textAnchor="middle" fill="#fca5a5" fontSize="8">+91 99370 12345</text>
              </g>

              {/* Node 4: Mule Account Debasis */}
              <g transform="translate(420, 160)">
                <circle r="22" fill="#0B0F17" stroke="#f59e0b" strokeWidth="2" />
                <text y="-28" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="bold">Debasis Jena</text>
                <text y="3" textAnchor="middle" fill="#fde68a" fontSize="8">MULE-441</text>
              </g>

              {/* Node 5: FIR 142 */}
              <g transform="translate(250, 190)">
                <rect x="-45" y="-12" width="90" height="24" rx="6" fill="#dc2626" />
                <text y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">FIR-2026-0142</text>
              </g>
            </svg>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] flex items-center justify-between text-[10px] text-text-dim dark:text-[#94A3B8]">
            <span>✓ Linked to 3 active FIRs</span>
            <span>✓ Multi-source verified (ANPR + Money Trail)</span>
          </div>
        </div>

      </div>
    </div>
  );
}
