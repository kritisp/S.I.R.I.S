import React from 'react';
import { Link } from 'react-router-dom';
import { Network, Car, Phone, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface ForensicNexusItem {
  id: string;
  type: 'VEHICLE' | 'PHONE' | 'MODUS_OPERANDI';
  entity: string;
  stations: string[];
  cases: string[];
  similarity: number;
  description: string;
  actionUrl: string;
  actionText: string;
}

const VERIFIED_NEXUS_ITEMS: ForensicNexusItem[] = [
  {
    id: 'nex-1',
    type: 'VEHICLE',
    entity: 'Maruti Swift (OD-02-AB-1234)',
    stations: ['Khandagiri PS', 'Saheed Nagar PS'],
    cases: ['FIR-2026-BBSR-0492', 'FIR-2026-BBSR-3104'],
    similarity: 96,
    description: 'Vehicle identified in Armed Highway Robbery and Residential Burglary across 2 Commissionerate divisions.',
    actionUrl: '/network',
    actionText: 'Inspect Graph',
  },
  {
    id: 'nex-2',
    type: 'PHONE',
    entity: 'SIM / IMEI +91 98612-XXXXX',
    stations: ['Khandagiri PS', 'Cuttack Sadar PS'],
    cases: ['FIR-2026-BBSR-0492', 'FIR-2026-CTC-0112'],
    similarity: 88,
    description: 'Shared mule telecom node active in nocturnal transit corridor calls.',
    actionUrl: '/cdr',
    actionText: 'View CDR Trail',
  },
];

export function CrossStationNexusCard() {
  return (
    <div className="bg-surface border border-border-soft rounded-xl p-4 shadow-xs space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border-soft">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Network size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text">
              Cross-Station Intelligence Nexus
            </h3>
            <p className="text-[11px] text-text-dim">
              Verified multi-jurisdiction entity matches
            </p>
          </div>
        </div>

        <Link
          to="/network"
          className="text-[10px] font-mono font-bold text-brand hover:underline flex items-center gap-0.5"
        >
          <span>Knowledge Graph</span>
          <ArrowUpRight size={12} />
        </Link>
      </div>

      {/* Disclosures List */}
      <div className="space-y-2.5">
        {VERIFIED_NEXUS_ITEMS.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-lg bg-surface-2/60 border border-border-soft space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {item.type === 'VEHICLE' && <Car size={13} className="text-amber-500 shrink-0" />}
                {item.type === 'PHONE' && <Phone size={13} className="text-sky-500 shrink-0" />}
                <span className="text-xs font-bold text-text truncate font-mono">
                  {item.entity}
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                {item.similarity}% SIMILARITY
              </span>
            </div>

            <p className="text-[11px] text-text-dim leading-relaxed font-sans">
              {item.description}
            </p>

            <div className="pt-2 border-t border-border-soft flex items-center justify-between text-[10px] font-mono">
              <span className="text-text-dim truncate">
                Linked: {item.stations.join(' ↔ ')}
              </span>
              <Link
                to={item.actionUrl}
                className="text-brand font-bold hover:underline shrink-0 flex items-center gap-0.5"
              >
                <span>{item.actionText}</span>
                <ArrowUpRight size={10} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Status */}
      <div className="pt-1 text-[10px] font-mono text-text-dim flex items-center justify-between">
        <span className="flex items-center gap-1">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>Neo4j Aura Remote Cluster Connected</span>
        </span>
        <Link to="/requests" className="text-amber-600 dark:text-amber-400 font-bold hover:underline">
          File Access Request
        </Link>
      </div>
    </div>
  );
}
