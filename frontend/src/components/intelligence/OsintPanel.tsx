import React, { useState } from 'react';
import { Search, Globe, Shield, Phone, Wallet, MapPin, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface OsintResult {
  query: string;
  type: 'PHONE' | 'WALLET' | 'GEOCODE' | 'BREACH';
  simulated: boolean;
  provenance: string;
  data: Record<string, any>;
  timestamp: string;
}

export function OsintPanel() {
  const [activeTab, setActiveTab] = useState<'PHONE' | 'WALLET' | 'GEOCODE' | 'BREACH'>('PHONE');
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OsintResult | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    setLoading(true);
    setResult(null);

    const q = queryInput.trim();

    try {
      if (activeTab === 'GEOCODE') {
        // LIVE GEOLOCATION via Nominatim OpenStreetMap (Keyless)
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Odisha, India')}`
        );
        const data = await resp.json();
        if (data && data.length > 0) {
          const top = data[0];
          setResult({
            query: q,
            type: 'GEOCODE',
            simulated: false,
            provenance: 'OpenStreetMap Nominatim Live API (Open Data)',
            data: {
              display_name: top.display_name,
              lat: top.lat,
              lon: top.lon,
              type: top.type,
              importance: top.importance,
            },
            timestamp: new Date().toISOString(),
          });
        } else {
          setResult({
            query: q,
            type: 'GEOCODE',
            simulated: false,
            provenance: 'OpenStreetMap Nominatim Live API',
            data: { error: 'No matching geographic location found in Odisha region.' },
            timestamp: new Date().toISOString(),
          });
        }
      } else if (activeTab === 'WALLET') {
        // LIVE WALLET via Blockscout Amoy Polygon API (Keyless)
        const resp = await fetch(
          `https://polygon-amoy.blockscout.com/api/v2/addresses/${q}`
        );
        let walletData: Record<string, any> = {};
        if (resp.ok) {
          const raw = await resp.json();
          walletData = {
            address: raw.hash || q,
            coin_balance: raw.coin_balance || '0 MATIC',
            is_contract: raw.is_contract || false,
            tx_count: raw.transactions_count || 0,
            has_token_transfers: raw.has_token_transfers || false,
            block_explorer_url: `https://polygon-amoy.blockscout.com/address/${q}`,
          };
        } else {
          walletData = {
            address: q,
            status: 'Query completed — address unindexed or zero activity on Polygon testnet.',
            block_explorer_url: `https://polygon-amoy.blockscout.com/address/${q}`,
          };
        }
        setResult({
          query: q,
          type: 'WALLET',
          simulated: false,
          provenance: 'Blockscout EVM Polygon Amoy Explorer (Live API)',
          data: walletData,
          timestamp: new Date().toISOString(),
        });
      } else if (activeTab === 'PHONE') {
        // PHONE SERIES LOOKUP (Simulated Indian Numbering Plan Series Lookup)
        const digits = q.replace(/\D/g, '');
        const circle = digits.startsWith('9861') || digits.startsWith('9437') || digits.startsWith('7008')
          ? 'Odisha Telecom Circle'
          : 'National Telecom Circle';
        const operator = digits.startsWith('98') || digits.startsWith('94')
          ? 'BSNL Mobile'
          : digits.startsWith('70') || digits.startsWith('63')
          ? 'Reliance Jio Infocomm'
          : 'Airtel India';

        setResult({
          query: q,
          type: 'PHONE',
          simulated: true,
          provenance: 'Telecom Series Matrix & Indian Numbering Plan Registry (Simulated Adapter)',
          data: {
            phone_number: q,
            circle,
            original_operator: operator,
            mnp_status: 'Portability Check Pending (Requires LRN Gateway Access)',
            valid_length: digits.length === 10,
            series_code: digits.slice(0, 4),
          },
          timestamp: new Date().toISOString(),
        });
      } else if (activeTab === 'BREACH') {
        // BREACH EXPOSURE (Deterministic Simulated OSINT)
        const isExposed = q.length % 2 === 0;
        setResult({
          query: q,
          type: 'BREACH',
          simulated: true,
          provenance: 'Aggregated Darkweb Dump Index (Simulated Demonstration Envelope)',
          data: {
            subject: q,
            exposed_in_breaches: isExposed ? 3 : 0,
            sample_breaches: isExposed
              ? ['2023 Telecom KYC Dump', '2024 Crypto Exchange Leak', 'Financial Portal Scrap']
              : [],
            risk_classification: isExposed ? 'HIGH_EXPOSURE' : 'CLEAR',
          },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setResult({
        query: q,
        type: activeTab,
        simulated: true,
        provenance: 'OSINT Adapter Fallback',
        data: { error: `Query failed: ${err.message || 'Network error'}` },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-border-soft rounded-2xl p-5 font-mono text-xs space-y-4 shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-soft">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand" />
          <span className="font-bold text-text uppercase tracking-wider">
            S.I.R.I.S. OSINT Enrichment Hub
          </span>
        </div>
        <span className="text-[10px] text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
          PROVENANCE DISCLOSED
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-surface-2 p-1 rounded-xl border border-border-soft text-[11px] font-bold">
        {[
          { id: 'PHONE', label: 'Phone Series', icon: Phone },
          { id: 'WALLET', label: 'Crypto Wallet', icon: Wallet },
          { id: 'GEOCODE', label: 'Geocoding', icon: MapPin },
          { id: 'BREACH', label: 'Breach Check', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setResult(null);
                setQueryInput('');
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-text-dim hover:text-text hover:bg-surface'
              }`}
            >
              <Icon size={12} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleLookup} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder={
              activeTab === 'PHONE'
                ? 'Enter 10-digit Indian phone (e.g. 9861105000)...'
                : activeTab === 'WALLET'
                ? 'Enter EVM wallet address (0x...)...'
                : activeTab === 'GEOCODE'
                ? 'Enter locality or landmark in Odisha (e.g. Patia)...'
                : 'Enter email, phone, or UPI ID...'
            }
            className="w-full bg-surface-2 border border-border text-text placeholder:text-text-faint p-2.5 rounded-xl outline-none focus:border-brand"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 bg-brand text-white font-bold rounded-xl hover:bg-brand-bright transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search size={14} />
          )}
          <span>Search</span>
        </button>
      </form>

      {/* Result Container */}
      {result && (
        <div className="space-y-3 pt-2 animate-fade-in">
          {/* Provenance Badge */}
          <div className="flex items-center justify-between text-[10px] p-2 rounded-lg bg-surface-2 border border-border-soft">
            <span className="text-text-dim truncate">Source: {result.provenance}</span>
            <span
              className={`px-2 py-0.5 rounded font-bold uppercase ${
                result.simulated
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
              }`}
            >
              {result.simulated ? 'SIMULATED DEMO' : 'LIVE API'}
            </span>
          </div>

          {/* Result Body */}
          <div className="p-4 rounded-xl bg-surface-2 border border-border-soft space-y-2 text-xs">
            {Object.entries(result.data).map(([k, v]) => (
              <div key={k} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border-soft/40 pb-1.5">
                <span className="text-text-dim font-bold uppercase text-[10px]">{k.replace(/_/g, ' ')}</span>
                <span className="text-text font-semibold break-all text-right font-mono">
                  {Array.isArray(v)
                    ? v.join(', ') || 'None'
                    : typeof v === 'boolean'
                    ? v
                      ? 'YES'
                      : 'NO'
                    : String(v)}
                </span>
              </div>
            ))}

            {result.data.block_explorer_url && (
              <a
                href={result.data.block_explorer_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-brand font-bold text-xs hover:underline pt-2"
              >
                <span>View on Blockscout Explorer</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
