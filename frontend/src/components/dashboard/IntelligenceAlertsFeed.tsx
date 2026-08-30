import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Info, ChevronRight, ShieldAlert, AlertTriangle,
  Network, CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useMockState } from '../../mockServices/MockStateContext';
import { alertsApi } from '../../services/api';

interface AlertItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  severity: 'High' | 'Medium' | 'Low';
  icon: any;
  iconBg: string;
  iconColor: string;
}

const DEFAULT_ALERTS: AlertItem[] = [
  {
    id: 'a1',
    title: 'Vehicle Theft Link Detected',
    desc: 'Matched with 2 cases across 3 stations',
    time: '2m ago',
    severity: 'High',
    icon: ShieldAlert,
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'a2',
    title: 'Unusual Activity Pattern',
    desc: 'Spike in cyber complaints in Saheed Nagar',
    time: '15m ago',
    severity: 'Medium',
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'a3',
    title: 'Cross-Station Link Alert',
    desc: 'New connection between 5 entities',
    time: '45m ago',
    severity: 'High',
    icon: Network,
    iconBg: 'bg-orange-500/10 dark:bg-orange-500/15 border-orange-500/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'a4',
    title: 'Evidence Processing Complete',
    desc: '12 new evidence items processed',
    time: '1h ago',
    severity: 'Low',
    icon: CheckCircle2,
    iconBg: 'bg-sky-500/10 dark:bg-sky-500/15 border-sky-500/20',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
];

export function IntelligenceAlertsFeed() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { state, dispatch } = useMockState();

  const handleAlertClick = async (alertId: string) => {
    try {
      await alertsApi.markAsRead(alertId);
      dispatch({ type: 'MARK_ALERT_READ', payload: alertId });
    } catch (err) {
      console.warn('Alert mark read notice:', err);
    }
    navigate('/intelligence/alerts');
  };

  const realAlerts: AlertItem[] = state.alerts.slice(0, 4).map((a, i) => ({
    id: a.id,
    title: a.type.replace(/_/g, ' '),
    desc: a.message,
    time: 'Just now',
    severity: a.type === 'CROSS_STATION_MATCH' ? 'High' : 'Medium',
    icon: a.type === 'CROSS_STATION_MATCH' ? ShieldAlert : Network,
    iconBg: a.type === 'CROSS_STATION_MATCH' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-amber-500/10 border-amber-500/20',
    iconColor: a.type === 'CROSS_STATION_MATCH' ? 'text-rose-500' : 'text-amber-500',
  }));

  const alerts = realAlerts.length > 0 ? realAlerts : DEFAULT_ALERTS;

  return (
    <div className="bg-surface dark:bg-[#0F1726] border border-border dark:border-[#1E293B] rounded-2xl p-4 flex flex-col justify-between shadow-xs h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-bold font-sans text-text dark:text-[#F8FAFC] tracking-wide">
            {t('dashboard.intelligenceAlerts', 'Intelligence Alerts')}
          </h3>
          <Info size={13} className="text-text-faint dark:text-[#64748B] cursor-help" />
        </div>
        <button
          onClick={() => navigate('/intelligence/alerts')}
          className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
        >
          <span>{t('dashboard.viewAll', 'View All')}</span>
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Alert Feed Items */}
      <div className="space-y-2 my-auto">
        {alerts.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => handleAlertClick(item.id)}
              className="flex items-center justify-between gap-3 p-2 rounded-xl bg-surface-2/60 dark:bg-[#151E31]/60 hover:bg-surface-hover dark:hover:bg-[#151E31] border border-border-soft dark:border-[#1E293B]/70 transition-colors cursor-pointer group"
            >
              {/* Left: Icon + Title + Desc */}
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${item.iconBg} ${item.iconColor}`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-text dark:text-[#F8FAFC] group-hover:text-brand dark:group-hover:text-sky-400 transition-colors truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-text-dim dark:text-[#94A3B8] truncate">
                    {item.desc}
                  </div>
                </div>
              </div>

              {/* Right: Timestamp + Severity Badge */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-text-faint dark:text-[#64748B]">
                  {item.time}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    item.severity === 'High'
                      ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25'
                      : item.severity === 'Medium'
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25'
                      : 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/25'
                  }`}
                >
                  {item.severity}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
