import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Shield, FilePlus, Search, ShieldAlert,
  Network, Sparkles, Scale, FileText, FileBarChart,
  Bell, LogOut, Moon, Sun, Lock, Building, Users, Globe, ChevronDown, ChevronRight, Briefcase, Video, Navigation,
  CreditCard, UserCheck, TrendingUp, PhoneCall, ClipboardCheck, CheckSquare, History, AlertTriangle, Bot, GitBranch,
  Radio, Truck, Layers, Menu, PanelLeftClose, PanelLeftOpen, X, FolderKanban, ShieldCheck
} from 'lucide-react';

import { useMockState } from '../../mockServices/MockStateContext';
import { useLanguage, LanguageCode } from '../../context/LanguageContext';
import { AiraProvider } from '../Aira/AiraProvider';
import { AiraOrb } from '../Aira/AiraOrb';
import { AiraVoicePanel } from '../Aira/AiraVoicePanel';

interface NavItemConfig {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  badge?: number;
}

interface NavGroupConfig {
  id: string;
  title: string;
  items: NavItemConfig[];
}

export function SIHLayout() {
  const { state, dispatch } = useMockState();
  const { language, setLanguage, t, languages } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('siris_sidebar_collapsed') === 'true';
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    workspace: true,
    operations: true,
    intelligence: false,
    forensics: false,
    collaboration: false,
    assistance: false,
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('crimelens_theme') as 'dark' | 'light') || 'dark';
  });
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'dark');
    if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.add('theme-dark', 'dark');
    }
    localStorage.setItem('crimelens_theme', theme);
  }, [theme]);

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('siris_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  // Close language menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg text-text">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
          <div className="text-sm font-mono tracking-widest text-text-dim uppercase animate-pulse">Initializing S.I.R.I.S...</div>
        </div>
      </div>
    );
  }

  if (!state.currentUser) {
    return <Navigate to="/" replace />;
  }

  const role = state.currentUser.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  
  const unreadAlerts = isSuperAdmin 
    ? state.alerts.filter((a) => !a.isRead).length
    : state.alerts.filter((a) => !a.isRead && state.cases.find((c) => c.id === a.relatedCaseId)?.stationId === state.currentUser?.stationId).length;

  const pendingRequests = state.accessRequests.filter((r) => 
    r.targetStationId === state.currentUser?.stationId && r.status === 'PENDING'
  ).length;

  const outgoingRequestsCount = state.accessRequests.filter((r) => 
    r.requestingOfficerId === state.currentUser?.id
  ).length;

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  // Define structured navigation groups
  const navGroups: NavGroupConfig[] = [
    {
      id: 'workspace',
      title: 'WORKSPACE',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Operations Command' },
        { to: '/cases', icon: Briefcase, label: 'My Investigations' },
        { to: '/network', icon: Network, label: 'Network Explorer' },
      ],
    },
    {
      id: 'operations',
      title: 'CASE OPERATIONS',
      items: [
        { to: '/cases/new', icon: FilePlus, label: 'Register Statutory FIR' },
        { to: '/evidence', icon: FileText, label: 'Evidence Vault & Locker' },
        { to: '/legal', icon: Scale, label: 'BNS & Statutory Provisions' },
        { to: '/reports', icon: FileBarChart, label: 'Investigation Reports' },
      ],
    },
    {
      id: 'intelligence',
      title: 'INTELLIGENCE & ANALYSIS',
      items: [
        { to: '/intelligence-fusion', icon: Layers, label: 'Intelligence Fusion Center' },
        { to: '/predictive-risk', icon: TrendingUp, label: 'Predictive Crime Risk' },
        { to: '/analytics', icon: FileBarChart, label: 'Modus Operandi & Analytics' },
        { to: '/anomalies', icon: AlertTriangle, label: 'Anomaly Radar' },
        { to: '/identity-review', icon: UserCheck, label: 'Identity Resolution' },
      ],
    },
    {
      id: 'forensics',
      title: 'FIELD & FORENSICS',
      items: [
        { to: '/cctv', icon: Video, label: 'CCTV Surveillance' },
        { to: '/trail', icon: Navigation, label: 'Vehicle Geo-Trail' },
        { to: '/money-trail', icon: CreditCard, label: 'AML Money Trail' },
        { to: '/cdr', icon: PhoneCall, label: 'CDR Intelligence' },
        { to: '/map', icon: Globe, label: 'GIS Crime Hotspots' },
      ],
    },
    {
      id: 'collaboration',
      title: 'COLLABORATION & ACCESS',
      items: [
        { to: '/requests', icon: Lock, label: 'Inter-Station Requests', badge: pendingRequests || outgoingRequestsCount },
        { to: '/portals', icon: Globe, label: 'National Police Portals' },
        { to: '/supervisor/approvals', icon: ClipboardCheck, label: 'Sanctions & Approvals' },
        { to: '/supervisor/audit', icon: History, label: 'Statutory Audit Logs' },
        { to: '/investigators', icon: Users, label: 'Station Officers' },
      ],
    },
    {
      id: 'assistance',
      title: 'ASSISTANCE & FLEET',
      items: [
        { to: '/assistant', icon: Bot, label: 'S.I.R.I.S. AI Co-Pilot' },
        { to: '/resource-optimization', icon: Truck, label: 'Resource Optimization' },
        { to: '/news', icon: Radio, label: 'Live Incident Feed' },
      ],
    },
  ];

  return (
    <AiraProvider>
      <div className="flex h-screen bg-bg text-text font-sans selection:bg-accent/15 selection:text-accent overflow-hidden">
        
        {/* Mobile Backdrop Overlay */}
        {isMobileDrawerOpen && (
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-surface dark:bg-[#0B0F17] border-r border-border-soft dark:border-[#1E293B] shadow-lg lg:shadow-[1px_0_4px_rgba(0,0,0,0.03)] select-none transition-all duration-300
            ${isSidebarCollapsed ? 'w-18' : 'w-72'}
            ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Header Seal & Brand */}
          <div className="h-16 px-3.5 border-b border-border-soft dark:border-[#1E293B] bg-surface-2/60 dark:bg-[#0E1422] flex items-center justify-between">
            {isSidebarCollapsed ? (
              <div className="w-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface dark:bg-[#070A0F] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center p-1.5 shadow-sm">
                  <img src="/siris.png" alt="S.I.R.I.S" className="w-full h-full object-contain" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface dark:bg-[#070A0F] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center p-1.5 shadow-xs shrink-0">
                  <img src="/siris.png" alt="S.I.R.I.S" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold font-mono text-accent dark:text-[#38BDF8] tracking-tight leading-none">
                      S.I.R.I.S.
                    </h1>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-text-dim dark:text-[#94A3B8] font-mono truncate mt-0.5">
                    {isSuperAdmin ? 'STATE CRIME COMMAND' : 'INVESTIGATION WORKSTATION'}
                  </p>
                </div>
              </div>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="p-1.5 rounded-md text-text-dim hover:text-text hover:bg-surface-hover lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-3.5 px-2.5 space-y-3.5 scrollbar-thin">
            {navGroups.map((group, groupIdx) => {
              const isGroupOpen = openGroups[group.id] ?? true;
              const hasActiveChild = group.items.some((item) => location.pathname === item.to);

              return (
                <div key={group.id} className="space-y-1.5">
                  {/* Expanded Group Header */}
                  {!isSidebarCollapsed ? (
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold font-mono uppercase tracking-wider text-text-dim dark:text-[#64748B] hover:text-text dark:hover:text-[#94A3B8] transition-colors cursor-pointer rounded"
                    >
                      <span className={hasActiveChild ? 'text-accent dark:text-[#38BDF8]' : ''}>
                        {group.title}
                      </span>
                      {isGroupOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                  ) : (
                    /* Collapsed Group Divider */
                    groupIdx > 0 && (
                      <div className="w-8 h-px bg-border-soft dark:bg-[#1E293B] mx-auto my-2" />
                    )
                  )}

                  {/* Group Items */}
                  {(isSidebarCollapsed || isGroupOpen) && (
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <NavItem
                          key={item.to}
                          to={item.to}
                          icon={item.icon}
                          label={item.label}
                          groupTitle={group.title}
                          badge={item.badge}
                          collapsed={isSidebarCollapsed}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Officer Panel & Footer Actions */}
          <div className="p-3 border-t border-border-soft dark:border-[#1E293B] bg-surface-2/70 dark:bg-[#0E1422]">
            {isSidebarCollapsed ? (
              /* Collapsed Footer: Clean Centered Stack */
              <div className="flex flex-col items-center gap-2.5 py-1">
                {/* User Avatar with Tooltip */}
                <div className="group relative">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 dark:bg-[#38BDF8]/15 flex items-center justify-center text-accent dark:text-[#38BDF8] font-bold border border-accent/30 dark:border-[#38BDF8]/30 text-sm shadow-xs cursor-pointer">
                    {state.currentUser.name.charAt(0)}
                  </div>
                  {/* Floating User Tooltip */}
                  <div className="absolute left-full ml-3.5 bottom-0 px-3 py-2 rounded-xl bg-surface dark:bg-[#1E293B] text-text dark:text-[#F8FAFC] border border-border-soft dark:border-[#334155] shadow-xl text-xs font-semibold whitespace-nowrap z-50 pointer-events-none hidden group-hover:block animate-fade-in">
                    <p className="font-bold text-sm">{state.currentUser.name}</p>
                    <p className="text-[11px] text-accent dark:text-[#38BDF8] font-mono">{state.currentUser.rank || 'Investigating Officer'}</p>
                  </div>
                </div>

                {/* Theme Toggle Button */}
                <div className="group relative">
                  <button
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] hover:bg-surface-hover dark:hover:bg-[#1E293B] transition-colors cursor-pointer border border-transparent hover:border-border-soft dark:hover:border-[#1E293B]"
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                  >
                    {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
                  </button>
                  <div className="absolute left-full ml-3.5 bottom-1 px-2.5 py-1.5 rounded-lg bg-surface dark:bg-[#1E293B] text-text dark:text-[#F8FAFC] border border-border-soft dark:border-[#334155] shadow-xl text-xs font-mono whitespace-nowrap z-50 pointer-events-none hidden group-hover:block">
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </div>
                </div>

                {/* Logout Button */}
                <div className="group relative">
                  <button
                    onClick={() => {
                      dispatch({ type: 'SET_USER', payload: null as any });
                      navigate('/');
                    }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-text-dim dark:text-[#94A3B8] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Secure Logout"
                  >
                    <LogOut size={17} />
                  </button>
                  <div className="absolute left-full ml-3.5 bottom-1 px-2.5 py-1.5 rounded-lg bg-surface dark:bg-[#1E293B] text-rose-400 border border-border-soft dark:border-[#334155] shadow-xl text-xs font-mono whitespace-nowrap z-50 pointer-events-none hidden group-hover:block">
                    Secure Logout
                  </div>
                </div>
              </div>
            ) : (
              /* Expanded Footer */
              <div>
                <div className="flex items-center gap-3 mb-2.5 px-1">
                  <div className="w-9 h-9 rounded-xl bg-accent/15 dark:bg-[#38BDF8]/15 flex items-center justify-center text-accent dark:text-[#38BDF8] font-bold border border-accent/30 dark:border-[#38BDF8]/30 shrink-0 text-sm shadow-xs">
                    {state.currentUser.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text dark:text-[#F8FAFC] truncate">
                      {state.currentUser.name}
                    </p>
                    <p className="text-[11px] text-text-dim dark:text-[#94A3B8] truncate font-mono">
                      {state.currentUser.rank || 'Investigating Officer'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-border-soft/60 dark:border-[#1E293B]">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] hover:bg-surface-hover dark:hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer"
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                  >
                    {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
                    <span className="text-xs font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <button 
                    onClick={() => {
                      dispatch({ type: 'SET_USER', payload: null as any });
                      navigate('/');
                    }}
                    className="p-1.5 text-text-dim dark:text-[#94A3B8] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Secure Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-bg">
          {/* Top Bar Header */}
          <header className="h-14 bg-surface dark:bg-[#0B0F17] border-b border-border-soft dark:border-[#1E293B] flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 shadow-xs">
            <div className="flex items-center gap-2.5">
              {/* Desktop Collapse Toggle */}
              <button
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="hidden lg:flex p-2 text-text-dim dark:text-[#94A3B8] hover:text-accent dark:hover:text-[#38BDF8] hover:bg-surface-hover dark:hover:bg-[#1E293B] border border-border-soft dark:border-[#1E293B] rounded-lg transition-all cursor-pointer"
                title={isSidebarCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
              </button>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="flex lg:hidden p-2 text-text-dim dark:text-[#94A3B8] hover:text-accent dark:hover:text-[#38BDF8] hover:bg-surface-hover dark:hover:bg-[#1E293B] border border-border-soft dark:border-[#1E293B] rounded-lg transition-all cursor-pointer"
                title="Open Navigation"
              >
                <Menu size={17} />
              </button>

              {state.currentUser.stationId ? (
                <div className="flex items-center gap-2 text-xs font-mono bg-surface-2 dark:bg-[#0E1422] px-3 py-1.5 rounded-lg border border-border-soft dark:border-[#1E293B]">
                  <span className="text-text-dim dark:text-[#64748B] text-[10px] uppercase font-bold">STATION:</span>
                  <span className="font-bold text-text dark:text-[#F8FAFC] text-xs">
                    {state.stations.find((s) => s.id === state.currentUser?.stationId)?.name || 'Khandagiri PS'}
                  </span>
                  <span className="text-text-dim dark:text-[#64748B] text-[10px]">[{state.currentUser.stationId}]</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-mono bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] px-3 py-1.5 rounded-lg border border-accent/30 dark:border-[#38BDF8]/30 font-bold text-xs">
                  <Shield size={14} /> ODISHA POLICE STATE COMMAND
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Language Selector Dropdown */}
              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setLangMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover dark:hover:bg-[#1E293B] border border-border-soft dark:border-[#1E293B] px-3 py-1.5 rounded-lg text-xs font-semibold text-text dark:text-[#F8FAFC] transition-all"
                  title="Change language"
                >
                  <Globe size={14} className="text-accent dark:text-[#38BDF8] shrink-0" />
                  <span className="font-medium text-xs">{currentLangObj.nativeLabel}</span>
                  <ChevronDown size={12} className={`text-text-dim transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {langMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl shadow-lg py-1.5 z-50 animate-fade-in divide-y divide-border-soft dark:divide-[#1E293B]">
                    <div className="px-3.5 py-1.5 text-[10px] font-bold font-mono uppercase tracking-wider text-text-dim dark:text-[#64748B]">
                      {t('header.language', 'Select Language')}
                    </div>
                    <div className="py-1">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLanguage(lang.code as LanguageCode);
                            setLangMenuOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                            language === lang.code
                              ? 'bg-accent/15 text-accent dark:text-[#38BDF8] font-bold'
                              : 'text-text dark:text-[#E2E8F0] hover:bg-surface-hover dark:hover:bg-[#1E293B]'
                          }`}
                        >
                          <span>{lang.nativeLabel}</span>
                          <span className="text-[10px] font-mono text-text-dim uppercase">
                            {lang.code.toUpperCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Alert Bell */}
              <button 
                onClick={() => navigate('/requests')} 
                className="relative p-2 text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] hover:bg-surface-hover dark:hover:bg-[#1E293B] rounded-lg transition-colors border border-border-soft dark:border-[#1E293B]"
                title="Pending Station Requests"
              >
                <Bell size={16} />
                {pendingRequests > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-surface"></span>
                )}
              </button>
            </div>
          </header>

          {/* Page Content Viewport */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Outlet />
          </div>
        </main>

        <AiraOrb />
        <AiraVoicePanel />
      </div>
    </AiraProvider>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  groupTitle,
  badge,
  collapsed,
}: {
  to: string;
  icon: any;
  label: string;
  groupTitle?: string;
  badge?: number;
  collapsed?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        group relative flex items-center transition-all duration-150 cursor-pointer
        ${
          collapsed
            ? 'justify-center w-11 h-11 mx-auto rounded-xl'
            : 'justify-between px-3 py-2 rounded-lg text-[13px] font-medium'
        }
        ${
          isActive 
            ? 'bg-accent/15 dark:bg-[#38BDF8]/15 text-accent dark:text-[#38BDF8] font-bold border border-accent/35 dark:border-[#38BDF8]/35 shadow-xs' 
            : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] hover:bg-surface-hover dark:hover:bg-[#0E1422] border border-transparent'
        }
      `}
    >
      {({ isActive }) => (
        <>
          {/* Expanded Active Bar */}
          {!collapsed && isActive && (
            <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent dark:bg-[#38BDF8] rounded-r" />
          )}

          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
            <Icon 
              size={18} 
              className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? 'text-accent dark:text-[#38BDF8]' : 'text-text-dim dark:text-[#64748B] group-hover:text-text dark:group-hover:text-[#F8FAFC]'
              }`} 
            />
            {!collapsed && <span className="tracking-tight truncate text-[13px]">{label}</span>}
          </div>

          {/* Expanded Badge */}
          {!collapsed && badge !== undefined && badge > 0 && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              {badge}
            </span>
          )}

          {/* Collapsed Dot Badge */}
          {collapsed && badge !== undefined && badge > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-surface dark:ring-[#0B0F17]" />
          )}

          {/* Collapsed Floating Flyout Tooltip */}
          {collapsed && (
            <div className="absolute left-full ml-4 px-3.5 py-2 rounded-xl bg-surface dark:bg-[#1E293B] text-text dark:text-[#F8FAFC] border border-border-soft dark:border-[#334155] shadow-2xl text-xs font-semibold whitespace-nowrap z-50 pointer-events-none hidden group-hover:flex items-center gap-2.5 animate-fade-in">
              <div className="flex flex-col">
                {groupTitle && (
                  <span className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8] uppercase tracking-wider font-bold">
                    {groupTitle}
                  </span>
                )}
                <span className="font-bold text-[13px] text-text dark:text-[#F8FAFC]">{label}</span>
              </div>
              {badge !== undefined && badge > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  {badge}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}
