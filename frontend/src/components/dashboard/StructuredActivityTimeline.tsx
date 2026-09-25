import React from 'react';
import {
  FileText, ShieldCheck, Database, KeyRound,
  GitCommit, Clock, CheckCircle2, AlertCircle, Fingerprint
} from 'lucide-react';

interface ActivityEvent {
  id: string;
  time: string;
  type: 'FIR_CREATED' | 'EVIDENCE_SECURED' | 'ENTITY_ANALYSIS' | 'REQUEST_LOGGED' | 'GRAPH_SYNC';
  title: string;
  details: string;
  actor: string;
  status: 'SUCCESS' | 'WARNING' | 'INFO';
}

const EVENTS: ActivityEvent[] = [
  {
    id: 'act-01',
    time: '23:42:10',
    type: 'GRAPH_SYNC',
    title: 'Cross-Station Syndicate Link Identified',
    details: '14 suspect & vehicle records linked with neighboring jurisdiction database.',
    actor: 'Investigation Pipeline',
    status: 'SUCCESS',
  },
  {
    id: 'act-02',
    time: '23:15:02',
    type: 'EVIDENCE_SECURED',
    title: 'Forensic Video Recorded in Evidence Locker',
    details: 'CCTV footage CCTV-2026-BBSR-01 (1.4 GB) sealed with verification hash.',
    actor: 'IO SI Ranjan Samal',
    status: 'SUCCESS',
  },
  {
    id: 'act-03',
    time: '22:48:30',
    type: 'REQUEST_LOGGED',
    title: 'Section 91 CrPC Access Request Transmitted',
    details: 'Inter-station access request REQ-2026-004 sent to Chauliaganj PS.',
    actor: 'IO SI Ranjan Samal',
    status: 'INFO',
  },
  {
    id: 'act-04',
    time: '21:30:15',
    type: 'ENTITY_ANALYSIS',
    title: 'Case Entity Extraction Completed',
    details: '3 Accused, 2 Phone Numbers, 1 Vehicle extracted for investigator review.',
    actor: 'Automated FIR Parser',
    status: 'SUCCESS',
  },
  {
    id: 'act-05',
    time: '20:10:00',
    type: 'FIR_CREATED',
    title: 'Statutory FIR Registered: FIR-2026-BBSR-001',
    details: 'Registered under BNS Sections 303(2), 318(4) at Khandagiri Police Station.',
    actor: 'Duty Officer ASI P. K. Nayak',
    status: 'SUCCESS',
  },
];

export function StructuredActivityTimeline() {
  const getIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'GRAPH_SYNC':
        return <GitCommit size={13} className="text-purple-500" />;
      case 'EVIDENCE_SECURED':
        return <Fingerprint size={13} className="text-emerald-500" />;
      case 'REQUEST_LOGGED':
        return <KeyRound size={13} className="text-amber-500" />;
      case 'ENTITY_ANALYSIS':
        return <Database size={13} className="text-accent dark:text-[#38BDF8]" />;
      case 'FIR_CREATED':
        return <FileText size={13} className="text-blue-500" />;
    }
  };

  return (
    <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 flex flex-col justify-between shadow-xs dark:shadow-2xl font-sans select-none h-full transition-colors">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-[#1E293B] mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-text dark:text-[#F8FAFC]">
              INVESTIGATION ACTIVITY &amp; AUDIT TIMELINE
            </h2>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
            STATION AUDIT STREAM
          </span>
        </div>

        {/* Chronological Stream */}
        <div className="space-y-3 font-mono">
          {EVENTS.map((event) => (
            <div
              key={event.id}
              className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B]/70 hover:border-accent/40 dark:hover:border-[#38BDF8]/40 transition-all flex items-start gap-2.5 group"
            >
              <div className="w-7 h-7 rounded-md bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(event.type)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 flex-wrap mb-0.5">
                  <span className="text-xs font-bold text-text dark:text-[#F8FAFC] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors">
                    {event.title}
                  </span>
                  <span className="text-[10px] text-text-dim dark:text-[#64748B] flex items-center gap-1">
                    <Clock size={10} />
                    {event.time}
                  </span>
                </div>

                <p className="text-[11px] font-sans text-text-dim dark:text-[#94A3B8] line-clamp-1 mb-1">
                  {event.details}
                </p>

                <div className="flex items-center justify-between text-[9px] text-text-dim dark:text-[#64748B]">
                  <span>By: <strong className="text-text dark:text-[#E2E8F0]">{event.actor}</strong></span>
                  <span className="bg-surface dark:bg-[#070A0F] px-1.5 py-0.2 rounded border border-border-soft dark:border-[#1E293B] text-emerald-600 dark:text-emerald-400 font-bold">
                    RECORDED
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 mt-3 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between font-mono text-[11px] text-text-dim dark:text-[#94A3B8]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>Evidence Integrity Status: Verified</span>
        </div>
        <span>Recent Events Logged</span>
      </div>
    </div>
  );
}
