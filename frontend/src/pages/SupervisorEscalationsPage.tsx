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
    <div className="max-w-[1520px] mx-auto p-4 sm:p-6 space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs dark:shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xs">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-mono text-text dark:text-[#F8FAFC] uppercase tracking-wider">
                Emergency Broadcast & QRT Mobilization
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
                STATE CRITICAL
              </span>
            </div>
            <p className="text-xs text-text-dim dark:text-[#94A3B8]">
              Odisha State Police · Tactical Interventions, Critical Alerts & Statewide Flash Directives
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-rose-500/30 text-xs font-mono font-bold text-rose-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>{escalations.length} Active Critical Alerts</span>
          </span>
        </div>
      </div>

      {/* ACTION NOTIFICATION */}
      {broadcastSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{broadcastSuccess}</span>
        </div>
      )}

      {/* MAIN 2-COLUMN CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start font-mono text-xs">
        
        {/* Left 8 Cols: Active Escalation Incidents */}
        <div className="lg:col-span-8 space-y-4">
          {escalations.map((esc) => (
            <div
              key={esc.id}
              className="bg-surface dark:bg-[#0B0F17] p-4 sm:p-5 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-[10px]">
                  {esc.level}
                </span>
                <span className="text-text-dim dark:text-[#94A3B8] font-mono text-[11px]">{esc.timestamp}</span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-text dark:text-[#F8FAFC]">{esc.title}</h3>
                <p className="text-text-dim dark:text-[#94A3B8] flex items-center gap-1.5 text-xs mt-1">
                  <MapPin size={14} className="text-rose-400 shrink-0" />
                  {esc.location} ({esc.district})
                </p>
              </div>

              <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-[11px] leading-relaxed font-sans">
                <span className="text-text-dim dark:text-[#94A3B8] font-mono font-bold block mb-0.5 uppercase tracking-wider text-[10px]">Incident Narrative:</span>
                <p className="text-text dark:text-[#F8FAFC]">{esc.description}</p>
              </div>

              <div className="p-3 rounded-lg bg-accent/5 dark:bg-[#38BDF8]/5 border border-accent/20 dark:border-[#38BDF8]/20 text-[11px] leading-relaxed font-sans">
                <span className="text-accent dark:text-[#38BDF8] font-mono font-bold block mb-0.5 uppercase tracking-wider text-[10px]">Command Directive:</span>
                <p className="text-text dark:text-[#F8FAFC] font-medium">{esc.commandDirective}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-soft dark:border-[#1E293B]">
                <span className="text-text-dim dark:text-[#94A3B8]">
                  Status: <strong className="text-rose-400">{esc.status}</strong>
                </span>

                {esc.activeQrtDispatched ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 size={14} />
                    Special QRT Strike Team Mobilized
                  </span>
                ) : (
                  <button
                    onClick={() => handleDeployQrt(esc.id)}
                    className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-bright dark:bg-[#38BDF8] dark:hover:bg-[#0284C7] text-bg dark:text-[#070A0F] font-bold font-mono text-xs uppercase flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Zap size={14} />
                    <span>Deploy Armed QRT Unit</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right 4 Cols: High-Priority Emergency Broadcast Form */}
        <div className="lg:col-span-4 bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-3.5 shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">MDT Broadcast Dispatcher</span>
            <h3 className="text-sm font-bold text-text dark:text-[#F8FAFC] mt-0.5">Push Flash Directive</h3>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-3">
            <div>
              <label className="text-text-dim dark:text-[#94A3B8] block mb-1 font-bold text-[10px] uppercase">Scope / Precinct:</label>
              <select
                value={targetDistrict}
                onChange={(e) => setTargetDistrict(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs text-text dark:text-[#F8FAFC] outline-none font-mono focus:border-accent dark:focus:border-[#38BDF8]"
              >
                <option value="ALL">All 142 Active Units Statewide</option>
                <option value="Bhubaneswar Urban">Bhubaneswar Urban Command</option>
                <option value="Cuttack-Khordha Axis">Cuttack-Khordha Axis</option>
                <option value="Highway Interceptors">Highway Patrol Units Only</option>
              </select>
            </div>

            <div>
              <label className="text-text-dim dark:text-[#94A3B8] block mb-1 font-bold text-[10px] uppercase">Direct Executive Message:</label>
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="e.g. ALL UNITS: Armed suspects fleeing south on NH-16. Establish spike barriers immediately..."
                className="w-full p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] placeholder:text-text-dim dark:placeholder:text-[#94A3B8] text-xs font-mono resize-none outline-none focus:border-accent dark:focus:border-[#38BDF8]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold font-mono text-xs uppercase flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Send size={14} />
              <span>Transmit Flash Directive</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
