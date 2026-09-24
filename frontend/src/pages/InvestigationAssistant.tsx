import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Mic, Send, Volume2, VolumeX, Sparkles, Bot, Shield, 
  Layers, Activity, FileText, CheckCircle2, Radio, Search, Users, Car,
  Database, Network, Scale
} from 'lucide-react';
import { useAira } from '../components/Aira/AiraProvider';
import { useMockState } from '../mockServices/MockStateContext';

export function InvestigationAssistant() {
  const { state } = useMockState();
  const { 
    orbState, isListening, isSpeaking, isMuted, toggleMute,
    language, setLanguage, chatHistory, startListening, stopListening,
    sendQuery, speakText, stopSpeaking
  } = useAira();

  const [inputText, setInputText] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeCasesCount = state.cases?.filter(c => c.status === 'ACTIVE' || c.status === 'PENDING').length || state.cases?.length || 0;
  const stationsCount = state.stations?.length || 0;
  const alertsCount = state.alerts?.filter(a => !a.isRead).length || 0;
  const evidenceCount = state.evidence?.length || 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = () => {
    if (inputText.trim()) {
      sendQuery(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="max-w-[1520px] mx-auto p-4 sm:p-6 space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24 h-[calc(100vh-60px)] flex flex-col">
      
      {/* Main Container */}
      <div className="flex-1 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] shadow-xs dark:shadow-2xl flex flex-col rounded-xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 border-b border-border-soft dark:border-[#1E293B] flex items-center justify-between bg-surface dark:bg-[#0B0F17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono font-bold text-sm sm:text-base text-text dark:text-[#F8FAFC]">
                <span>Investigation Co-Pilot Intelligence Desk</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] border border-accent/20 dark:border-[#38BDF8]/20">S.I.R.I.S. ODISHA</span>
              </div>
              <span className="text-xs font-mono text-text-dim dark:text-[#94A3B8]">
                {orbState === 'listening' ? 'Listening to voice query…' : orbState === 'thinking' ? 'Querying state knowledge graph…' : 'Statutory & Graph Assistance Active'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex rounded-lg p-1 bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs font-mono">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${language === 'en' ? 'bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#070A0F]' : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${language === 'hi' ? 'bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#070A0F]' : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'}`}
              >
                HI
              </button>
            </div>

            {/* Mute Toggle */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={16} className="text-rose-400" /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* Live System State Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 border-b border-border-soft dark:border-[#1E293B] bg-surface-2/40 dark:bg-[#0E1422]/40 font-mono">
          <div className="p-2.5 rounded-lg bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] flex items-center justify-between">
            <span className="text-[10px] text-text-dim dark:text-[#94A3B8] uppercase">Active Cases</span>
            <span className="text-sm font-bold text-accent dark:text-[#38BDF8]">{activeCasesCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] flex items-center justify-between">
            <span className="text-[10px] text-text-dim dark:text-[#94A3B8] uppercase">Open Alerts</span>
            <span className="text-sm font-bold text-amber-400">{alertsCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] flex items-center justify-between">
            <span className="text-[10px] text-text-dim dark:text-[#94A3B8] uppercase">Vault Items</span>
            <span className="text-sm font-bold text-text dark:text-[#F8FAFC]">{evidenceCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] flex items-center justify-between">
            <span className="text-[10px] text-text-dim dark:text-[#94A3B8] uppercase">Jurisdictions</span>
            <span className="text-sm font-bold text-emerald-400">{stationsCount}</span>
          </div>
        </div>

        {/* Chat Stream Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans bg-bg dark:bg-[#070A0F]">
          {chatHistory.length <= 1 ? (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in space-y-6 max-w-3xl mx-auto py-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 bg-surface dark:bg-[#0B0F17] border border-accent/40 dark:border-[#38BDF8]/40 rounded-2xl flex items-center justify-center shadow-xs p-2">
                  <img src="/AIRA.png" alt="AIRA" className="w-full h-full object-contain" />
                </div>
                <div className="px-3 py-0.5 rounded-full bg-accent/10 dark:bg-[#38BDF8]/10 border border-accent/30 dark:border-[#38BDF8]/30 text-[10px] font-mono font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider">
                  Odisha Police AI Command
                </div>
                <h2 className="text-xl sm:text-2xl font-mono font-bold text-text dark:text-[#F8FAFC]">How can S.I.R.I.S assist today?</h2>
                <p className="text-text-dim dark:text-[#94A3B8] text-xs max-w-xl">
                  Query CCTNS crime datastores, parse FIR documents, inspect suspects, or run ANPR lookups in English, <span className="font-bold text-text dark:text-[#F8FAFC]">ଓଡ଼ିଆ (Odia)</span>, or <span className="font-bold text-text dark:text-[#F8FAFC]">हिंदी</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => sendQuery("Show all vehicle thefts in Bhubaneswar this month")}
                  className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] hover:border-accent/50 dark:hover:border-[#38BDF8]/50 p-3.5 rounded-xl text-left transition-all group flex flex-col gap-2 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors">
                      <Car size={16} />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-accent dark:text-[#38BDF8] px-2 py-0.5 rounded bg-accent/10 dark:bg-[#38BDF8]/10 border border-accent/20 dark:border-[#38BDF8]/20">Automated Search</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text dark:text-[#F8FAFC] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors">Vehicle Theft Analysis</h3>
                    <p className="text-[11px] text-text-dim dark:text-[#94A3B8] mt-0.5 font-mono">"Show all vehicle thefts in Bhubaneswar this month"</p>
                  </div>
                </button>

                <button
                  onClick={() => sendQuery("ଗତ ମାସର ଡକାୟତି ମାମଲା ଦେଖାନ୍ତୁ")}
                  className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] hover:border-accent/50 dark:hover:border-[#38BDF8]/50 p-3.5 rounded-xl text-left transition-all group flex flex-col gap-2 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors">
                      <Search size={16} />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-accent dark:text-[#38BDF8] px-2 py-0.5 rounded bg-accent/10 dark:bg-[#38BDF8]/10 border border-accent/20 dark:border-[#38BDF8]/20">Odia RAG</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text dark:text-[#F8FAFC] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors">Odia Case Query</h3>
                    <p className="text-[11px] text-text-dim dark:text-[#94A3B8] mt-0.5 font-mono">"ଗତ ମାସର ଡକାୟତି ମାମଲା ଦେଖାନ୍ତୁ"</p>
                  </div>
                </button>

                <button
                  onClick={() => sendQuery("List top repeat offenders with risk score > 70")}
                  className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] hover:border-accent/50 dark:hover:border-[#38BDF8]/50 p-3.5 rounded-xl text-left transition-all group flex flex-col gap-2 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors">
                      <Users size={16} />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-accent dark:text-[#38BDF8] px-2 py-0.5 rounded bg-accent/10 dark:bg-[#38BDF8]/10 border border-accent/20 dark:border-[#38BDF8]/20">Crime Intel</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text dark:text-[#F8FAFC] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors">High-Risk Repeat Offenders</h3>
                    <p className="text-[11px] text-text-dim dark:text-[#94A3B8] mt-0.5 font-mono">"List top repeat offenders with risk score {'>'} 70"</p>
                  </div>
                </button>

                <button
                  onClick={() => sendQuery("Show details for case FIR-2026-BBSR-4921")}
                  className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] hover:border-accent/50 dark:hover:border-[#38BDF8]/50 p-3.5 rounded-xl text-left transition-all group flex flex-col gap-2 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors">
                      <FileText size={16} />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-accent dark:text-[#38BDF8] px-2 py-0.5 rounded bg-accent/10 dark:bg-[#38BDF8]/10 border border-accent/20 dark:border-[#38BDF8]/20">File Lookup</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text dark:text-[#F8FAFC] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors">Inspect Specific Case</h3>
                    <p className="text-[11px] text-text-dim dark:text-[#94A3B8] mt-0.5 font-mono">"Show details for case FIR-2026-BBSR-4921"</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] md:max-w-[85%] p-4 sm:p-5 rounded-xl text-xs sm:text-sm space-y-2 shadow-xs border ${
                  msg.role === 'user' 
                    ? 'bg-accent/10 dark:bg-[#38BDF8]/10 text-text dark:text-[#F8FAFC] font-semibold border-accent/30 dark:border-[#38BDF8]/30 rounded-tr-none' 
                    : 'bg-surface dark:bg-[#0B0F17] border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] rounded-tl-none'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-mono border-b border-border-soft/60 dark:border-[#1E293B] pb-1.5 mb-3">
                    <span className="font-bold uppercase tracking-wider text-accent dark:text-[#38BDF8]">{msg.role === 'user' ? 'Officer' : 'S.I.R.I.S. AI'}</span>
                    <span className="text-text-dim dark:text-[#94A3B8]">{msg.timestamp}</span>
                  </div>
                  
                  {msg.structuredData ? (
                    <div className="space-y-3 font-sans text-text dark:text-[#F8FAFC]">
                      {/* Title */}
                      <div className="flex items-center gap-2 mb-3">
                        <FileText size={16} className="text-accent dark:text-[#38BDF8]" />
                        <h3 className="font-bold text-sm tracking-tight">{msg.structuredData.title}</h3>
                      </div>
                      
                      {/* Stats */}
                      <ul className="space-y-2 mb-4 font-mono text-xs">
                        {msg.structuredData.stats.map((stat: any, sIdx: number) => (
                          <li key={sIdx} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent dark:bg-[#38BDF8] mt-1.5 shrink-0" />
                            <div>
                              <span className="font-bold text-text dark:text-[#F8FAFC]">{stat.label}:</span> <span className="text-text-dim dark:text-[#94A3B8]">{stat.value}</span>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* List Title */}
                      {msg.structuredData.listTitle && (
                        <h4 className="font-bold text-xs uppercase tracking-wider text-accent dark:text-[#38BDF8] font-mono mt-4 mb-2">{msg.structuredData.listTitle}</h4>
                      )}

                      {/* Items */}
                      {msg.structuredData.items && (
                        <div className="space-y-3 font-sans text-xs">
                          {msg.structuredData.items.map((item: any, iIdx: number) => (
                            <div key={iIdx} className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-5 h-5 rounded-full bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] flex items-center justify-center text-[10px] font-bold shrink-0">{iIdx + 1}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] border border-accent/20 dark:border-[#38BDF8]/20 flex items-center gap-1">
                                  <FileText size={10} /> {item.id}
                                </span>
                                <span className="text-xs font-bold text-text dark:text-[#F8FAFC]">— {item.location}</span>
                                {item.date && <span className="text-[10px] text-text-dim dark:text-[#94A3B8] ml-auto font-mono">Date: <span className="font-bold text-text dark:text-[#F8FAFC]">{item.date}</span></span>}
                              </div>
                              
                              {item.accused && (
                                <div className="flex items-center gap-2 text-[11px] pl-6">
                                  <div className="w-1.5 h-1.5 rounded-full bg-accent dark:bg-[#38BDF8] shrink-0" />
                                  <span className="font-bold">Accused / Sighted:</span> 
                                  <span className="text-text dark:text-[#F8FAFC]">{item.accused}</span>
                                  {item.riskScore && (
                                    <span className="text-[10px] text-text-dim dark:text-[#94A3B8] ml-1">
                                      (Risk: <span className="px-1.5 py-0.5 rounded bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] font-mono font-bold border border-accent/20 dark:border-[#38BDF8]/20">{item.riskScore}/100</span>)
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              <div className="text-[11px] pl-6 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent dark:bg-[#38BDF8] mt-1 shrink-0" />
                                <div>
                                  <span className="font-bold text-text dark:text-[#F8FAFC] mr-1">Description:</span>
                                  <span className="text-text-dim dark:text-[#94A3B8] leading-relaxed">{item.description}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Connected Dockets */}
                      {msg.structuredData.connectedDockets && (
                        <div className="mt-4 pt-3 border-t border-border-soft dark:border-[#1E293B]">
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent dark:text-[#38BDF8] mb-2">
                            Connected CCTNS Case Dockets ({msg.structuredData.connectedDockets.length}):
                          </div>
                          <div className="space-y-2">
                            {msg.structuredData.connectedDockets.map((docket: any, dIdx: number) => (
                              <div key={dIdx} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B]">
                                <div>
                                  <div className="font-bold text-xs text-accent dark:text-[#38BDF8] font-mono">{docket.id}</div>
                                  <div className="text-[10px] text-text-dim dark:text-[#94A3B8] mt-0.5">{docket.type} · {docket.station}</div>
                                </div>
                                <button className="px-3 py-1 rounded-lg bg-surface dark:bg-[#0B0F17] text-text dark:text-[#F8FAFC] border border-border-soft dark:border-[#1E293B] text-[10px] font-mono font-bold hover:border-accent dark:hover:border-[#38BDF8] transition-colors cursor-pointer">
                                  Open Docket
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
                      {msg.content.split('\n').map((line, idx) => (
                        <React.Fragment key={idx}>
                          {line.includes('**') ? (
                            <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          ) : (
                            line
                          )}
                          {idx < msg.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </p>
                  )}

                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 pt-2.5 border-t border-border-soft/60 dark:border-[#1E293B] mt-2.5">
                      <button
                        onClick={() => speakText(msg.content, 'en-IN')}
                        className="px-2.5 py-1 rounded-md bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-[10px] font-mono font-bold text-accent dark:text-[#38BDF8] hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        🔊 Speak EN
                      </button>
                      <button
                        onClick={() => speakText(msg.content, 'hi-IN')}
                        className="px-2.5 py-1 rounded-md bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-[10px] font-mono font-bold text-accent dark:text-[#38BDF8] hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        🔊 Speak HI
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-border-soft dark:border-[#1E293B] bg-surface dark:bg-[#0B0F17] space-y-3">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="w-full py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <VolumeX size={14} /> Stop Voice Output
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onMouseDown={(e) => { e.preventDefault(); startListening(); }}
              onMouseUp={(e) => { e.preventDefault(); stopListening(); }}
              onTouchStart={(e) => { e.preventDefault(); startListening(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-mono transition-all cursor-pointer ${
                isListening
                  ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse'
                  : 'bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] hover:text-accent dark:hover:text-[#38BDF8] hover:border-accent/40 dark:hover:border-[#38BDF8]/40'
              }`}
              title="Hold to Talk"
            >
              <Mic size={18} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Ask S.I.R.I.S AI co-pilot about Odisha case files, hotspots, or vehicles..."
              className="flex-1 bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] rounded-lg px-3.5 py-2 text-xs font-mono text-text dark:text-[#F8FAFC] placeholder:text-text-dim dark:placeholder:text-[#94A3B8] outline-none focus:border-accent dark:focus:border-[#38BDF8] transition-colors"
            />

            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-lg bg-accent hover:bg-accent-bright dark:bg-[#38BDF8] dark:hover:bg-[#0284C7] text-bg dark:text-[#070A0F] font-bold flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
