import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Building, User, Lock, Globe, KeyRound, Brain, Video, BarChart3, Car, Fingerprint, ScanFace, Network as NetworkIcon, Folder } from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { UserRole } from '../mockServices/types';
import { authApi } from '../services/api';

export function Login() {
  const { state, dispatch } = useMockState();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  const [stationCode, setStationCode] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('Demo@123');
  const [error, setError] = useState('');

  // Ensure Hero / Role Selection page always runs in Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-light');
    root.classList.add('theme-dark', 'dark');
  }, []);

  // Prefill logic with Odisha credentials
  useEffect(() => {
    if (selectedRole === 'SUPER_ADMIN') {
      setUserId('OP-HQ-001');
      setStationCode('');
    } else if (selectedRole === 'STATION_ADMIN') {
      setUserId('IIC-BBSR-01');
      setStationCode('OP-BBSR-CAP');
    } else if (selectedRole === 'OFFICER') {
      setUserId('INV-BBSR-001');
      setStationCode('OP-BBSR-CAP');
    }
  }, [selectedRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await authApi.login({
        userId,
        password,
        stationCode: selectedRole === 'SUPER_ADMIN' ? undefined : stationCode,
        role: selectedRole || undefined,
      });

      if (res && res.user) {
        dispatch({ type: 'SET_USER', payload: res.user });
        navigate('/dashboard');
        return;
      }
    } catch (err: any) {
      console.warn('Backend login notice, checking credentials:', err);
    }

    let user;
    if (selectedRole === 'SUPER_ADMIN') {
      user = state.users.find(u => u.role === 'SUPER_ADMIN');
    } else {
      user = state.users.find(u => u.role === selectedRole);
    }

    if (!user) {
      user = state.users[0];
    }

    dispatch({ type: 'SET_USER', payload: user });
    navigate('/dashboard');
  };

  const handleLoginForRole = (role: UserRole) => {
    const user = state.users.find(u => u.role === role) || state.users[0];
    dispatch({ type: 'SET_USER', payload: user });
    navigate('/dashboard');
  };

  if (!selectedRole) {
    return <RoleSelectionScreen onSelect={setSelectedRole} handleLoginForRole={handleLoginForRole} />;
  }


  // S.I.R.I.S DARK LOGIN UI
  return (
    <div className="min-h-screen bg-[#0A0E17] text-[#E8EAF1] flex items-center justify-center p-4 relative font-sans select-none">
      <div className="w-[390px] bg-[#111827] border border-[#263244] rounded-xl relative overflow-hidden shadow-2xl animate-fade-in">
        {/* Top gold bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B88922] to-transparent" />
        
        <div className="p-[38px_36px_32px]">
          <button 
            onClick={() => { setSelectedRole(null); setError(''); }}
            className="text-[10px] text-[#94A3B8] hover:text-[#F8FAFC] font-bold uppercase tracking-wider mb-8 flex items-center gap-1 transition-colors"
          >
            &larr; Back to Role Selection
          </button>

          {/* S.I.R.I.S Logo Badge */}
          <div className="w-[58px] h-[58px] mx-auto mb-[18px] flex items-center justify-center p-1">
            <img src="/siris.png" alt="S.I.R.I.S" className="w-full h-full object-contain" />
          </div>
          
          <div className="font-display text-[22px] font-bold text-center tracking-[0.04em] text-[#F8FAFC]">S.I.R.I.S</div>
          <div className="font-mono text-[10.5px] text-[#94A3B8] text-center tracking-[0.12em] uppercase mt-[6px] mb-[30px]">
            Odisha Police · {selectedRole === 'SUPER_ADMIN' ? 'State Command Login' : selectedRole === 'STATION_ADMIN' ? 'Station Command Login' : 'Investigator Login'}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {selectedRole !== 'SUPER_ADMIN' && (
              <div>
                <label className="block text-[11.5px] text-[#94A3B8] font-bold tracking-[0.02em] mb-[6px] uppercase">Station Code</label>
                <input 
                  type="text" 
                  value={stationCode} 
                  onChange={e => setStationCode(e.target.value)}
                  className="w-full p-[11px_12px] bg-[#0A0E17] border border-[#263244] rounded text-[13px] font-mono text-[#F8FAFC] focus:outline-none focus:border-[#B88922]/70"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-[11.5px] text-[#94A3B8] font-bold tracking-[0.02em] mb-[6px] uppercase">
                {selectedRole === 'SUPER_ADMIN' ? 'State Police ID' : selectedRole === 'STATION_ADMIN' ? 'IIC / Admin ID' : 'Officer ID'}
              </label>
              <input 
                type="text" 
                value={userId} 
                onChange={e => setUserId(e.target.value)}
                className="w-full p-[11px_12px] bg-[#0A0E17] border border-[#263244] rounded text-[13px] font-mono text-[#F8FAFC] focus:outline-none focus:border-[#B88922]/70"
                required
              />
            </div>

            <div>
              <label className="block text-[11.5px] text-[#94A3B8] font-bold tracking-[0.02em] mb-[6px] uppercase">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full p-[11px_12px] bg-[#0A0E17] border border-[#263244] rounded text-[13px] font-mono text-[#F8FAFC] focus:outline-none focus:border-[#B88922]/70"
                required
              />
            </div>

            {error && (
              <div className="text-[11px] text-[#DC2626] text-center mt-2 font-bold">{error}</div>
            )}

            <button type="submit" className="w-full mt-2 bg-[#B88922] text-[#0A0E17] py-[11px] font-bold text-[13.5px] rounded hover:bg-[#D1A33A] transition-colors flex items-center justify-center gap-2 shadow-sm">
              <Shield size={16} /> Secure Sign In
            </button>
          </form>

          <div className="mt-[22px] pt-[16px] border-t border-[#263244] flex justify-between text-[11px] text-[#64748B] font-mono">
            <span>v2.4.0 · ODISHA POLICE</span>
            <span>Authorized Use Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleSelectionScreen({ onSelect, handleLoginForRole }: { onSelect: (role: UserRole) => void; handleLoginForRole: (role: UserRole) => void }) {

  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const angleOffsetRef = useRef(0);

  const stars = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 1.5 + 1.2,
      delay: `${Math.random() * 6}s`,
      duration: `${3 + Math.random() * 5}s`,
    }));
  }, []);

  const capabilities = [
    { icon: Brain, label: "AI INVESTIGATION" },
    { icon: Video, label: "CCTV ANALYSIS" },
    { icon: BarChart3, label: "CRIME ANALYTICS" },
    { icon: Car, label: "VEHICLE INTELLIGENCE" },
    { icon: Fingerprint, label: "DIGITAL FORENSICS" },
    { icon: ScanFace, label: "FACIAL RECOGNITION" },
    { icon: NetworkIcon, label: "KNOWLEDGE GRAPH" },
    { icon: Folder, label: "EVIDENCE PROCESSING" }
  ];

  useEffect(() => {
    let animId: number;
    const updatePositions = () => {
      angleOffsetRef.current += 0.0012;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const cx = width / 2;
      const cy = height / 2 + 50;
      const rx = width * 0.44;
      const ry = height * 0.32;

      capabilities.forEach((_, idx) => {
        const el = nodeRefs.current[idx];
        if (!el) return;

        const baseAngle = (idx * 2 * Math.PI) / capabilities.length;
        const angle = baseAngle + angleOffsetRef.current;
        const x = cx + Math.cos(angle) * rx;
        const y = cy + Math.sin(angle) * ry;
        const depth = (Math.sin(angle) + 1) / 2;
        const scale = 0.72 + depth * 0.32;
        const opacity = 0.25 + depth * 0.75;
        const zIndex = Math.round(depth * 20) + 1;

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = `translate(-50%, -50%) scale(${scale})`;
        el.style.opacity = `${opacity}`;
        el.style.zIndex = `${zIndex}`;
      });
      animId = requestAnimationFrame(updatePositions);
    };
    animId = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(animId);
  }, [capabilities.length]);

  return (
    <div className="min-h-screen bg-[#0A0E17] text-[#E8EAF1] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.7); }
          50% { opacity: 0.95; transform: scale(1.35); }
        }
      `}</style>
      
      {/* Stars Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-black">
        {stars.map((star) => (
          <div key={star.id} className="absolute bg-white rounded-full opacity-[0.25]"
            style={{
              top: star.top, left: star.left, width: `${star.size}px`, height: `${star.size}px`,
              animation: `twinkle ${star.duration} infinite ease-in-out`, animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      {/* Earth Image Layer */}
      <div className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none opacity-80"
        style={{ backgroundImage: "radial-gradient(circle at center, rgba(10, 15, 30, 0.4) 0%, rgba(10, 14, 23, 0.95) 100%), url('/earthBg.jpg')" }}
      />

      {/* Orbiting HUD Nodes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg className="absolute inset-0 w-full h-full">
          <ellipse cx="50%" cy="calc(50% + 50px)" rx="44vw" ry="32vh" fill="none" stroke="rgba(79, 168, 184, 0.2)" strokeWidth="1.5" strokeDasharray="6 4" />
        </svg>
        {capabilities.map((cap, idx) => {
          const Icon = cap.icon;
          return (
            <div key={idx} ref={(el) => { nodeRefs.current[idx] = el; }} className="absolute p-2 rounded-xl border border-[#B88922]/30 bg-[#111827]/85 backdrop-blur-md flex items-center gap-2 text-[#D1A33A]">
              <Icon size={16} />
              <div className="font-mono text-[10px] font-bold tracking-wider">{cap.label}</div>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center space-y-12 animate-fade-in">
        <div>
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-[#B88922]/40 mb-6 shadow-glow p-2">
            <img src="/siris.png" alt="S.I.R.I.S" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-5xl font-display font-bold text-white tracking-tight mb-2 drop-shadow-lg">
            S.I.R.I.S
          </h1>
          <p className="text-[#B88922] font-mono text-sm tracking-[0.3em] uppercase drop-shadow-md">
            Odisha Police Intelligence Network
          </p>
          <p className="text-white/50 font-mono text-[10px] tracking-[0.2em] uppercase mt-2">
            State Crime Intelligence Network · Demonstration Prototype
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          <RoleCard icon={Shield} title="STATE POLICE / HQ" desc="Super Admin · State Command" onClick={() => onSelect('SUPER_ADMIN')} />
          <RoleCard icon={Building} title="POLICE STATION" desc="IIC / Station Admin Access" onClick={() => onSelect('STATION_ADMIN')} />
          <RoleCard icon={User} title="INVESTIGATING OFFICER" desc="Officer Field Console" onClick={() => onSelect('OFFICER')} />
        </div>

      </div>
    </div>
  );
}

function RoleCard({ icon: Icon, title, desc, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className="bg-[#111827]/85 hover:bg-[#1A2338]/95 p-6 rounded-2xl border border-[#263244] hover:border-[#B88922] hover:shadow-glow transition-all group flex flex-col items-center text-center backdrop-blur-md"
    >
      <div className="h-12 w-12 rounded-full bg-[#1E293B] flex items-center justify-center mb-4 group-hover:bg-[#B88922]/20 text-[#94A3B8] group-hover:text-[#D1A33A] transition-colors border border-[#334155] group-hover:border-[#B88922]/40">
        <Icon size={24} />
      </div>
      <h3 className="text-lg font-bold text-[#F8FAFC] tracking-wider">{title}</h3>
      <p className="text-sm text-[#94A3B8] mt-2 font-mono uppercase">{desc}</p>
    </button>
  );
}
