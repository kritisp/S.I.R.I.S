import React, { useState } from 'react';
import { 
  AlertTriangle, Radio, Send, ShieldAlert, Users, CheckCircle2, 
  Bell, Layers, Clock, Zap, MapPin 
} from 'lucide-react';

interface EscalationAlert {
  id: string;
  level: 'LEVEL-4 (STATE CRITICAL)' | 'LEVEL-3 (DISTRICT EMERGENCY)' | 'LEVEL-2 (HIGH ALERT)';
  title: string;
  location: string;
  district: string;
  timestamp: string;
  description: string;
  commandDirective: string;
  activeQrtDispatched: boolean;
  status: 'ACTIVE' | 'RESOLVING' | 'CONTAINED';
}

const INITIAL_ESCALATIONS: EscalationAlert[] = [
  {
    id: 'ESC-2026-09',
    level: 'LEVEL-4 (STATE CRITICAL)',
    title: 'Inter-District Highway Armed Heist & Cordon',
    location: 'NH-16 Expressway (Khandagiri-Pitapalli Toll Gate)',
    district: 'Khordha & Cuttack',
    timestamp: '18:14 IST',
    description: '4 armed suspects in black Mahindra Scorpio fleeing south after targeting cash transit van. Gunshots reported near Pitapalli.',
    commandDirective: 'Establish multi-station highway spike barriers at Pitapalli and Badambadi toll checkpoints. Deploy armed QRT strike teams.',
    activeQrtDispatched: true,
    status: 'ACTIVE',
  },
  {
    id: 'ESC-2026-10',
    level: 'LEVEL-3 (DISTRICT EMERGENCY)',
    title: 'Commercial Pass-Through Cyber Extortion Ring Raids',
    location: 'Janpath Saheed Nagar Commercial Belt',
    district: 'Bhubaneswar Urban',
    timestamp: '17:42 IST',
    description: 'Simultaneous search warrants executed across 3 illegal call centers. 12 server racks and ₹1.2 Cr in mule wallets frozen.',
    commandDirective: 'Maintain cyber forensics perimeter and execute immediate frozen asset subpoenas with State Cyber Crime Cell.',
    activeQrtDispatched: false,
    status: 'ACTIVE',
  },
];

export function SupervisorEscalationsPage() {
  const [escalations, setEscalations] = useState<EscalationAlert[]>(INITIAL_ESCALATIONS);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [targetDistrict, setTargetDistrict] = useState('ALL');
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setBroadcastSuccess(
      `Pushed Level-4 Flash Command Alert to 142 MDT Units in scope: "${targetDistrict}"`
    );
    setBroadcastMessage('');
    setTimeout(() => setBroadcastSuccess(''), 4500);
  };

  const handleDeployQrt = (id: string) => {
    setEscalations((prev) =>
      prev.map((esc) =>
        esc.id === id ? { ...esc, activeQrtDispatched: true } : esc
      )
    );
    setBroadcastSuccess('Mobilized 2 Special Armed QRT Strike Battalions!');
    setTimeout(() => setBroadcastSuccess(''), 4500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 font-sans bg-bg min-h-screen text-text select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-4 rounded-2xl bg-surface/90 border border-border-strong shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-danger/20 border border-danger/40 flex items-center justify-center text-danger">
              <AlertTriangle size={18} />
            </div>
            <h1 className="text-xl font-bold font-mono text-text uppercase tracking-wider">
              EMERGENCY BROADCAST & QRT MOBILIZATION
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-danger/20 text-danger border border-danger/30">
              STATE CRITICAL DIRECTIVES
            </span>
          </div>
          <p className="text-xs text-text-dim">
            Odisha State Police · Tactical Interventions, Critical Alerts & Statewide Flash Directives
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-surface-2 border border-border-soft text-xs font-mono font-bold text-danger flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
            <span>{escalations.length} Active Critical Alerts</span>
          </span>
        </div>
      </div>

      {/* ACTION NOTIFICATION */}
      {broadcastSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{broadcastSuccess}</span>
        </div>
      )}

      {/* MAIN 2-COLUMN CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
        
        {/* Left 8 Cols: Active Escalation Incidents */}
        <div className="lg:col-span-8 space-y-4">
          {escalations.map((esc) => (
            <div
              key={esc.id}
              className="glass p-5 sm:p-6 rounded-2xl bg-surface/90 border border-border-strong space-y-3 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-0.5 rounded bg-danger/20 text-danger-bright font-bold text-[10px]">
                  {esc.level}
                </span>
                <span className="text-text-faint font-mono">{esc.timestamp}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-text">{esc.title}</h3>
                <p className="text-text-dim flex items-center gap-1.5 text-xs mt-1">
                  <MapPin size={14} className="text-danger shrink-0" />
                  {esc.location} ({esc.district})
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-2 border border-border-soft text-[11px] leading-relaxed">
                <span className="text-text-dim font-bold block mb-0.5">INCIDENT NARRATIVE:</span>
                <p className="text-text">{esc.description}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-brand/10 border border-brand/30 text-[11px] leading-relaxed">
                <span className="text-brand font-bold block mb-0.5">COMMAND DIRECTIVE:</span>
                <p className="text-text font-medium">{esc.commandDirective}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-soft/60">
                <span className="text-text-dim">
                  Status: <strong className="text-danger">{esc.status}</strong>
                </span>

                {esc.activeQrtDispatched ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 size={14} />
                    Special QRT Strike Team Mobilized
                  </span>
                ) : (
                  <button
                    onClick={() => handleDeployQrt(esc.id)}
                    className="px-4 py-2 rounded-xl bg-brand text-bg font-bold font-mono text-xs hover:bg-brand-bright transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Zap size={14} className="text-warning" />
                    <span>Deploy Armed QRT Strike Unit</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right 4 Cols: High-Priority Emergency Broadcast Form */}
        <div className="lg:col-span-4 glass p-5 rounded-2xl bg-surface/90 border border-border-strong space-y-4 shadow-xl">
          <div>
            <span className="text-[10px] font-bold text-danger uppercase tracking-wider block">MDT BROADCAST DISPATCHER</span>
            <h3 className="text-base font-bold text-text mt-0.5">Push Flash Directive</h3>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-3">
            <div>
              <label className="text-text-dim block mb-1 font-bold text-[10px]">SCOPE / PRECINCT:</label>
              <select
                value={targetDistrict}
                onChange={(e) => setTargetDistrict(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-border-soft text-xs text-text outline-none font-mono focus:border-brand"
              >
                <option value="ALL">All 142 Active Units Statewide</option>
                <option value="Bhubaneswar Urban">Bhubaneswar Urban Command</option>
                <option value="Cuttack-Khordha Axis">Cuttack-Khordha Axis</option>
                <option value="Highway Interceptors">Highway Patrol Units Only</option>
              </select>
            </div>

            <div>
              <label className="text-text-dim block mb-1 font-bold text-[10px]">DIRECT EXECUTIVE MESSAGE:</label>
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="e.g. ALL UNITS: Armed suspects fleeing south on NH-16. Establish spike barriers immediately..."
                className="w-full p-3 rounded-xl bg-surface-2 border border-border-soft text-text placeholder:text-text-faint text-xs font-mono resize-none outline-none focus:border-brand"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-danger text-white font-bold font-mono text-xs hover:bg-danger-bright transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Send size={14} />
              <span>TRANSMIT FLASH MDT BROADCAST</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
