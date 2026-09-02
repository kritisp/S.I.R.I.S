import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Info, ChevronRight, ShieldAlert,
  CheckCircle2, Camera
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface AlertItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  severity: 'High' | 'Medium' | 'Low';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
}

const SHORT_ALERTS: AlertItem[] = [
  {
    id: 'a1',
    title: 'Cross Station Relationship Match',
    desc: 'Vehicle OD-02-AB-1234 matched between Burglary & Armed Heist across Khandagiri & Saheed Nagar PS.',
    time: 'Just now',
    severity: 'High',
    icon: ShieldAlert,
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'a2',
    title: 'Cuttack PS Access Request Approved',
    desc: 'Cuttack Sadar Police Station approved your cross-jurisdiction access request for Case #FIR-2026-CTC-0112.',
    time: '12m ago',
    severity: 'Low',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'a3',
    title: 'ANPR CCTV Hit: Bermunda Bus Stand',
    desc: "Bullet Ramesh's stolen vehicle detected in live CCTV footage near Bermunda Bus Stand (Node #CAM-BBSR-0089).",
    time: '25m ago',
    severity: 'High',
    icon: Camera,
    iconBg: 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
];

export function IntelligenceAlertsFeed() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleAlertClick = (alertId: string) => {
    if (alertId === 'a1') {
      navigate('/network');
    } else if (alertId === 'a3') {
      navigate('/cctv');
    } else if (alertId === 'a2') {
      navigate('/cases');
    } else {
      navigate('/intelligence/alerts');
    }
  };

  return (
    <div className="bg-surface dark:bg-[#0F1726] border border-border dark:border-[#1E293B] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
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
      <div className="space-y-2.5">
        {SHORT_ALERTS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => handleAlertClick(item.id)}
              className="flex items-start justify-between gap-3 p-3 rounded-xl bg-surface-2/60 dark:bg-[#151E31]/60 hover:bg-surface-hover dark:hover:bg-[#151E31] border border-border-soft dark:border-[#1E293B]/70 transition-colors cursor-pointer group"
            >
              {/* Left: Icon + Title + Desc */}
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${item.iconBg} ${item.iconColor}`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-text dark:text-[#F8FAFC] group-hover:text-brand dark:group-hover:text-sky-400 transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-text-dim dark:text-[#94A3B8] leading-tight mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </div>

              {/* Right: Timestamp + Severity Badge */}
              <div className="flex flex-col items-end gap-1 shrink-0 font-mono">
                <span className="text-[9px] text-text-faint dark:text-[#64748B]">
                  {item.time}
                </span>
                <span
                  className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                    item.severity === 'High'
                      ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25'
                      : item.severity === 'Medium'
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25'
                      : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
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
