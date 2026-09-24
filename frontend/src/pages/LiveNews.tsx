import React, { useState } from 'react';
import { Newspaper, RefreshCw, ExternalLink, Radio } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  source: string;
  date: string;
  state: string;
  district: string;
  image: string;
  link: string;
}

const odishaArticlesData: NewsArticle[] = [
  {
    id: '1',
    title: 'Stolen Vehicles Slip Past Cuttack CCTV Net Using Fake Number Plates',
    description: 'Official police intelligence and public security briefing for Cuttack district reported by The Times of India.',
    source: 'The Times of India',
    date: '15 Jul',
    state: 'Odisha',
    district: 'Cuttack',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    link: '#',
  },
  {
    id: '2',
    title: 'Property Offences Decline and Crime Detection Rate Improves in Rourkela',
    description: 'Official police intelligence and public security briefing for Sundargarh reported by The New Indian Express.',
    source: 'The New Indian Express',
    date: '5 Jan',
    state: 'Odisha',
    district: 'Rourkela',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    link: '#',
  },
  {
    id: '3',
    title: 'Bhubaneswar Cyber Cell Busted 4 Members of Inter-State OTP Fraud Gang',
    description: 'Official Odisha Police cyber intelligence report on financial fraud crackdown in Infocity corridor.',
    source: 'Odisha TV (OTV)',
    date: '13 Oct',
    state: 'Odisha',
    district: 'Bhubaneswar',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    link: '#',
  },
  {
    id: '4',
    title: 'Puri District Police Deploy AI CCTV Telemetry for Rath Yatra Crowd Security',
    description: 'Special security directive issued by Odisha State Police Command for Puri temple corridor surveillance.',
    source: 'Sambad English',
    date: '02 Aug',
    state: 'Odisha',
    district: 'Puri',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    link: '#',
  },
  {
    id: '5',
    title: 'Sambalpur Command Center Launches AI-Driven Night Patrol Tracking System',
    description: 'Real-time telemetry and patrol vehicle dispatch system activated across Sambalpur police jurisdiction.',
    source: 'Prameya News',
    date: '19 Nov',
    state: 'Odisha',
    district: 'Sambalpur',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    link: '#',
  },
  {
    id: '6',
    title: 'Berhampur Police Seize Illegal Contraband in Special Anti-Smuggling Raid',
    description: 'Southern range police operation nets commercial contraband shipment near Ganjam border highway.',
    source: 'Kalinga TV',
    date: '18 May',
    state: 'Odisha',
    district: 'Berhampur',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    link: '#',
  },
];

export function LiveNews() {
  const [selectedDistrict, setSelectedDistrict] = useState('All Odisha');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredArticles = selectedDistrict === 'All Odisha'
    ? odishaArticlesData
    : odishaArticlesData.filter(a => a.district === selectedDistrict);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="max-w-[1520px] mx-auto p-4 sm:p-6 space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs dark:shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
            <Newspaper size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-mono text-text dark:text-[#F8FAFC] uppercase tracking-wider">
                State Crime Bulletins & Advisories
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] border border-accent/20 dark:border-[#38BDF8]/20">
                INTELLIGENCE FEED
              </span>
            </div>
            <p className="text-xs text-text-dim dark:text-[#94A3B8]">
              Odisha State Police · Verified District Bulletins & Inter-Station Advisory Wire
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-text dark:text-[#F8FAFC]">
            <span className="text-text-dim dark:text-[#94A3B8] font-medium font-mono text-[10px] uppercase">Jurisdiction:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-text dark:text-[#F8FAFC] font-semibold outline-none cursor-pointer font-mono text-xs"
            >
              <option value="All Odisha">All Odisha</option>
              <option value="Bhubaneswar">Bhubaneswar</option>
              <option value="Cuttack">Cuttack</option>
              <option value="Puri">Puri</option>
              <option value="Rourkela">Rourkela</option>
              <option value="Sambalpur">Sambalpur</option>
              <option value="Berhampur">Berhampur</option>
            </select>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] hover:border-accent/40 dark:hover:border-[#38BDF8]/40 text-xs font-mono font-bold text-text dark:text-[#F8FAFC] transition-all cursor-pointer"
          >
            <RefreshCw size={12} className={`text-accent dark:text-[#38BDF8] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs text-text-dim dark:text-[#94A3B8] font-mono">
            <Radio size={12} className="text-emerald-400" />
            <span className="text-[11px]">Stream: Live</span>
          </div>

          <div className="px-2.5 py-1.5 rounded-lg bg-accent/10 dark:bg-[#38BDF8]/10 border border-accent/20 dark:border-[#38BDF8]/20 text-[11px] font-bold text-accent dark:text-[#38BDF8] font-mono">
            {filteredArticles.length} Bulletins
          </div>
        </div>
      </div>

      {/* Grid of News Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="group bg-surface dark:bg-[#0B0F17] rounded-xl border border-border-soft dark:border-[#1E293B] hover:border-accent/40 dark:hover:border-[#38BDF8]/40 overflow-hidden flex flex-col transition-all duration-300 shadow-xs hover:shadow-lg"
          >
            {/* Thumbnail Image */}
            <div className="relative h-44 w-full overflow-hidden bg-surface-2 dark:bg-[#0E1422]">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
              />
              <div className="absolute top-2.5 left-2.5 bg-surface/90 dark:bg-[#070A0F]/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono font-bold text-accent dark:text-[#38BDF8] border border-accent/30 dark:border-[#38BDF8]/30">
                {article.district}, Odisha
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-sm font-bold text-text dark:text-[#F8FAFC] leading-snug group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-text-dim dark:text-[#94A3B8] mt-1.5 line-clamp-2 leading-relaxed">
                  {article.description}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-2.5 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between text-xs text-text-dim dark:text-[#94A3B8]">
                <span className="font-medium text-[11px]">
                  {article.source} • <span className="font-mono">{article.date}</span>
                </span>

                <a
                  href={article.link}
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center gap-1 font-mono font-bold text-xs text-accent dark:text-[#38BDF8] hover:underline"
                >
                  Dossier <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
