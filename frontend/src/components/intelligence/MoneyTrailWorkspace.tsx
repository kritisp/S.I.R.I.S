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
    <div className="space-y-6 font-sans select-none animate-fade-in">
      {/* Header Bar & CSV Upload Dropzone */}
      <div className="glass p-6 rounded-2xl bg-surface border border-border-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold bg-danger/10 text-danger-bright px-2.5 py-0.5 rounded border border-danger/30 uppercase flex items-center gap-1">
              <CreditCard size={12} /> AML FINANCIAL CRIME ENGINE
            </span>
            <span className="text-[10px] font-mono text-brand font-bold">
              {customTxns ? 'CUSTOM CASE FILE ACTIVE' : 'ILLUSTRATIVE DEMO DATA'}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-mono text-text">Money-Flow Trail & Mule Network Detector</h2>
          <p className="text-xs text-text-dim mt-1">
            Topological role detection (Source → Mule → Collector → Controller → Cash-out) · Hop-by-hop AML transaction tracing
          </p>
        </div>

        {/* CSV Upload & Reset Buttons */}
        <div className="flex items-center gap-3">
          {customTxns && (
            <button
              onClick={handleResetDemo}
              className="px-3.5 py-2 rounded-xl bg-surface-2 border border-border text-xs font-mono font-bold text-text-dim hover:text-text transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> RESET DEMO
            </button>
          )}

          <label className="px-4 py-2 rounded-xl bg-brand text-bg font-mono font-bold text-xs hover:bg-brand-bright transition-colors cursor-pointer flex items-center gap-2 shadow-sm">
            <Upload size={14} />
            <span>UPLOAD CASE STATEMENT CSV</span>
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger-bright text-xs font-mono flex items-center gap-2">
          <AlertTriangle size={15} /> {uploadError}
        </div>
      )}

      {/* Top KPI Telemetry Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass p-4 rounded-xl bg-surface border border-border-soft space-y-1">
          <div className="text-[10px] font-mono text-text-dim uppercase">Transactions Analyzed</div>
          <div className="text-2xl font-bold font-mono text-text">{report.summary.txns}</div>
        </div>
        <div className="glass p-4 rounded-xl bg-surface border border-border-soft space-y-1">
          <div className="text-[10px] font-mono text-text-dim uppercase">Pass-Through Mules</div>
          <div className="text-2xl font-bold font-mono text-purple-400">{report.summary.mules}</div>
        </div>
        <div className="glass p-4 rounded-xl bg-surface border border-border-soft space-y-1">
          <div className="text-[10px] font-mono text-text-dim uppercase">Collector Hubs</div>
          <div className="text-2xl font-bold font-mono text-amber-400">{report.summary.collectors}</div>
        </div>
        <div className="glass p-4 rounded-xl bg-surface border border-border-soft space-y-1">
          <div className="text-[10px] font-mono text-text-dim uppercase">Controllers</div>
          <div className="text-2xl font-bold font-mono text-danger-bright">{report.summary.controllers}</div>
        </div>
        <div className="glass p-4 rounded-xl bg-surface border border-border-soft space-y-1">
          <div className="text-[10px] font-mono text-text-dim uppercase">Total Cash-Out Volume</div>
          <div className="text-2xl font-bold font-mono text-success">{formatINR(report.summary.flow_total)}</div>
        </div>
      </div>

      {/* Money Flow Funnel Stages */}
      <div className="glass p-6 rounded-2xl bg-surface border border-border-soft space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand font-mono border-b border-border-soft pb-2">
          Hop-by-Hop Money Laundering Topology Funnel
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {report.flow.map((stage, idx) => (
            <div key={stage.stage} className="p-4 rounded-xl bg-surface-2 border border-border-soft space-y-2 relative">
              <div className="text-[10px] font-mono font-bold text-text-dim uppercase flex justify-between">
                <span>{stage.stage}</span>
                <span className="text-brand">STEP #{idx + 1}</span>
              </div>

              <div className="text-lg font-bold font-mono text-text">{formatINR(stage.value)}</div>
              <div className="text-[11px] text-text-dim font-mono">{stage.count} account(s) · {stage.sub}</div>

              {idx < report.flow.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-surface border border-border rounded-full p-1 text-text-dim">
                  <ArrowRight size={12} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AML Typology Flag Cards */}
      <div className="glass p-6 rounded-2xl bg-surface border border-border-soft space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-dim font-mono border-b border-border-soft pb-2">
          Detected Financial Crime Typologies (AML Flags)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.typologies.map(t => (
            <div key={t.key} className="p-3.5 rounded-xl bg-surface-2 border border-border-soft space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-danger-bright">{t.name}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-danger/20 text-danger-bright border border-danger/30">
                  {t.count} FLAGGED
                </span>
              </div>
              <p className="text-[11px] text-text-dim">{t.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Account Priority Table */}
      <div className="glass p-6 rounded-2xl bg-surface border border-border-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text font-mono">
            Flagged Financial Accounts & Topological Roles
          </h3>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-2 border border-border-soft text-xs">
            {['ALL', 'controller', 'collector', 'mule', 'cashout'].map(r => (
              <button
                key={r}
                onClick={() => setSelectedRoleFilter(r)}
                className={`px-3 py-1 rounded-lg font-mono font-bold uppercase transition-all ${
                  selectedRoleFilter === r ? 'bg-surface text-brand shadow-sm' : 'text-text-dim hover:text-text'
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
              <tr className="border-b border-border-soft text-text-dim font-mono text-[10px] uppercase">
                <th className="pb-3">Account / VPA</th>
                <th className="pb-3">Topological Role</th>
                <th className="pb-3">Risk Score</th>
                <th className="pb-3">Received</th>
                <th className="pb-3">Forwarded %</th>
                <th className="pb-3">Detection Rationale</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft/60">
              {filteredAccounts.map(acct => (
                <tr key={acct.account} className="hover:bg-surface-hover transition-colors font-mono">
                  <td className="py-3 font-bold text-text">{acct.account}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      acct.role === 'controller' ? 'bg-danger/20 text-danger-bright border-danger/40' :
                      acct.role === 'collector' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      acct.role === 'cashout' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    }`}>
                      {acct.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="font-bold text-brand">{acct.risk} / 100</span>
                  </td>
                  <td className="py-3 text-text font-bold">{formatINR(acct.in_total)}</td>
                  <td className="py-3 text-text-dim">{acct.forwarded_pct}%</td>
                  <td className="py-3 text-text-dim font-sans text-[11px] max-w-xs truncate">
                    {acct.reasons[0] || 'Pass-through velocity'}
                  </td>
                  <td className="py-3 text-right font-sans">
                    <button
                      onClick={() => {
                        const tr = report.traces.find(t => t.seed === acct.account || t.hops.some(h => h.from === acct.account || h.to === acct.account));
                        if (tr) setSelectedTrace(tr);
                        else alert(`No extended onward trace path recorded for ${acct.account}`);
                      }}
                      className="px-3 py-1 rounded-lg bg-surface-2 border border-border text-text hover:text-brand font-mono font-bold text-[11px] transition-colors"
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
          <div className="bg-surface border border-border-soft rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-soft pb-3">
              <div>
                <h4 className="text-base font-bold font-mono text-text">Hop-by-Hop Money Flow Trace</h4>
                <p className="text-xs text-text-dim font-mono mt-0.5">Seed Account: {selectedTrace.seed} · {selectedTrace.hop_count} Hops Traversed</p>
              </div>
              <button
                onClick={() => setSelectedTrace(null)}
                className="px-3 py-1 rounded-lg bg-surface-2 text-text-dim hover:text-text font-mono text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {selectedTrace.hops.map((hop, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-surface-2 border border-border-soft flex items-center justify-between text-xs font-mono">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-brand font-bold">HOP #{idx + 1} · {hop.id}</div>
                    <div className="text-text font-bold">{hop.from} → <span className="text-danger-bright">{hop.to}</span> ({hop.to_role.toUpperCase()})</div>
                    <div className="text-[10px] text-text-dim">{hop.date} · Channel: {hop.channel || 'IMPS'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-success">{formatINR(hop.amount)}</div>
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
