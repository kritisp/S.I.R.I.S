import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Mic, Send, Volume2, VolumeX, Sparkles, Bot, Shield, 
  Layers, Activity, FileText, CheckCircle2, Radio, Search, Users, Car
} from 'lucide-react';
import { useAira } from '../components/Aira/AiraProvider';

export function InvestigationAssistant() {
  const { 
    orbState, isListening, isSpeaking, isMuted, toggleMute,
    language, setLanguage, chatHistory, startListening, stopListening,
    sendQuery, speakText, stopSpeaking
  } = useAira();

  const [inputText, setInputText] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div className="h-[calc(100vh-100px)] w-full max-w-5xl mx-auto flex flex-col font-sans animate-fade-in">
      
      {/* Main Container */}
      <div className="flex-1 bg-surface border border-border-soft shadow-2xl flex flex-col rounded-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-border-soft flex items-center justify-between bg-surface-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-brand animate-pulse" />
            <div>
              <div className="flex items-center gap-2 font-mono font-bold text-lg text-text">
                <span>S.I.R.I.S. AI CO-PILOT</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/30">v2.4 (ODISHA)</span>
              </div>
              <span className="text-xs font-mono text-text-dim uppercase tracking-wider">
                {orbState === 'listening' ? 'Listening to voice…' : orbState === 'thinking' ? 'Analyzing intelligence…' : 'System Ready'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex rounded-lg p-1 bg-surface border border-border-soft text-xs font-mono">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded font-bold transition-all ${language === 'en' ? 'bg-brand text-bg' : 'text-text-dim hover:text-text'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 rounded font-bold transition-all ${language === 'hi' ? 'bg-brand text-bg' : 'text-text-dim hover:text-text'}`}
              >
                HI
              </button>
            </div>

            {/* Mute Toggle */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-surface border border-border-soft text-text-dim hover:text-text"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={18} className="text-danger-bright" /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-4 gap-4 p-4 border-b border-border-soft bg-surface-2/60 text-center font-mono">
          <div className="p-3 rounded-xl bg-surface border border-border-soft">
            <div className="text-lg font-bold text-danger-bright">1,420</div>
            <div className="text-xs text-text-dim uppercase mt-1">Active FIRs</div>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border-soft">
            <div className="text-lg font-bold text-amber-400">49</div>
            <div className="text-xs text-text-dim uppercase mt-1">Hotspots</div>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border-soft">
            <div className="text-lg font-bold text-brand">12</div>
            <div className="text-xs text-text-dim uppercase mt-1">Repeaters</div>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border-soft">
            <div className="text-lg font-bold text-success">98%</div>
            <div className="text-xs text-text-dim uppercase mt-1">ANPR Feed</div>
          </div>
        </div>

        {/* Chat Stream Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 font-sans bg-bg">
          {chatHistory.length <= 1 ? (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in space-y-8 max-w-3xl mx-auto py-10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-[#070d1e] border border-brand/40 rounded-3xl flex items-center justify-center shadow-glow shadow-brand/20 p-2">
                  <img src="/AIRA.png" alt="AIRA" className="w-full h-full object-contain" />
                </div>
                <div className="px-3 py-1 rounded-full bg-brand/10 border border-brand/30 text-[10px] font-mono font-bold text-brand uppercase tracking-widest">
                  Odisha Police AI Command
                </div>
                <h1 className="text-4xl font-display font-bold text-text">How can S.I.R.I.S assist today?</h1>
                <p className="text-text-dim text-sm max-w-xl">
                  Query CCTNS crime datastores, parse FIR documents, inspect suspects, or run ANPR lookups in English, <span className="font-bold text-text">ଓଡ଼ିଆ (Odia)</span>, or <span className="font-bold text-text">हिंदी</span>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={() => sendQuery("Show all vehicle thefts in Bhubaneswar this month")}
                  className="bg-surface-2 border border-border-soft hover:border-brand/50 hover:bg-surface-hover p-5 rounded-2xl text-left transition-all group flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-surface border border-border-soft text-text-dim group-hover:text-brand transition-colors">
                      <Car size={16} />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand px-2 py-0.5 rounded bg-brand/10 border border-brand/20">Automated Search</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text group-hover:text-brand transition-colors">Vehicle Theft Analysis</h3>
                    <p className="text-xs text-text-dim mt-1">"Show all vehicle thefts in Bhubaneswar this month"</p>
                  </div>
                </button>

                <button
                  onClick={() => sendQuery("ଗତ ମାସର ଡକାୟତି ମାମଲା ଦେଖାନ୍ତୁ")}
                  className="bg-surface-2 border border-border-soft hover:border-brand/50 hover:bg-surface-hover p-5 rounded-2xl text-left transition-all group flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-surface border border-border-soft text-text-dim group-hover:text-brand transition-colors">
                      <Search size={16} />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand px-2 py-0.5 rounded bg-brand/10 border border-brand/20">Odia RAG</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text group-hover:text-brand transition-colors">Odia Case Query</h3>
                    <p className="text-xs text-text-dim mt-1">"ଗତ ମାସର ଡକାୟତି ମାମଲା ଦେଖାନ୍ତୁ"</p>
                  </div>
                </button>

                <button
                  onClick={() => sendQuery("List top repeat offenders with risk score > 70")}
                  className="bg-surface-2 border border-border-soft hover:border-brand/50 hover:bg-surface-hover p-5 rounded-2xl text-left transition-all group flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-surface border border-border-soft text-text-dim group-hover:text-brand transition-colors">
                      <Users size={16} />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand px-2 py-0.5 rounded bg-brand/10 border border-brand/20">Crime Intel</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text group-hover:text-brand transition-colors">High-Risk Repeat Offenders</h3>
                    <p className="text-xs text-text-dim mt-1">"List top repeat offenders with risk score {'>'} 70"</p>
                  </div>
                </button>

                <button
                  onClick={() => sendQuery("Show details for case FIR-2026-BBSR-4921")}
                  className="bg-surface-2 border border-border-soft hover:border-brand/50 hover:bg-surface-hover p-5 rounded-2xl text-left transition-all group flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-surface border border-border-soft text-text-dim group-hover:text-brand transition-colors">
                      <FileText size={16} />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand px-2 py-0.5 rounded bg-brand/10 border border-brand/20">File Lookup</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text group-hover:text-brand transition-colors">Inspect Specific Case</h3>
                    <p className="text-xs text-text-dim mt-1">"Show details for case FIR-2026-BBSR-4921"</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] md:max-w-[85%] p-6 rounded-2xl text-sm space-y-2 shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-brand text-bg font-semibold border-brand/40 rounded-tr-none' 
                    : 'bg-surface-2 border-border-soft text-text rounded-tl-none'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-mono border-b border-border-soft/40 pb-2 mb-4">
                    <span className="font-bold uppercase tracking-wider">{msg.role === 'user' ? 'Officer' : 'S.I.R.I.S. AI'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  
                  {msg.structuredData ? (
                    <div className="space-y-4 font-sans text-text">
                      {/* Title */}
                      <div className="flex items-center gap-2 mb-5">
                        <FileText size={20} className="text-brand" />
                        <h3 className="font-bold text-lg tracking-tight">{msg.structuredData.title}</h3>
                      </div>
                      
                      {/* Stats */}
                      <ul className="space-y-3 mb-6">
                        {msg.structuredData.stats.map((stat: any, sIdx: number) => (
                          <li key={sIdx} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                            <div>
                              <span className="font-bold text-text">{stat.label}:</span> <span className="text-text-dim">{stat.value}</span>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* List Title */}
                      {msg.structuredData.listTitle && (
                        <h4 className="font-bold text-base mt-8 mb-4">{msg.structuredData.listTitle}</h4>
                      )}

                      {/* Items */}
                      {msg.structuredData.items && (
                        <div className="space-y-6">
                          {msg.structuredData.items.map((item: any, iIdx: number) => (
                            <div key={iIdx} className="space-y-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold shrink-0">{iIdx + 1}</span>
                                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-brand/10 text-brand border border-brand/20 flex items-center gap-1.5">
                                  <FileText size={12} /> {item.id}
                                </span>
                                <span className="text-sm font-bold text-text">— {item.location}</span>
                                {item.date && <span className="text-xs text-text-dim ml-auto">| Date: <span className="font-bold text-text">{item.date}</span></span>}
                              </div>
                              
                              {item.accused && (
                                <div className="flex items-center gap-2 text-sm pl-8">
                                  <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                                  <span className="font-bold">Accused / Sighted:</span> 
                                  <span className="text-text">{item.accused}</span>
                                  {item.riskScore && (
                                    <span className="text-xs text-text-dim ml-1">
                                      (Risk: <span className="px-1.5 py-0.5 rounded bg-brand/10 text-brand font-mono font-bold border border-brand/20">{item.riskScore}/100</span>)
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              <div className="text-sm pl-8 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                                <div>
                                  <span className="font-bold text-text mr-1">Description:</span>
                                  <span className="text-text-dim italic leading-relaxed">{item.description}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Connected Dockets */}
                      {msg.structuredData.connectedDockets && (
                        <div className="mt-8 pt-6 border-t border-border-soft">
                          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand mb-4">
                            CONNECTED CCTNS CASE DOCKETS ({msg.structuredData.connectedDockets.length}):
                          </div>
                          <div className="space-y-3">
                            {msg.structuredData.connectedDockets.map((docket: any, dIdx: number) => (
                              <div key={dIdx} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border-soft hover:border-brand/30 transition-all shadow-sm">
                                <div>
                                  <div className="font-bold text-sm text-brand">{docket.id}</div>
                                  <div className="text-xs text-text-dim mt-0.5">{docket.type} · {docket.station}</div>
                                </div>
                                <button className="px-4 py-2 rounded-lg bg-[#070d1e] text-white border border-brand/20 text-xs font-bold hover:bg-brand transition-colors shadow-sm">
                                  Open Docket
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">
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
                    <div className="flex items-center gap-2 pt-3 border-t border-border-soft/30 mt-3">
                      <button
                        onClick={() => speakText(msg.content, 'en-IN')}
                        className="px-3 py-1.5 rounded-lg bg-surface border border-border-soft text-[10px] font-mono font-bold text-brand hover:bg-surface-hover transition-colors"
                      >
                        🔊 SPEAK EN
                      </button>
                      <button
                        onClick={() => speakText(msg.content, 'hi-IN')}
                        className="px-3 py-1.5 rounded-lg bg-surface border border-border-soft text-[10px] font-mono font-bold text-brand hover:bg-surface-hover transition-colors"
                      >
                        🔊 SPEAK HI
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <div className="p-5 border-t border-border-soft bg-surface-2 space-y-4">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="w-full py-2.5 rounded-xl bg-danger/10 text-danger-bright border border-danger/30 text-sm font-mono font-bold hover:bg-danger/20 transition-colors flex items-center justify-center gap-2"
            >
              <VolumeX size={18} /> STOP VOICE OUTPUT
            </button>
          )}

          <div className="flex items-center gap-3">
            <button
              onMouseDown={(e) => { e.preventDefault(); startListening(); }}
              onMouseUp={(e) => { e.preventDefault(); stopListening(); }}
              onTouchStart={(e) => { e.preventDefault(); startListening(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
              className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 font-mono transition-all ${
                isListening
                  ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse'
                  : 'bg-surface border border-border-soft text-text hover:text-brand hover:border-brand/50'
              }`}
              title="Hold to Talk"
            >
              <Mic size={24} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Ask S.I.R.I.S AI co-pilot about Odisha case files, hotspots, or vehicles..."
              className="flex-1 bg-surface border border-border-soft rounded-xl px-5 py-4 text-sm font-mono text-text outline-none focus:border-brand/50 transition-colors"
            />

            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="w-14 h-14 rounded-xl bg-brand text-bg font-bold flex items-center justify-center shrink-0 hover:bg-brand-bright transition-colors disabled:opacity-40"
            >
              <Send size={20} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
