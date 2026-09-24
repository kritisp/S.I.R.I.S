import React, { useState, useMemo } from 'react';
import { 
  CreditCard, Upload, Download, ArrowRight, ShieldAlert, AlertTriangle, 
  CheckCircle2, RefreshCw, Layers, Activity, Search, Filter, HelpCircle, FileText
} from 'lucide-react';
import { 
  analyzeTransactions, parseCSVTransactions, DEMO_TRANSACTIONS, 
  Transaction, MoneyTrailReport, formatINR, AccountAnalysis, MoneyFlowTrace
} from '../../services/moneyTrailService';

export function MoneyTrailWorkspace() {
  const [customTxns, setCustomTxns] = useState<Transaction[] | null>(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedTrace, setSelectedTrace] = useState<MoneyFlowTrace | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Compute active Money Trail report
  const report: MoneyTrailReport = useMemo(() => {
    return analyzeTransactions(customTxns || DEMO_TRANSACTIONS);
  }, [customTxns]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSVTransactions(text);
        if (parsed.length === 0) {
          setUploadError('Invalid CSV format. Header requires date, from, to, amount columns.');
        } else {
          setCustomTxns(parsed);
        }
      } catch (err) {
        setUploadError('Could not parse transaction CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    setCustomTxns(null);
    setUploadError(null);
    setSelectedTrace(null);
  };

  const filteredAccounts = useMemo(() => {
    if (selectedRoleFilter === 'ALL') return report.accounts;
    return report.accounts.filter(a => a.role === selectedRoleFilter);
  }, [report.accounts, selectedRoleFilter]);

  return (
    <div className="max-w-[1520px] mx-auto space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      {/* ── UNIFIED COMMAND-CENTER HEADER ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-accent dark:text-[#38BDF8]">
                  AML FINANCIAL CRIME ENGINE
                </span>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {customTxns ? 'CUSTOM CASE STATEMENT ACTIVE' : 'ILLUSTRATIVE AML TOPOLOGY'}
                </span>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8]">
                  MULE NETWORK DETECTOR
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-text dark:text-[#F8FAFC] mt-0.5">
                Money-Flow Trail & Mule Network Workspace
              </h1>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2">
            {customTxns && (
              <button
                onClick={handleResetDemo}
                className="px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs font-mono font-bold text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] transition-colors flex items-center gap-1.5 cursor-pointer uppercase"
              >
                <RefreshCw size={13} /> RESET
              </button>
            )}

            <label className="px-3.5 py-1.5 rounded-lg bg-accent text-bg dark:bg-[#38BDF8] dark:text-[#070A0F] font-mono font-bold text-xs hover:bg-accent-bright dark:hover:bg-[#0284C7] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs uppercase">
              <Upload size={13} />
              <span>UPLOAD CSV</span>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertTriangle size={15} /> {uploadError}
        </div>
      )}

      {/* Top KPI Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs dark:shadow-2xl">
          <div className="text-[10px] font-mono uppercase font-bold text-text-dim dark:text-[#94A3B8]">Transactions Analyzed</div>
          <div className="text-2xl font-bold font-mono text-text dark:text-[#F8FAFC] mt-1">{report.summary.txns}</div>
          <div className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8] mt-0.5">Authoritative Ledger</div>
        </div>
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs dark:shadow-2xl">
          <div className="text-[10px] font-mono uppercase font-bold text-text-dim dark:text-[#94A3B8]">Pass-Through Mules</div>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-1">{report.summary.mules}</div>
          <div className="text-[10px] font-mono text-purple-400/80 mt-0.5">Velocity Layer</div>
        </div>
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs dark:shadow-2xl">
          <div className="text-[10px] font-mono uppercase font-bold text-text-dim dark:text-[#94A3B8]">Collector Hubs</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{report.summary.collectors}</div>
          <div className="text-[10px] font-mono text-amber-400/80 mt-0.5">Aggregation Nodes</div>
        </div>
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs dark:shadow-2xl">
          <div className="text-[10px] font-mono uppercase font-bold text-text-dim dark:text-[#94A3B8]">Controllers</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{report.summary.controllers}</div>
          <div className="text-[10px] font-mono text-rose-400/80 mt-0.5">Syndicate Master</div>
        </div>
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs dark:shadow-2xl">
          <div className="text-[10px] font-mono uppercase font-bold text-text-dim dark:text-[#94A3B8]">Total Cash-Out Volume</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{formatINR(report.summary.flow_total)}</div>
          <div className="text-[10px] font-mono text-emerald-400/80 mt-0.5">Liquidity Exfiltrated</div>
        </div>
      </div>

      {/* Money Flow Funnel Stages */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs dark:shadow-2xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-accent dark:text-[#38BDF8] font-mono border-b border-border-soft dark:border-[#1E293B] pb-2 flex items-center justify-between">
          <span>Hop-by-Hop Money Laundering Topology Funnel</span>
          <span className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">TOPOLOGICAL STAGES</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {report.flow.map((stage, idx) => (
            <div key={stage.stage} className="p-3.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] space-y-1.5 relative">
              <div className="text-[10px] font-mono font-bold text-text-dim dark:text-[#94A3B8] uppercase flex justify-between">
                <span>{stage.stage}</span>
                <span className="text-accent dark:text-[#38BDF8]">STEP #{idx + 1}</span>
              </div>

              <div className="text-base font-bold font-mono text-text dark:text-[#F8FAFC]">{formatINR(stage.value)}</div>
              <div className="text-[10px] text-text-dim dark:text-[#94A3B8] font-mono">{stage.count} account(s) · {stage.sub}</div>

              {idx < report.flow.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-full p-1 text-text-dim dark:text-[#94A3B8]">
                  <ArrowRight size={12} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AML Typology Flag Cards */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs dark:shadow-2xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-dim dark:text-[#94A3B8] font-mono border-b border-border-soft dark:border-[#1E293B] pb-2">
          Detected Financial Crime Typologies (AML Flags)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {report.typologies.map(t => (
            <div key={t.key} className="p-3.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-rose-400">{t.name}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {t.count} FLAGGED
                </span>
              </div>
              <p className="text-[11px] text-text-dim dark:text-[#94A3B8]">{t.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Account Priority Table */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text dark:text-[#F8FAFC] font-mono">
            Flagged Financial Accounts & Topological Roles
          </h3>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs font-mono">
            {['ALL', 'controller', 'collector', 'mule', 'cashout'].map(r => (
              <button
                key={r}
                onClick={() => setSelectedRoleFilter(r)}
                className={`px-3 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                  selectedRoleFilter === r ? 'bg-surface dark:bg-[#0B0F17] text-accent dark:text-[#38BDF8] shadow-xs border border-border-soft dark:border-[#1E293B]' : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] font-mono text-[10px] uppercase">
                <th className="pb-2.5">Account / VPA</th>
                <th className="pb-2.5">Topological Role</th>
                <th className="pb-2.5">Risk Score</th>
                <th className="pb-2.5">Received</th>
                <th className="pb-2.5">Forwarded %</th>
                <th className="pb-2.5">Detection Rationale</th>
                <th className="pb-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft/60 dark:divide-[#1E293B]">
              {filteredAccounts.map(acct => (
                <tr key={acct.account} className="hover:bg-surface-hover dark:hover:bg-[#151D2E] transition-colors font-mono">
                  <td className="py-2.5 font-bold text-text dark:text-[#F8FAFC]">{acct.account}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      acct.role === 'controller' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                      acct.role === 'collector' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      acct.role === 'cashout' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    }`}>
                      {acct.role}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="font-bold text-accent dark:text-[#38BDF8]">{acct.risk} / 100</span>
                  </td>
                  <td className="py-2.5 text-text dark:text-[#F8FAFC] font-bold">{formatINR(acct.in_total)}</td>
                  <td className="py-2.5 text-text-dim dark:text-[#94A3B8]">{acct.forwarded_pct}%</td>
                  <td className="py-2.5 text-text-dim dark:text-[#94A3B8] font-sans text-[11px] max-w-xs truncate">
                    {acct.reasons[0] || 'Pass-through velocity'}
                  </td>
                  <td className="py-2.5 text-right font-sans">
                    <button
                      onClick={() => {
                        const tr = report.traces.find(t => t.seed === acct.account || t.hops.some(h => h.from === acct.account || h.to === acct.account));
                        if (tr) setSelectedTrace(tr);
                        else alert(`No extended onward trace path recorded for ${acct.account}`);
                      }}
                      className="px-3 py-1 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] hover:text-accent dark:hover:text-[#38BDF8] font-mono font-bold text-[11px] transition-colors cursor-pointer uppercase"
                    >
                      TRACE FLOW →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hop-by-Hop Trace Drawer Modal */}
      {selectedTrace && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl max-w-3xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-3">
              <div>
                <h4 className="text-sm font-bold font-mono text-text dark:text-[#F8FAFC]">Hop-by-Hop Money Flow Trace</h4>
                <p className="text-[11px] text-text-dim dark:text-[#94A3B8] font-mono mt-0.5">Seed Account: {selectedTrace.seed} · {selectedTrace.hop_count} Hops Traversed</p>
              </div>
              <button
                onClick={() => setSelectedTrace(null)}
                className="px-3 py-1 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] font-mono text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {selectedTrace.hops.map((hop, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] flex items-center justify-between text-xs font-mono">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-accent dark:text-[#38BDF8] font-bold">HOP #{idx + 1} · {hop.id}</div>
                    <div className="text-text dark:text-[#F8FAFC] font-bold">{hop.from} → <span className="text-rose-400">{hop.to}</span> ({hop.to_role.toUpperCase()})</div>
                    <div className="text-[10px] text-text-dim dark:text-[#94A3B8]">{hop.date} · Channel: {hop.channel || 'IMPS'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">{formatINR(hop.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
