import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Mic, Send, Volume2, VolumeX, Sparkles, Bot, Shield, 
  Layers, Activity, FileText, CheckCircle2
} from 'lucide-react';
import { useAira } from './AiraProvider';

export function AiraVoicePanel() {
  const { 
    isPanelOpen, togglePanel, orbState, isListening, isSpeaking, isMuted, toggleMute,
    language, setLanguage, liveTranscript, response, chatHistory, startListening, stopListening,
    sendQuery, speakText, stopSpeaking, suggestions
  } = useAira();

  const [inputText, setInputText] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, response]);

  if (!isPanelOpen) return null;

  const handleSend = () => {
    if (inputText.trim()) {
      sendQuery(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="fixed inset-0 z-[9995] pointer-events-none select-none font-sans">
      {/* Backdrop */}
      <div 
        onClick={togglePanel}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs pointer-events-auto transition-opacity duration-300" 
      />

      {/* Drawer Panel */}
      <div className="absolute top-0 right-0 h-full w-full max-w-[440px] bg-surface border-l border-border-soft shadow-2xl flex flex-col pointer-events-auto z-10 transition-transform duration-300 animate-slide-in">
        {/* Header Bar */}
        <div className="p-4 border-b border-border-soft flex items-center justify-between bg-surface-2">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-brand animate-pulse" />
            <div>
              <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-text">
                <span>S.I.R.I.S. AI CO-PILOT</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand/10 text-brand border border-brand/30">v2.4</span>
              </div>
              <span className="text-[10px] font-mono text-text-dim uppercase">
                {orbState === 'listening' ? 'Listening to voice…' : orbState === 'thinking' ? 'Analyzing intelligence…' : 'System Ready'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex rounded-lg p-0.5 bg-surface border border-border-soft text-[10px] font-mono">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded font-bold transition-all ${language === 'en' ? 'bg-brand text-bg' : 'text-text-dim hover:text-text'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-0.5 rounded font-bold transition-all ${language === 'hi' ? 'bg-brand text-bg' : 'text-text-dim hover:text-text'}`}
              >
                HI
              </button>
            </div>

            {/* Mute Toggle */}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-surface border border-border-soft text-text-dim hover:text-text"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={14} className="text-danger-bright" /> : <Volume2 size={14} />}
            </button>

            {/* Close Button */}
            <button
              onClick={togglePanel}
              className="p-1.5 rounded-lg bg-surface border border-border-soft text-text-dim hover:text-text"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-4 gap-1.5 p-3 border-b border-border-soft bg-surface-2/60 text-center font-mono">
          <div className="p-1.5 rounded-lg bg-surface border border-border-soft">
            <div className="text-xs font-bold text-danger-bright">1,420</div>
            <div className="text-[8px] text-text-dim uppercase">Active FIRs</div>
          </div>
          <div className="p-1.5 rounded-lg bg-surface border border-border-soft">
            <div className="text-xs font-bold text-amber-400">49</div>
            <div className="text-[8px] text-text-dim uppercase">Hotspots</div>
          </div>
          <div className="p-1.5 rounded-lg bg-surface border border-border-soft">
            <div className="text-xs font-bold text-brand">12</div>
            <div className="text-[8px] text-text-dim uppercase">Repeaters</div>
          </div>
          <div className="p-1.5 rounded-lg bg-surface border border-border-soft">
            <div className="text-xs font-bold text-success">98%</div>
            <div className="text-[8px] text-text-dim uppercase">ANPR Feed</div>
          </div>
        </div>

        {/* Chat Stream Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] p-3.5 rounded-2xl text-xs space-y-1.5 shadow-sm border ${
                msg.role === 'user' 
                  ? 'bg-brand text-bg font-semibold border-brand/40 rounded-tr-none' 
                  : 'bg-surface-2 border-border-soft text-text rounded-tl-none'
              }`}>
                <div className="flex items-center justify-between text-[9px] font-mono border-b border-border-soft/40 pb-1">
                  <span className="font-bold uppercase">{msg.role === 'user' ? 'Officer' : 'S.I.R.I.S. AI'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => speakText(msg.content, 'en-IN')}
                      className="px-2 py-0.5 rounded bg-surface border border-border-soft text-[9px] font-mono font-bold text-brand hover:bg-surface-hover"
                    >
                      🔊 SPEAK EN
                    </button>
                    <button
                      onClick={() => speakText(msg.content, 'hi-IN')}
                      className="px-2 py-0.5 rounded bg-surface border border-border-soft text-[9px] font-mono font-bold text-brand hover:bg-surface-hover"
                    >
                      🔊 SPEAK HI
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border-soft bg-surface-2 space-y-3">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="w-full py-1.5 rounded-xl bg-danger/10 text-danger-bright border border-danger/30 text-xs font-mono font-bold hover:bg-danger/20 transition-colors flex items-center justify-center gap-1.5"
            >
              <VolumeX size={14} /> STOP VOICE OUTPUT
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onMouseDown={(e) => { e.preventDefault(); startListening(); }}
              onMouseUp={(e) => { e.preventDefault(); stopListening(); }}
              onTouchStart={(e) => { e.preventDefault(); startListening(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono transition-all ${
                isListening
                  ? 'bg-emerald-500 text-white shadow-md animate-pulse'
                  : 'bg-surface border border-border-soft text-text hover:text-brand'
              }`}
              title="Hold to Talk"
            >
              <Mic size={16} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Ask S.I.R.I.S AI co-pilot..."
              className="flex-1 bg-surface border border-border-soft rounded-xl px-3.5 py-2 text-xs font-mono text-text outline-none"
            />

            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-xl bg-brand text-bg font-bold flex items-center justify-center shrink-0 hover:bg-brand-bright transition-colors disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
