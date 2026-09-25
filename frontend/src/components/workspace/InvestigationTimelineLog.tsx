import React, { useState } from 'react';
import { Clock, Plus, CheckCircle2, FileText, Send, ShieldAlert, AlertTriangle, Activity, User, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../../services/api/client';

export interface TimelineLogEntry {
  id: string;
  timestamp: string;
  officer: string;
  action: string;
  details: string;
  category: 'REGISTRATION' | 'EVIDENCE' | 'INTEL_TRIGGER' | 'CROSS_STATION' | 'FIELD_ACTION' | 'NOTE';
}

interface InvestigationTimelineLogProps {
  caseId: string;
  firNumber?: string;
  initialEvents?: Array<{
    id: string;
    event_type: string;
    description: string;
    event_date: string;
    officer_reference?: string;
  }>;
}

export function InvestigationTimelineLog({ caseId, firNumber, initialEvents }: InvestigationTimelineLogProps) {
  const mapDbEventToEntry = (e: any): TimelineLogEntry => {
    let cat: TimelineLogEntry['category'] = 'NOTE';
    const typeStr = (e.event_type || '').toUpperCase();
    if (typeStr.includes('FIR') || typeStr.includes('REGISTER')) cat = 'REGISTRATION';
    else if (typeStr.includes('EVIDENCE')) cat = 'EVIDENCE';
    else if (typeStr.includes('INTEL') || typeStr.includes('CORRELATION') || typeStr.includes('TRIGGER')) cat = 'INTEL_TRIGGER';
    else if (typeStr.includes('CROSS') || typeStr.includes('STATION')) cat = 'CROSS_STATION';
    else if (typeStr.includes('ARREST') || typeStr.includes('SEARCH') || typeStr.includes('STATEMENT') || typeStr.includes('FIELD')) cat = 'FIELD_ACTION';

    return {
      id: e.id || `LOG-${Math.random().toString().slice(-4)}`,
      timestamp: e.event_date || `${new Date().toLocaleDateString('en-GB')} IST`,
      officer: e.officer_reference || 'Investigating Officer',
      action: e.event_type ? e.event_type.replace(/_/g, ' ') : 'Investigation Event',
      details: e.description || '',
      category: cat
    };
  };

  const defaultSeedEvents: TimelineLogEntry[] = [
    {
      id: 'LOG-01',
      timestamp: '2026-08-20 03:15 IST',
      officer: 'Duty Officer (Khandagiri PS)',
      action: 'FIR Registration & Initial Scene Dispatch',
      details: `Registered FIR ${firNumber || ''} under Bharatiya Nyaya Sanhita (BNS). Patrol team dispatched to location.`,
      category: 'REGISTRATION'
    },
    {
      id: 'LOG-02',
      timestamp: '2026-08-20 04:45 IST',
      officer: 'SI Sanjukta Behera',
      action: 'CCTV Footage Recovery & DVR Seizure',
      details: 'Retrieved 16-channel DVR from adjacent commercial complex. Cryptographic SHA-256 seal logged in evidence vault.',
      category: 'EVIDENCE'
    },
    {
      id: 'LOG-03',
      timestamp: '2026-08-20 06:30 IST',
      officer: 'Cyber Cell Officer',
      action: 'Tower Dump & Telecom Extraction',
      details: 'Extracted telecom logs and filtered midnight call bursts matching target timeline.',
      category: 'INTEL_TRIGGER'
    },
    {
      id: 'LOG-04',
      timestamp: '2026-08-20 08:15 IST',
      officer: 'S.I.R.I.S. Central Intelligence Engine',
      action: 'Cross-Station Syndicate Correlation Detected',
      details: 'Identified similarity match with linked jurisdiction dossiers in Cloud Neo4j Aura.',
      category: 'CROSS_STATION'
    }
  ];

  const [entries, setEntries] = useState<TimelineLogEntry[]>(() => {
    if (initialEvents && initialEvents.length > 0) {
      return initialEvents.map(mapDbEventToEntry);
    }
    return defaultSeedEvents;
  });

  // Sync if initialEvents load later
  React.useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      setEntries(initialEvents.map(mapDbEventToEntry));
    }
  }, [initialEvents]);

  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const noteText = newNote.trim();
    setIsSaving(true);

    const newEntry: TimelineLogEntry = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} IST`,
      officer: 'Investigating Officer (You)',
      action: 'Case Diary Entry / Field Investigation Note',
      details: noteText,
      category: 'NOTE'
    };

    // Optimistically update UI
    setEntries(prev => [newEntry, ...prev]);
    setNewNote('');
    setAdding(false);

    // Persist to PostgreSQL via FastAPI
    try {
      await fetch(`${API_BASE_URL}/workspace/case/${encodeURIComponent(caseId)}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: noteText,
          event_type: 'STATEMENT_RECORDED',
          officer_reference: 'Investigating Officer'
        })
      });
    } catch (err) {
      console.warn('Persist event note notice:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryBadge = (cat: TimelineLogEntry['category']) => {
    switch (cat) {
      case 'REGISTRATION':
        return 'bg-brand/15 text-brand border-brand/30';
      case 'EVIDENCE':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'INTEL_TRIGGER':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'CROSS_STATION':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'FIELD_ACTION':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-surface-2 text-text-dim border-border-soft';
    }
  };

  return (
    <div className="glass p-6 rounded-2xl bg-surface border border-border-soft space-y-4 font-sans select-none shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-soft pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand/15 text-brand border border-brand/30">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-text flex items-center gap-2">
              REAL-TIME INVESTIGATION TIMELINE &amp; ACTION LOG
            </h3>
            <p className="text-[11px] text-text-dim">
              Chronological audit trail of investigative milestones and officer case notes
            </p>
          </div>
        </div>

        <button
          onClick={() => setAdding(!adding)}
          className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-hover border border-border-soft text-text text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={13} className="text-brand" /> Add Case Diary Note
        </button>
      </div>

      {/* Add Note Form */}
      {adding && (
        <form onSubmit={handleAddNote} className="p-3.5 bg-surface-2 rounded-xl border border-border-soft space-y-2.5 animate-in fade-in">
          <label className="text-[10px] font-bold font-mono uppercase text-text-dim">
            New Case Diary Action Note
          </label>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Record witness statements, seizure details, or field investigation actions…"
            rows={2}
            className="w-full bg-surface border border-border-soft rounded-lg p-2.5 text-xs font-mono text-text outline-none focus:border-brand resize-none placeholder:text-text-faint"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-3 py-1 rounded-lg text-xs font-mono text-text-dim hover:text-text bg-surface border border-border-soft cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newNote.trim()}
              className="px-3.5 py-1 rounded-lg text-xs font-mono font-bold text-bg bg-brand hover:bg-brand-bright transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
            >
              <Send size={11} /> Save Log Entry
            </button>
          </div>
        </form>
      )}

      {/* Timeline Stream */}
      <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-border-soft/60 pl-2">
        {entries.map((entry) => (
          <div key={entry.id} className="relative pl-6 space-y-1">
            {/* Dot marker */}
            <div className="absolute -left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-brand border-2 border-surface" />

            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded border ${getCategoryBadge(entry.category)}`}>
                {entry.category}
              </span>
              <span className="text-xs font-bold font-mono text-text">
                {entry.action}
              </span>
              <span className="text-[10px] font-mono text-text-faint ml-auto">
                {entry.timestamp}
              </span>
            </div>

            <p className="text-xs text-text-dim leading-relaxed font-mono">
              {entry.details}
            </p>

            <div className="text-[10px] font-mono text-text-faint flex items-center gap-1 pt-0.5">
              <User size={10} /> <span>Logged by: {entry.officer}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
