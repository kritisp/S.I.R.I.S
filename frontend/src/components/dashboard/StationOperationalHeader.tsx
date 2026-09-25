import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, RefreshCw, FolderKanban, Search, KeyRound,
  CheckCircle2, Clock, MapPin, UserCheck, AlertCircle
} from 'lucide-react';
import { User, Station } from '../../mockServices/types';

interface StationOperationalHeaderProps {
  user?: User | null;
  station?: Station | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  pendingRequestsCount?: number;
}

export function StationOperationalHeader({
  user,
  station,
  isRefreshing,
  onRefresh,
  pendingRequestsCount = 0,
}: StationOperationalHeaderProps) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).toUpperCase()
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/cases?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const stationName = station?.name || 'Khandagiri Police Station';
  const stationDistrict = station?.district || 'Bhubaneswar Urban Police District';
  const stationCode = station?.id || 'OP-BBSR-CAP';
  const officerName = user?.name || 'SI Ranjan Samal';
  const officerBadge = user?.badgeNumber || 'OD-POL-4412';
  const officerRank = user?.rank || 'Sub-Inspector of Police';

  return (
    <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl font-sans transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        
        {/* Left: Station Identity & Operational Context */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-[#B88922]/50 flex items-center justify-center p-1 shrink-0 shadow-sm">
            <img src="/siris.png" alt="Odisha Police" className="w-full h-full object-contain" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#B88922] dark:text-[#D1A33A] bg-[#B88922]/10 dark:bg-[#B88922]/15 px-2 py-0.5 rounded border border-[#B88922]/30">
                GOVT OF ODISHA · CCTNS 2.0 CORE
              </span>
              
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                CCTNS & ICJS GRID SYNCED
              </span>

              <span className="text-[9px] font-mono font-medium text-text-dim dark:text-[#94A3B8] px-1.5 py-0.2 rounded bg-surface-2 dark:bg-[#131B2E] border border-border-soft dark:border-[#1E293B]">
                STATION ID: {stationCode}
              </span>

              <span className="text-[9px] font-mono font-bold text-blue-500 dark:text-[#38BDF8] px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/20">
                SEC 91 CrPC COMPLIANT
              </span>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold font-mono text-text dark:text-[#F8FAFC] tracking-tight">
                {stationName}
              </h1>
              <span className="text-xs text-text-dim dark:text-[#94A3B8] flex items-center gap-1 font-mono">
                <MapPin size={11} className="text-accent dark:text-[#38BDF8]" />
                {stationDistrict}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Operational Time, Officer Stamp & Actions */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 font-mono">
          
          {/* Live Station Clock & Assigned IO */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs">
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <Clock size={12} />
                <span>{currentTime || '12:00:00'}</span>
                <span className="text-text-dim dark:text-[#64748B] text-[10px]">· {currentDate}</span>
              </div>
              <div className="text-[10px] text-text-dim dark:text-[#94A3B8] flex items-center gap-1 mt-0.5">
                <UserCheck size={10} className="text-accent dark:text-[#38BDF8]" />
                <span>IO: <strong className="text-text dark:text-[#E2E8F0]">{officerName}</strong> ({officerBadge})</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Case Search */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Case / Subject / Section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 md:w-48 pl-7 pr-2.5 py-1.5 text-xs rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] placeholder:text-text-dim dark:placeholder:text-[#64748B] focus:outline-none focus:border-accent dark:focus:border-[#38BDF8] transition-all"
              />
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim dark:text-[#64748B]" />
            </form>

            {/* Refresh Station Data */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover dark:hover:bg-[#1E293B] text-text dark:text-[#E2E8F0] border border-border-soft dark:border-[#1E293B] transition-all cursor-pointer text-xs font-bold"
              title="Refresh Station Investigation Data"
            >
              <RefreshCw
                size={12}
                className={isRefreshing ? 'animate-spin text-accent dark:text-[#38BDF8]' : 'text-text-dim dark:text-[#64748B]'}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Inter-Station Requests */}
            <Link
              to="/requests"
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover dark:hover:bg-[#1E293B] text-text dark:text-[#E2E8F0] border border-border-soft dark:border-[#1E293B] transition-all text-xs"
              title="Inter-Station Access Requests"
            >
              <KeyRound size={12} className="text-amber-500" />
              <span className="hidden md:inline">Requests</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 text-[9px] font-bold border border-amber-500/40">
                  {pendingRequestsCount}
                </span>
              )}
            </Link>

            {/* Register FIR */}
            <Link
              to="/cases/new"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand dark:bg-[#38BDF8] text-bg dark:text-[#0B0F17] font-bold hover:bg-brand-bright dark:hover:bg-[#0284C7] transition-all shadow-xs text-xs"
            >
              <FolderKanban size={13} />
              <span>Register FIR</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
