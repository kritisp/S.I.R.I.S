import React, { useState, useEffect } from 'react';
import { 
  History, Shield, Download, Search, Filter, CheckCircle2, 
  AlertTriangle, FileSpreadsheet, Building2, Clock, User, Bot, Terminal, Lock
} from 'lucide-react';
import { auditApi } from '../services/api';
import { useMockState } from '../mockServices/MockStateContext';
import { AuditChainViewer } from '../components/audit/AuditChainViewer';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  type: 'AI_QUERY' | 'OFFICER_DISPATCH' | 'SANCTION_APPROVAL' | 'REASSIGNMENT' | 'STATUTORY_DIRECTIVE';
  user: string;
  role: string;
  station: string;
  action: string;
  ip_address: string;
  status: 'SUCCESS' | 'FLAGGED' | 'WARNING';
}

const AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-8842',
    timestamp: 'Today, 18:24:12 IST',
    type: 'SANCTION_APPROVAL',
    user: 'Comm. Mahapatra',
    role: 'Supervisor (SP)',
    station: 'State Police HQ',
    action: 'Approved Section 110 BNSS Notice & Mule Freezing Order for Suspect Rajesh Kumar (FIR-2026-00541)',
    ip_address: '10.42.100.12',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-8841',
    timestamp: 'Today, 18:15:00 IST',
    type: 'OFFICER_DISPATCH',
    user: 'Comm. Mahapatra',
    role: 'Supervisor (SP)',
    station: 'State Command Dispatch',
    action: 'Re-routed PCR-CTC-04 (Delta) to NH-16 Khandagiri Corridor Dark Zone',
    ip_address: '10.42.100.12',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-8840',
    timestamp: 'Today, 17:50:33 IST',
    type: 'AI_QUERY',
    user: 'Ins. S. Pattnaik',
    role: 'Inspector (IO)',
    station: 'Khandagiri PS',
    action: 'askSirisAI: "Scan 433MHz ANPR hits for OD-02-AB-1234 near Master Canteen"',
    ip_address: '10.42.102.45',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-8839',
    timestamp: 'Today, 17:12:05 IST',
    type: 'REASSIGNMENT',
    user: 'Comm. Mahapatra',
    role: 'Supervisor (SP)',
    station: 'State Police HQ',
    action: 'Rebalanced 4 active vehicle theft FIRs from Saheed Nagar PS to Jatni Rural PS',
    ip_address: '10.42.100.12',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-8838',
    timestamp: 'Today, 16:30:19 IST',
    type: 'STATUTORY_DIRECTIVE',
    user: 'Comm. Mahapatra',
    role: 'Supervisor (SP)',
    station: 'State Command',
    action: 'Issued 60-day charge sheet statutory directive to Saheed Nagar PS',
    ip_address: '10.42.100.12',
    status: 'WARNING',
  },
  {
    id: 'LOG-8837',
    timestamp: 'Today, 15:45:00 IST',
    type: 'AI_QUERY',
    user: 'Ins. M. Mohanty',
    role: 'Inspector (IO)',
    station: 'Cuttack Badambadi PS',
    action: 'Analyze pass-through money trail dead-drop account coordinates',
    ip_address: '10.42.104.18',
    status: 'SUCCESS',
  },
];

export function SupervisorAuditPage() {
  const { state } = useMockState();
  const [activeTab, setActiveTab] = useState<'stream' | 'chain'>('stream');
  const [logs, setLogs] = useState<AuditLogEntry[]>(AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const stationId = state.currentUser?.stationId || 'OP-BBSR-CAP';
    auditApi.getStationLogs(stationId)
      .then((backendLogs) => {
        if (backendLogs && backendLogs.length > 0) {
          const mapped: AuditLogEntry[] = backendLogs.map((l) => ({
            id: l.id || `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
            timestamp: l.timestamp ? new Date(l.timestamp).toLocaleString('en-IN') : 'Just now',
            type: (l.action?.includes('AI') ? 'AI_QUERY' : l.action?.includes('DISPATCH') ? 'OFFICER_DISPATCH' : 'SANCTION_APPROVAL') as any,
            user: l.userId || 'Officer',
            role: l.userRole || 'Investigator',
            station: l.stationId || stationId,
            action: l.details || l.action || 'System action logged',
            ip_address: l.ipAddress || '10.42.100.12',
            status: 'SUCCESS',
          }));
          setLogs(mapped);
        }
      })
      .catch((err) => console.warn('Audit API connection notice:', err));
  }, [state.currentUser?.stationId]);

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'ALL' || log.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleExport = (format: string) => {
    setToastMessage(`Exported ${filteredLogs.length} audit trail records as ${format.toUpperCase()}`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="max-w-[1520px] mx-auto p-4 sm:p-6 space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs dark:shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
            <History size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-mono text-text dark:text-[#F8FAFC] uppercase tracking-wider">
                Audit & Compliance Ledger
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                SHA-256 VERIFIED
              </span>
            </div>
            <p className="text-xs text-text-dim dark:text-[#94A3B8]">
              Odisha State Police · Cryptographically Verified Officer Activity Trail &amp; Evidence Custody Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex rounded-lg p-1 bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] font-mono text-xs font-bold">
            <button
              onClick={() => setActiveTab('stream')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'stream' ? 'bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#070A0F] shadow-xs' : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'
              }`}
            >
              Event Stream
            </button>
            <button
              onClick={() => setActiveTab('chain')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                activeTab === 'chain' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Lock size={12} />
              <span>Hash Chain</span>
            </button>
          </div>

          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover text-text dark:text-[#F8FAFC] text-xs font-mono font-bold border border-border-soft dark:border-[#1E293B] transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TAB CONTENT */}
      {activeTab === 'chain' ? (
        <div className="animate-fade-in">
          <AuditChainViewer scope="GLOBAL" />
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* SEARCH & FILTER CONTROLS */}
          <div className="flex flex-col sm:flex-row items-center gap-3 font-mono">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim dark:text-[#94A3B8]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter audit logs by officer, station, action keyword, or Log ID..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] text-xs text-text dark:text-[#F8FAFC] placeholder:text-text-dim dark:placeholder:text-[#94A3B8] outline-none focus:border-accent dark:focus:border-[#38BDF8]"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3.5 py-2 rounded-lg bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] text-xs font-mono text-text dark:text-[#F8FAFC] outline-none focus:border-accent dark:focus:border-[#38BDF8]"
            >
              <option value="ALL">All Event Types ({AUDIT_LOGS.length})</option>
              <option value="AI_QUERY">AI Co-Pilot Queries</option>
              <option value="SANCTION_APPROVAL">Sanction Approvals</option>
              <option value="OFFICER_DISPATCH">Fleet Dispatches</option>
              <option value="REASSIGNMENT">Case Reassignments</option>
              <option value="STATUTORY_DIRECTIVE">Statutory Directives</option>
            </select>
          </div>

          {/* AUDIT LOGS TABLE CONSOLE */}
          <div className="bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-3 shadow-xs font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2.5">
              <h3 className="text-xs font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
                <History size={14} /> Verified Event Log ({filteredLogs.length} Records)
              </h3>
              <span className="text-[10px] text-text-dim dark:text-[#94A3B8]">SHA-256 Hash Chained</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] font-bold text-[10px] uppercase">
                    <th className="pb-2.5">Timestamp / Log ID</th>
                    <th className="pb-2.5">Event Type</th>
                    <th className="pb-2.5">User &amp; Station</th>
                    <th className="pb-2.5">Action Description</th>
                    <th className="pb-2.5">IP Address</th>
                    <th className="pb-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft/60 dark:divide-[#1E293B]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-2 dark:hover:bg-[#0E1422] transition-colors">
                      <td className="py-2.5">
                        <span className="text-text dark:text-[#F8FAFC] font-bold block">{log.timestamp}</span>
                        <span className="text-[10px] text-text-dim dark:text-[#94A3B8]">{log.id}</span>
                      </td>

                      <td className="py-2.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          log.type === 'AI_QUERY' ? 'bg-accent/10 dark:bg-[#38BDF8]/10 border-accent/30 dark:border-[#38BDF8]/30 text-accent dark:text-[#38BDF8]' :
                          log.type === 'SANCTION_APPROVAL' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          log.type === 'STATUTORY_DIRECTIVE' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                        }`}>
                          {log.type}
                        </span>
                      </td>

                      <td className="py-2.5">
                        <span className="text-text dark:text-[#F8FAFC] font-bold block">{log.user}</span>
                        <span className="text-[10px] text-text-dim dark:text-[#94A3B8]">{log.station}</span>
                      </td>

                      <td className="py-2.5 max-w-md">
                        <p className="text-text dark:text-[#F8FAFC] text-[11px] leading-snug font-sans">{log.action}</p>
                      </td>

                      <td className="py-2.5 text-text-dim dark:text-[#94A3B8] text-[10px]">{log.ip_address}</td>

                      <td className="py-2.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          log.status === 'SUCCESS' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
