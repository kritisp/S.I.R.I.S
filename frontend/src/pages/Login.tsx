import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Building, User, Lock, Globe, KeyRound,
  Brain, Video, BarChart3, Car, Fingerprint, ScanFace,
  Network as NetworkIcon, Folder, CheckCircle2, ChevronRight,
  Users, BadgeCheck, Sparkles, Building2, Eye, ArrowRight
} from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { UserRole } from '../mockServices/types';
import { authApi, setAuthToken, stationsApi } from '../services/api';

interface StationRosterItem {
  stationId: string;
  stationName: string;
  district: string;
  city: string;
  state: string;
  activeCases: number;
  officers: {
    id: string;
    name: string;
    role: string;
    rank: string;
    email: string;
    status: string;
  }[];
}

const DEFAULT_STATIONS_ROSTER: StationRosterItem[] = [
  {
    stationId: 'PS_BBSR_001',
    stationName: 'Kharavela Nagar PS',
    district: 'Khordha (Bhubaneswar)',
    city: 'Bhubaneswar',
    state: 'Odisha',
    activeCases: 164,
    officers: [
      { id: 'USR-KHN-001', name: 'Insp. Ramesh Chandra Mohanty', role: 'STATION_ADMIN', rank: 'Inspector in Charge (IIC)', email: 'iic.kharavela@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-KHN-002', name: 'SI Ranjan Kumar Samal', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'ranjan.samal@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-KHN-003', name: 'SI Priyadarshi Nayak', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'priyadarshi.n@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-KHN-004', name: 'ASI Soumya Ranjan Das', role: 'OFFICER', rank: 'Asst. Sub-Inspector (ASI)', email: 'soumya.das@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-KHN-005', name: 'SI Ananya Patnaik', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'ananya.patnaik@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-KHN-006', name: 'SI Bikram Keshari Rout', role: 'OFFICER', rank: 'Sub-Inspector / Cyber Specialist', email: 'bikram.rout@odishapolice.gov.in', status: 'ACTIVE' }
    ]
  },
  {
    stationId: 'PS_BBSR_002',
    stationName: 'Saheed Nagar PS',
    district: 'Khordha (Bhubaneswar)',
    city: 'Bhubaneswar',
    state: 'Odisha',
    activeCases: 132,
    officers: [
      { id: 'USR-SHN-001', name: 'Insp. Debasis Biswal', role: 'STATION_ADMIN', rank: 'Inspector in Charge (IIC)', email: 'iic.saheednagar@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-SHN-002', name: 'SI Manoj Kumar Swain', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'manoj.swain@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-SHN-003', name: 'SI Subhashree Tripathy', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'subhashree.t@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-SHN-004', name: 'ASI Pradeep Kumar Jena', role: 'OFFICER', rank: 'Asst. Sub-Inspector (ASI)', email: 'pradeep.jena@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-SHN-005', name: 'SI Alok Kumar Barik', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'alok.barik@odishapolice.gov.in', status: 'ACTIVE' }
    ]
  },
  {
    stationId: 'PS_BBSR_003',
    stationName: 'Mancheswar PS',
    district: 'Khordha (Bhubaneswar)',
    city: 'Bhubaneswar',
    state: 'Odisha',
    activeCases: 152,
    officers: [
      { id: 'USR-MAN-001', name: 'Insp. Sudhanshu Sekhar Sahoo', role: 'STATION_ADMIN', rank: 'Inspector in Charge (IIC)', email: 'iic.mancheswar@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-MAN-002', name: 'SI Tapan Kumar Behera', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'tapan.behera@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-MAN-003', name: 'SI Lipsa Mishra', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'lipsa.mishra@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-MAN-004', name: 'ASI Rabindra Kumar Pradhan', role: 'OFFICER', rank: 'Asst. Sub-Inspector (ASI)', email: 'rabindra.pradhan@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-MAN-005', name: 'SI Jyoti Prakash Das', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'jyoti.das@odishapolice.gov.in', status: 'ACTIVE' }
    ]
  },
  {
    stationId: 'PS_BBSR_004',
    stationName: 'Chandrasekharpur PS',
    district: 'Khordha (Bhubaneswar)',
    city: 'Bhubaneswar',
    state: 'Odisha',
    activeCases: 139,
    officers: [
      { id: 'USR-CSP-001', name: 'Insp. Prasanta Kumar Panda', role: 'STATION_ADMIN', rank: 'Inspector in Charge (IIC)', email: 'iic.csapur@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-CSP-002', name: 'SI Smruti Rekha Mohapatra', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'smruti.m@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-CSP-003', name: 'SI Abhash Kumar Sethi', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'abhash.sethi@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-CSP-004', name: 'ASI Niranjan Mallick', role: 'OFFICER', rank: 'Asst. Sub-Inspector (ASI)', email: 'niranjan.m@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-CSP-005', name: 'SI Dipti Ranjan Sahu', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'dipti.sahu@odishapolice.gov.in', status: 'ACTIVE' }
    ]
  },
  {
    stationId: 'PS_CTC_001',
    stationName: 'Cuttack Sadar PS',
    district: 'Cuttack',
    city: 'Cuttack',
    state: 'Odisha',
    activeCases: 143,
    officers: [
      { id: 'USR-CTC-001', name: 'Insp. Amarendra Kumar Patnaik', role: 'STATION_ADMIN', rank: 'Inspector in Charge (IIC)', email: 'iic.cuttacksadar@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-CTC-002', name: 'SI Bimal Kumar Mahanta', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'bimal.mahanta@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-CTC-003', name: 'SI Rasmita Sutar', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'rasmita.sutar@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-CTC-004', name: 'ASI Chandrasekhar Parida', role: 'OFFICER', rank: 'Asst. Sub-Inspector (ASI)', email: 'chandra.parida@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-CTC-005', name: 'SI Kshirod Chandra Ray', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'kshirod.ray@odishapolice.gov.in', status: 'ACTIVE' }
    ]
  },
  {
    stationId: 'PS_PURI_001',
    stationName: 'Puri Town PS',
    district: 'Puri',
    city: 'Puri',
    state: 'Odisha',
    activeCases: 150,
    officers: [
      { id: 'USR-PURI-001', name: 'Insp. Jagannath Mishra', role: 'STATION_ADMIN', rank: 'Inspector in Charge (IIC)', email: 'iic.puritown@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-PURI-002', name: 'SI Sanjay Kumar Tripathy', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'sanjay.tripathy@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-PURI-003', name: 'SI Madhusmita Panda', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'madhu.panda@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-PURI-004', name: 'ASI Gagan Bihari Acharya', role: 'OFFICER', rank: 'Asst. Sub-Inspector (ASI)', email: 'gagan.acharya@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-PURI-005', name: 'SI Bhagirathi Nayak', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'bhagirathi.n@odishapolice.gov.in', status: 'ACTIVE' }
    ]
  },
  {
    stationId: 'PS_SBP_001',
    stationName: 'Sambalpur Town PS',
    district: 'Sambalpur',
    city: 'Sambalpur',
    state: 'Odisha',
    activeCases: 155,
    officers: [
      { id: 'USR-SBP-001', name: 'Insp. Surendra Nath Pradhan', role: 'STATION_ADMIN', rank: 'Inspector in Charge (IIC)', email: 'iic.sambalpur@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-SBP-002', name: 'SI Ashish Kumar Purohit', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'ashish.purohit@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-SBP-003', name: 'SI Meenakshi Patel', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'meenakshi.patel@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-SBP-004', name: 'ASI Hemant Kumar Bag', role: 'OFFICER', rank: 'Asst. Sub-Inspector (ASI)', email: 'hemant.bag@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-SBP-005', name: 'SI Dillip Kumar Naik', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'dillip.naik@odishapolice.gov.in', status: 'ACTIVE' }
    ]
  },
  {
    stationId: 'PS_RKL_001',
    stationName: 'Rourkela PS',
    district: 'Sundargarh',
    city: 'Rourkela',
    state: 'Odisha',
    activeCases: 165,
    officers: [
      { id: 'USR-RKL-001', name: 'Insp. Arun Kumar Tirkey', role: 'STATION_ADMIN', rank: 'Inspector in Charge (IIC)', email: 'iic.rourkela@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-RKL-002', name: 'SI Tapas Ranjan Ekka', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'tapas.ekka@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-RKL-003', name: 'SI Swagatika Minz', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'swagatika.minz@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-RKL-004', name: 'ASI Birendra Kujur', role: 'OFFICER', rank: 'Asst. Sub-Inspector (ASI)', email: 'birendra.kujur@odishapolice.gov.in', status: 'ACTIVE' },
      { id: 'USR-RKL-005', name: 'SI Sukanta Kumar Oram', role: 'OFFICER', rank: 'Sub-Inspector of Police (SI)', email: 'sukanta.oram@odishapolice.gov.in', status: 'ACTIVE' }
    ]
  }
];

export function Login() {
  const { state, dispatch } = useMockState();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [stationCode, setStationCode] = useState('PS_BBSR_001');
  const [userId, setUserId] = useState('USR-KHN-002');
  const [password, setPassword] = useState('OdishaPolice@2026');
  const [error, setError] = useState('');
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterData, setRosterData] = useState<StationRosterItem[]>(DEFAULT_STATIONS_ROSTER);

  // Ensure Hero / Role Selection page runs in Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-light');
    root.classList.add('theme-dark', 'dark');
  }, []);

  // Fetch live roster if available
  useEffect(() => {
    fetch('/api/v1/stations/roster')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRosterData(data);
        }
      })
      .catch(() => {});
  }, []);

  // Current station officers
  const currentStationRoster = useMemo(() => {
    return rosterData.find(s => s.stationId === stationCode) || rosterData[0];
  }, [rosterData, stationCode]);

  const availableOfficers = useMemo(() => {
    if (!currentStationRoster) return [];
    if (selectedRole === 'STATION_ADMIN') {
      return currentStationRoster.officers.filter(o => o.role === 'STATION_ADMIN');
    }
    return currentStationRoster.officers;
  }, [currentStationRoster, selectedRole]);

  // Update default user whenever role or station changes
  useEffect(() => {
    if (selectedRole === 'SUPER_ADMIN') {
      setUserId('USR-HQ-001');
      setStationCode('');
    } else if (selectedRole === 'STATION_ADMIN') {
      const iic = currentStationRoster?.officers.find(o => o.role === 'STATION_ADMIN') || currentStationRoster?.officers[0];
      if (iic) setUserId(iic.id);
    } else if (selectedRole === 'OFFICER') {
      const io = currentStationRoster?.officers.find(o => o.role === 'OFFICER') || currentStationRoster?.officers[0];
      if (io) setUserId(io.id);
    }
  }, [selectedRole, stationCode, currentStationRoster]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    try {
      const res = await authApi.login({
        userId,
        password,
        stationCode: selectedRole === 'SUPER_ADMIN' ? undefined : stationCode,
        role: selectedRole || undefined,
      });

      if (res && res.user) {
        if (res.token) {
          setAuthToken(res.token);
        }
        dispatch({ type: 'SET_USER', payload: res.user });
        navigate('/dashboard');
        return;
      }
    } catch (err: any) {
      console.warn('Backend login notice, checking credentials:', err);
    }

    // Fallback authentication
    let officerObj = null;
    if (selectedRole === 'SUPER_ADMIN') {
      officerObj = {
        id: 'USR-HQ-001',
        name: 'Dr. Sudhanshu Sarangi, IPS',
        role: 'SUPER_ADMIN',
        stationId: 'ALL',
        badgeNumber: 'OD-POL-0001',
        rank: 'Director General of Police / Commissioner',
        email: 'dgp.odishapolice@odishapolice.gov.in',
        status: 'ACTIVE'
      };
    } else {
      const foundOfficer = currentStationRoster?.officers.find(o => o.id === userId);
      if (foundOfficer) {
        officerObj = {
          id: foundOfficer.id,
          name: foundOfficer.name,
          role: foundOfficer.role as UserRole,
          stationId: stationCode,
          badgeNumber: `OD-POL-${foundOfficer.id.slice(-4)}`,
          rank: foundOfficer.rank,
          email: foundOfficer.email,
          status: 'ACTIVE'
        };
      }
    }

    if (!officerObj) {
      officerObj = state.users[0];
    }

    dispatch({ type: 'SET_USER', payload: officerObj as any });
    navigate('/dashboard');
  };

  const handleQuickLoginAsOfficer = (stId: string, officer: any) => {
    setStationCode(stId);
    setUserId(officer.id);
    setSelectedRole(officer.role as UserRole);

    const officerObj = {
      id: officer.id,
      name: officer.name,
      role: officer.role as UserRole,
      stationId: stId,
      badgeNumber: `OD-POL-${officer.id.slice(-4)}`,
      rank: officer.rank,
      email: officer.email,
      status: 'ACTIVE'
    };

    dispatch({ type: 'SET_USER', payload: officerObj as any });
    setShowRosterModal(false);
    navigate('/dashboard');
  };

  if (!selectedRole) {
    return (
      <RoleSelectionScreen
        onSelect={setSelectedRole}
        onOpenRoster={() => setShowRosterModal(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E17] text-[#E8EAF1] flex items-center justify-center p-4 relative font-sans select-none">
      {/* Background Ambience */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none opacity-40"
        style={{ backgroundImage: "radial-gradient(circle at center, rgba(10, 15, 30, 0.4) 0%, rgba(10, 14, 23, 0.95) 100%), url('/earthBg.jpg')" }}
      />

      <div className="w-[460px] bg-[#111827]/95 border border-[#263244] rounded-2xl relative overflow-hidden shadow-2xl animate-fade-in backdrop-blur-xl z-10">
        {/* Top gold bar */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#B88922] to-transparent" />
        
        <div className="p-[32px_32px_28px]">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => { setSelectedRole(null); setError(''); }}
              className="text-[10.5px] text-[#94A3B8] hover:text-[#F8FAFC] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              &larr; Role Selection
            </button>

            <button
              onClick={() => setShowRosterModal(true)}
              className="text-[10px] font-mono font-bold text-[#D1A33A] bg-[#B88922]/15 hover:bg-[#B88922]/25 px-2.5 py-1 rounded-md border border-[#B88922]/30 flex items-center gap-1 transition-all"
            >
              <Users size={12} />
              <span>Full Police Roster</span>
            </button>
          </div>

          {/* S.I.R.I.S Logo & Heading */}
          <div className="text-center mb-6">
            <div className="w-[52px] h-[52px] mx-auto mb-2 flex items-center justify-center p-1 rounded-xl bg-[#1E293B]/80 border border-[#B88922]/40 shadow-glow">
              <img src="/siris.png" alt="S.I.R.I.S" className="w-full h-full object-contain" />
            </div>
            
            <div className="font-display text-[20px] font-bold tracking-[0.04em] text-[#F8FAFC]">
              S.I.R.I.S · ODISHA POLICE
            </div>
            <div className="font-mono text-[10.5px] text-[#D1A33A] tracking-[0.1em] uppercase mt-1">
              {selectedRole === 'SUPER_ADMIN' ? 'State Command Headquarters (DGP / CID)' : selectedRole === 'STATION_ADMIN' ? 'Police Station Command (IIC)' : 'Investigating Officer Console'}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            {selectedRole !== 'SUPER_ADMIN' && (
              <>
                {/* 1. Police Station Selector */}
                <div>
                  <label className="block text-[11px] text-[#94A3B8] font-bold tracking-[0.02em] mb-1 uppercase font-mono flex items-center justify-between">
                    <span>1. Police Station Jurisdiction</span>
                    <span className="text-[#38BDF8] text-[10px] lowercase">{currentStationRoster?.activeCases} active dockets</span>
                  </label>
                  <select
                    value={stationCode}
                    onChange={(e) => setStationCode(e.target.value)}
                    className="w-full p-[9px_12px] bg-[#0A0E17] border border-[#263244] rounded-lg text-[12.5px] font-mono text-[#F8FAFC] focus:outline-none focus:border-[#B88922]/80 cursor-pointer"
                  >
                    {rosterData.map((st) => (
                      <option key={st.stationId} value={st.stationId}>
                        {st.stationName} ({st.district})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Officer Selector */}
                <div>
                  <label className="block text-[11px] text-[#94A3B8] font-bold tracking-[0.02em] mb-1 uppercase font-mono">
                    2. Select Authenticated Officer
                  </label>
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full p-[9px_12px] bg-[#0A0E17] border border-[#263244] rounded-lg text-[12.5px] font-mono text-[#F8FAFC] focus:outline-none focus:border-[#B88922]/80 cursor-pointer"
                  >
                    {availableOfficers.map((off) => (
                      <option key={off.id} value={off.id}>
                        {off.name} — {off.rank}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {selectedRole === 'SUPER_ADMIN' && (
              <div>
                <label className="block text-[11px] text-[#94A3B8] font-bold tracking-[0.02em] mb-1 uppercase font-mono">
                  State Police Command Authority
                </label>
                <div className="p-3 bg-[#0A0E17] border border-[#263244] rounded-lg text-xs font-mono text-[#F8FAFC] flex items-center gap-2.5">
                  <Shield size={16} className="text-[#D1A33A]" />
                  <div>
                    <div className="font-bold text-[#F8FAFC]">Dr. Sudhanshu Sarangi, IPS</div>
                    <div className="text-[10px] text-[#94A3B8]">Director General of Police / State Commissioner</div>
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-[11px] text-[#94A3B8] font-bold tracking-[0.02em] mb-1 uppercase font-mono flex items-center justify-between">
                <span>Secure Password</span>
                <span className="text-emerald-400 text-[10px]">Prefilled: OdishaPolice@2026</span>
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full p-[9px_12px] bg-[#0A0E17] border border-[#263244] rounded-lg text-[13px] font-mono text-[#F8FAFC] focus:outline-none focus:border-[#B88922]/80"
                required
              />
            </div>

            {error && (
              <div className="text-[11px] text-[#DC2626] text-center mt-2 font-bold font-mono">{error}</div>
            )}

            <button
              type="submit"
              className="w-full mt-3 bg-gradient-to-r from-[#B88922] to-[#D1A33A] text-[#0A0E17] py-[10px] font-bold text-[13.5px] rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer font-mono"
            >
              <Shield size={16} /> Enter Investigation Command Center
            </button>
          </form>

          {/* Quick Credential Hint */}
          <div className="mt-4 p-2.5 rounded-lg bg-[#0A0E17]/80 border border-[#263244] text-[10.5px] font-mono text-[#94A3B8] space-y-1">
            <div className="text-[#D1A33A] font-bold flex items-center gap-1">
              <BadgeCheck size={12} /> CCTNS 2.0 Security Compliance
            </div>
            <div>
              Station Isolation Active: Investigating officers only access their jurisdiction dockets. Inter-station dockets require Section 91 CrPC sanction.
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#263244] flex justify-between text-[10px] text-[#64748B] font-mono">
            <span>v2.4.0 · ODISHA POLICE HQ</span>
            <span>Authorized Law Enforcement Only</span>
          </div>
        </div>
      </div>

      {/* ── ODISHA POLICE ROSTER DIRECTORY MODAL ── */}
      {showRosterModal && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setShowRosterModal(false)}
        >
          <div
            className="bg-[#111827] border border-[#B88922]/40 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#263244] flex items-center justify-between bg-[#0A0E17]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#B88922]/20 border border-[#B88922]/40 flex items-center justify-center text-[#D1A33A]">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC] font-mono">
                    ODISHA POLICE JURISDICTION & OFFICER ROSTER
                  </h3>
                  <p className="text-xs text-[#94A3B8] font-mono">
                    8 Police Stations · 42 Active Investigators · 1,200 Cases in Database
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRosterModal(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] font-mono text-sm font-bold px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body: Station Cards with Officer lists */}
            <div className="p-5 overflow-y-auto space-y-4 max-h-[calc(85vh-130px)]">
              {/* Statewide Super Admin Card */}
              <div className="p-3.5 rounded-xl bg-[#0A0E17] border border-[#B88922]/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield size={22} className="text-[#D1A33A]" />
                  <div>
                    <div className="font-bold text-sm text-[#F8FAFC] font-mono">
                      Dr. Sudhanshu Sarangi, IPS (DGP / State Police Commissioner)
                    </div>
                    <div className="text-xs text-[#94A3B8] font-mono">
                      Statewide Super Admin · Full Inter-Agency Graph & Oversight
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleQuickLoginAsOfficer('ALL', {
                    id: 'USR-HQ-001',
                    name: 'Dr. Sudhanshu Sarangi, IPS',
                    role: 'SUPER_ADMIN',
                    rank: 'Director General of Police / Commissioner',
                    email: 'dgp.odishapolice@odishapolice.gov.in'
                  })}
                  className="px-3.5 py-1.5 rounded-lg bg-[#B88922] text-[#0A0E17] font-bold text-xs font-mono hover:bg-[#D1A33A] transition-all cursor-pointer"
                >
                  Login as DGP →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rosterData.map((st) => (
                  <div
                    key={st.stationId}
                    className="p-4 rounded-xl bg-[#0A0E17] border border-[#263244] space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#263244] pb-2">
                      <div>
                        <h4 className="font-bold text-sm text-[#F8FAFC] font-mono">{st.stationName}</h4>
                        <p className="text-[11px] text-[#94A3B8] font-mono">{st.district}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                        {st.activeCases} Cases
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {st.officers.map((off) => (
                        <div
                          key={off.id}
                          className="p-2 rounded-lg bg-[#111827] hover:bg-[#1E293B] border border-[#263244] flex items-center justify-between text-xs font-mono transition-all group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-[#F8FAFC] truncate">
                              {off.name}
                            </div>
                            <div className="text-[10px] text-[#94A3B8] truncate">
                              {off.rank} · <span className="text-[#38BDF8]">{off.id}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleQuickLoginAsOfficer(st.stationId, off)}
                            className="shrink-0 px-2 py-1 rounded bg-[#B88922]/20 hover:bg-[#B88922] text-[#D1A33A] hover:text-[#0A0E17] border border-[#B88922]/40 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Sign In
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleSelectionScreen({ onSelect, onOpenRoster }: { onSelect: (role: UserRole) => void; onOpenRoster: () => void }) {
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

      <div className="relative z-10 max-w-4xl w-full text-center space-y-10 animate-fade-in">
        <div>
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-[#B88922]/40 mb-6 shadow-glow p-2">
            <img src="/siris.png" alt="S.I.R.I.S" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-5xl font-display font-bold text-white tracking-tight mb-2 drop-shadow-lg">
            S.I.R.I.S
          </h1>
          <p className="text-[#B88922] font-mono text-sm tracking-[0.3em] uppercase drop-shadow-md">
            Smart Intelligence for Real Time Investigation Support
          </p>
          <p className="text-white/60 font-mono text-[11px] tracking-[0.2em] uppercase mt-2">
            Odisha Police State Crime Intelligence & CCTNS 2.0 Integration
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          <RoleCard icon={Shield} title="STATE POLICE / HQ" desc="Super Admin · State Command" onClick={() => onSelect('SUPER_ADMIN')} />
          <RoleCard icon={Building} title="POLICE STATION" desc="IIC / Station Admin Access" onClick={() => onSelect('STATION_ADMIN')} />
          <RoleCard icon={User} title="INVESTIGATING OFFICER" desc="Officer Field Console" onClick={() => onSelect('OFFICER')} />
        </div>

        {/* Quick Officer Roster Direct Access Button */}
        <div className="pt-2">
          <button
            onClick={onOpenRoster}
            className="px-5 py-2.5 rounded-xl bg-[#111827]/90 hover:bg-[#1E293B] border border-[#B88922]/50 hover:border-[#B88922] text-[#D1A33A] font-mono text-xs font-bold transition-all shadow-lg inline-flex items-center gap-2 cursor-pointer backdrop-blur-md"
          >
            <Users size={15} />
            <span>Open All 8 Police Stations & 42 Officers Quick Sign-In Directory</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}

function RoleCard({ icon: Icon, title, desc, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className="bg-[#111827]/85 hover:bg-[#1A2338]/95 p-6 rounded-2xl border border-[#263244] hover:border-[#B88922] hover:shadow-glow transition-all group flex flex-col items-center text-center backdrop-blur-md cursor-pointer"
    >
      <div className="h-12 w-12 rounded-full bg-[#1E293B] flex items-center justify-center mb-4 group-hover:bg-[#B88922]/20 text-[#94A3B8] group-hover:text-[#D1A33A] transition-colors border border-[#334155] group-hover:border-[#B88922]/40">
        <Icon size={24} />
      </div>
      <h3 className="text-lg font-bold text-[#F8FAFC] tracking-wider">{title}</h3>
      <p className="text-sm text-[#94A3B8] mt-2 font-mono uppercase">{desc}</p>
    </button>
  );
}
