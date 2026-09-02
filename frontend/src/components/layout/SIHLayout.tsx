import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Shield, FilePlus, Search, ShieldAlert,
  Network, Sparkles, Scale, FileText, FileBarChart,
  Bell, LogOut, Moon, Sun, Lock, Building, Users, Globe, ChevronDown, Briefcase, Video, Navigation,
  CreditCard, UserCheck, TrendingUp, PhoneCall, ClipboardCheck, CheckSquare, History, AlertTriangle, Bot, GitBranch
, Radio, Truck } from 'lucide-react';





import { useMockState } from '../../mockServices/MockStateContext';
import { useLanguage, LanguageCode } from '../../context/LanguageContext';
import { AiraProvider } from '../Aira/AiraProvider';
import { AiraOrb } from '../Aira/AiraOrb';
import { AiraVoicePanel } from '../Aira/AiraVoicePanel';

export function SIHLayout() {
  const { state, dispatch } = useMockState();
  const { language, setLanguage, t, languages } = useLanguage();
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('crimelens_theme') as 'dark' | 'light') || 'light';
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

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

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
    ? state.alerts.filter(a => !a.isRead).length
    : state.alerts.filter(a => !a.isRead && state.cases.find(c => c.id === a.relatedCaseId)?.stationId === state.currentUser?.stationId).length;

  const pendingRequests = state.accessRequests.filter(r => 
    r.targetStationId === state.currentUser?.stationId && r.status === 'PENDING'
  ).length;

  const outgoingRequestsCount = state.accessRequests.filter(r => 
    r.requestingOfficerId === state.currentUser?.id
  ).length;

  const currentLangObj = languages.find(l => l.code === language) || languages[0];

  return (
    <AiraProvider>
      <div className="flex h-screen bg-bg text-text font-sans selection:bg-accent/15 selection:text-accent">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex flex-col bg-surface border-r border-border shadow-[1px_0_2px_rgba(16,24,40,0.02)]">
        <div className="p-5 border-b border-border-soft">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950/40 border border-brand/30 flex items-center justify-center p-0.5 shadow-sm">
              <img src="/siris.png" alt="S.I.R.I.S" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-brand tracking-tight leading-none">{t('brand.name', 'S.I.R.I.S')}</h1>
              <p className="text-[9px] text-text-dim uppercase tracking-widest font-mono mt-1">{t('brand.tagline', 'Odisha Police Intel')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {isSuperAdmin && (
            <>
              <div className="text-[10px] uppercase font-bold text-text-faint px-3 mt-3 mb-1.5 tracking-wider">COMMAND SUPERVISOR</div>
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Operations Command" />
              <NavItem to="/supervisor/performance" icon={Users} label="Officer & Station Performance" />
              <NavItem to="/supervisor/assignment" icon={CheckSquare} label="Case Assignment" />
              <NavItem to="/supervisor/approvals" icon={ClipboardCheck} label="Sanctions & Warrants" badge={pendingRequests} />
              <NavItem to="/supervisor/dispatch" icon={Navigation} label="Fleet & Patrol Dispatch" />
              <NavItem to="/network" icon={GitBranch} label="Cross-Station Network Graph" />
              <NavItem to="/supervisor/escalations" icon={AlertTriangle} label="Emergency Broadcast & QRT" badge={unreadAlerts} />
              <NavItem to="/supervisor/audit" icon={History} label="Audit & Compliance Logs" />
              <NavItem to="/assistant" icon={Bot} label="Supervisor Co-Pilot" />
              <NavItem to="/analytics" icon={FileBarChart} label="Analytics" />
              <NavItem to="/news" icon={Radio} label="Live News" />
              <NavItem to="/map" icon={Globe} label="GIS Crime Map" />
              <NavItem to="/legal" icon={Scale} label={t('nav.legalIntelligence', 'Legal Intelligence')} />
            </>
          )}




          {role === 'STATION_ADMIN' && (
            <>
              <div className="text-[10px] uppercase font-bold text-text-faint px-3 mt-3 mb-1.5 tracking-wider">{t('nav.section.myDesk', 'COMMAND')}</div>
              <NavItem to="/dashboard" icon={LayoutDashboard} label={t('nav.dashboard', 'Dashboard')} />
              
              <div className="text-[10px] uppercase font-bold text-text-faint px-3 mt-4 mb-1.5 tracking-wider">{t('nav.section.investigate', 'INVESTIGATIONS')}</div>
              <NavItem to="/cases" icon={Search} label={t('nav.allCases', 'All Cases')} />
              <NavItem to="/cases/new" icon={FilePlus} label={t('nav.registerFir', 'Register FIR')} />
              <NavItem to="/evidence" icon={FileText} label={t('nav.evidenceVault', 'Evidence Vault')} />
              
              <div className="text-[10px] uppercase font-bold text-text-faint px-3 mt-4 mb-1.5 tracking-wider">{t('nav.section.intelligence', 'INTELLIGENCE')}</div>
              <NavItem to="/assistant" icon={Sparkles} label={t('nav.aiAssistant', 'AI Assistant')} />
              <NavItem to="/network" icon={Network} label={t('nav.networkExplorer', 'Network Explorer')} />
              <NavItem to="/analytics" icon={FileBarChart} label="Analytics" />
              <NavItem to="/news" icon={Radio} label="Live News" />
              <NavItem to="/map" icon={Globe} label="GIS Crime Map" />
              <NavItem to="/cctv" icon={Video} label="CCTV Surveillance" />
              <NavItem to="/trail" icon={Navigation} label="Vehicle Geo-Trail" />
              <NavItem to="/money-trail" icon={CreditCard} label="Money Trail" />
              <NavItem to="/cdr" icon={PhoneCall} label="CDR Intelligence" />
              <NavItem to="/identity-review" icon={UserCheck} label="Identity Review" />
              <NavItem to="/anomalies" icon={TrendingUp} label="Anomaly Radar" />
              <NavItem to="/legal" icon={Scale} label={t('nav.legalIntelligence', 'Legal Intelligence')} />
              <NavItem to="/supervisor/fleet" icon={Truck} label="Fleet Status" />
              
              <div className="text-[10px] uppercase font-bold text-text-faint px-3 mt-4 mb-1.5 tracking-wider">{t('nav.section.operations', 'OPERATIONS')}</div>
              <NavItem to="/investigators" icon={Users} label={t('nav.officers', 'Officers')} />
              <NavItem to="/requests" icon={Lock} label={t('nav.accessRequests', 'Access Requests')} badge={pendingRequests} />
              
              <div className="text-[10px] uppercase font-bold text-text-faint px-3 mt-4 mb-1.5 tracking-wider">{t('nav.section.reports', 'REPORTS')}</div>
              <NavItem to="/reports" icon={FileBarChart} label={t('nav.caseReports', 'Case Reports')} />
            </>
          )}

          {role === 'OFFICER' && (
            <>
              <div className="text-[10px] uppercase font-bold text-text-faint px-3 mt-3 mb-1.5 tracking-wider">{t('nav.section.myDesk', 'MY DESK')}</div>
              <NavItem to="/dashboard" icon={LayoutDashboard} label={t('nav.dashboard', 'Dashboard')} />
              <NavItem to="/cases" icon={Briefcase} label={t('nav.myInvestigations', 'My Investigations')} />
              <NavItem to="/requests" icon={Lock} label={t('nav.accessRequests', 'Access Requests')} badge={outgoingRequestsCount} />
              
              <div className="text-[10px] uppercase font-bold text-text-faint px-3 mt-4 mb-1.5 tracking-wider">{t('nav.section.investigate', 'INVESTIGATE')}</div>
              <NavItem to="/cases/new" icon={FilePlus} label={t('nav.registerFir', 'Register FIR')} />
              <NavItem to="/evidence" icon={FileText} label={t('nav.evidenceVault', 'Evidence Vault')} />
              <NavItem to="/case-search" icon={Search} label={t('nav.caseSearch', 'Case Search')} />
              
              <div className="text-[10px] uppercase font-bold text-text-faint px-3 mt-4 mb-1.5 tracking-wider">{t('nav.section.intelligence', 'INTELLIGENCE')}</div>
              <NavItem to="/assistant" icon={Sparkles} label={t('nav.aiAssistant', 'AI Assistant')} />
              <NavItem to="/network" icon={Network} label={t('nav.networkExplorer', 'Network Explorer')} />
              <NavItem to="/analytics" icon={FileBarChart} label="Analytics" />
              <NavItem to="/news" icon={Radio} label="Live News" />
              <NavItem to="/map" icon={Globe} label="GIS Crime Map" />
              <NavItem to="/cctv" icon={Video} label="CCTV Surveillance" />
              <NavItem to="/trail" icon={Navigation} label="Vehicle Geo-Trail" />
              <NavItem to="/money-trail" icon={CreditCard} label="Money Trail" />
              <NavItem to="/cdr" icon={PhoneCall} label="CDR Intelligence" />
              <NavItem to="/identity-review" icon={UserCheck} label="Identity Review" />
              <NavItem to="/anomalies" icon={TrendingUp} label="Anomaly Radar" />
              <NavItem to="/legal" icon={Scale} label={t('nav.legalIntelligence', 'Legal Intelligence')} />
            </>
          )}


        </nav>

        <div className="p-3.5 border-t border-border-soft bg-surface-2/60">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand font-bold border border-brand/30 shrink-0 shadow-sm">
              {state.currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text truncate">{state.currentUser.name}</p>
              <p className="text-[10px] font-mono text-brand truncate font-medium">{state.currentUser.rank}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-1 border-t border-border-soft">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-dim hover:text-text hover:bg-surface-hover rounded-md transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={15} className="text-warning" /> : <Moon size={15} className="text-text-dim" />}
              <span className="text-[11px] font-medium">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <button 
              onClick={() => { dispatch({ type: 'SET_USER', payload: null as any }); navigate('/'); }}
              className="p-1.5 text-text-dim hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
              title="Secure Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-bg">
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0 z-20 shadow-[0_1px_2px_rgba(16,24,40,0.02)]">
          <div className="flex items-center gap-3">
            {state.currentUser.stationId ? (
              <div className="flex items-center gap-2 text-xs font-mono bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
                <span className="text-text-faint font-semibold uppercase text-[10px]">{t('header.station', 'STATION')}:</span>
                <span className="font-bold text-text">
                  {state.stations.find(s => s.id === state.currentUser?.stationId)?.name}
                </span>
                <span className="text-text-dim text-[10px]">[{state.currentUser.stationId}]</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-mono bg-brand/10 text-brand px-3 py-1.5 rounded-lg border border-brand/30 font-semibold">
                <Shield size={14} /> {t('header.stateCommand', 'ODISHA POLICE · STATE COMMAND')}
              </div>
            )}
            
            {state.isProcessingIntelligence && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-brand animate-pulse uppercase tracking-wider bg-brand/5 border border-brand/20 px-2.5 py-1 rounded-md">
                <Sparkles size={13} /> {t('header.engineRunning', 'Intelligence Engine Running...')}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language Selector Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen(prev => !prev)}
                className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-border hover:border-brand/40 px-3 py-1.5 rounded-lg text-xs font-semibold text-text transition-all shadow-sm"
                title="Change language"
              >
                <Globe size={14} className="text-brand shrink-0" />
                <span className="font-medium">{currentLangObj.nativeLabel}</span>
                <ChevronDown size={12} className={`text-text-dim transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-surface border border-border rounded-xl shadow-lg py-1.5 z-50 animate-fade-in divide-y divide-border-soft">
                  <div className="px-3 py-1 text-[10px] font-bold font-mono uppercase tracking-wider text-text-faint">
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
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          language === lang.code
                            ? 'bg-brand/10 text-brand font-bold'
                            : 'text-text hover:bg-surface-hover'
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

            <button 
              onClick={() => navigate('/intelligence/alerts')} 
              className="relative p-2 text-text-dim hover:text-text hover:bg-surface-hover rounded-lg transition-colors border border-border-soft"
              title="Intelligence Alerts"
            >
              <Bell size={17} />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-surface"></span>
              )}
            </button>
          </div>
        </header>

        {/* Global Alert Banner */}
        {unreadAlerts > 0 && (
          <div className="bg-danger/10 border-b border-danger/20 px-6 py-2 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-2 text-sm text-danger font-medium">
              <ShieldAlert size={16} className="text-danger shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[10px] text-danger">{t('header.newIntel', 'NEW INTELLIGENCE DISCOVERED:')}</span>
              <span className="text-xs text-text">{state.alerts.find(a => !a.isRead)?.message}</span>
            </div>
            <button 
              onClick={() => navigate('/intelligence/alerts')}
              className="text-xs font-bold text-danger hover:underline uppercase tracking-wider"
            >
              {t('header.viewDetails', 'VIEW DETAILS')}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
      <AiraOrb />
      <AiraVoicePanel />
    </div>
    </AiraProvider>
  );
}

function NavItem({ to, icon: Icon, label, badge }: { to: string, icon: any, label: string, badge?: number }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer
        ${isActive 
          ? 'bg-brand text-bg font-bold shadow-md border border-brand' 
          : 'text-text-dim hover:text-text hover:bg-surface-hover border border-transparent'
        }
      `}
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3">
            <Icon 
              size={18} 
              className={`shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                isActive ? 'text-bg' : 'text-text-dim group-hover:text-text'
              }`} 
            />
            <span className="tracking-tight truncate">{label}</span>
          </div>
          {(badge !== undefined && badge > 0) && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${
              isActive ? 'bg-bg text-brand' : 'bg-danger text-white'
            }`}>
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

