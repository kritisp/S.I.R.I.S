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
    <div className="min-h-full space-y-6 p-4 md:p-6 pb-24 animate-fade-in max-w-[1600px] mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-border-soft">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-brand animate-ping" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-brand">● LIVE ODISHA BROADCAST</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-text flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Newspaper size={20} />
            </div>
            Live Crime & Police Intelligence Feed
          </h1>
          <p className="text-xs text-text-dim mt-1 font-medium">
            Real-time automated incident and law enforcement surveillance stream for Odisha State Police Command.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-2 border border-border-soft rounded-lg px-3 py-1.5 text-xs text-text">
            <span className="text-text-dim font-medium">Jurisdiction:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-text font-semibold outline-none cursor-pointer font-mono"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border-soft hover:border-brand/40 text-xs font-semibold text-text transition-all"
          >
            <RefreshCw size={14} className={`text-brand ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border-soft text-xs text-text-dim font-mono">
            <Radio size={14} className="text-success animate-pulse" />
            <span>Last updated: just now</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-brand/10 border border-brand/20 text-xs font-semibold text-brand font-mono">
            Showing {filteredArticles.length} of {odishaArticlesData.length} articles
          </div>
        </div>
      </div>

      {/* Grid of News Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="group glass rounded-2xl border border-border-soft hover:border-brand/40 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            {/* Thumbnail Image */}
            <div className="relative h-48 w-full overflow-hidden bg-surface-3">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-surface-2/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono font-bold text-brand border border-brand/20">
                {article.district}, Odisha
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-text leading-snug group-hover:text-brand transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-text-dim mt-2 line-clamp-2 leading-relaxed">
                  {article.description}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-border-soft flex items-center justify-between text-xs text-text-dim">
                <span className="font-medium text-text-dim/80">
                  {article.source} • <span className="font-mono">{article.date}</span>
                </span>

                <a
                  href={article.link}
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center gap-1 font-semibold text-brand hover:underline"
                >
                  Read more <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
