import React, { useState, useRef } from 'react';
import { Mic, VolumeX, Volume2, Sparkles, X, Keyboard, Shield, Activity, Radio, Waves } from 'lucide-react';
import { useAira } from './AiraProvider';

export function AiraOrb() {
  const { 
    orbState, togglePanel, isListening, isMuted, toggleMute,
    liveTranscript, response, startListening, stopListening, toggleListening, sendQuery, suggestions, audioLevel
  } = useAira();

  const [showTypingInput, setShowTypingInput] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [dismissedBubble, setDismissedBubble] = useState<boolean>(false);

  // Smooth Dragging Position State & Refs
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMoved = useRef<boolean>(false);

  // Mouse Drag Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }

    isDragging.current = true;
    hasMoved.current = false;
    dragStart.current = {
      x: e.clientX - activePosition.current.x,
      y: e.clientY - activePosition.current.y
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = moveEvent.clientX - dragStart.current.x;
      const dy = moveEvent.clientY - dragStart.current.y;
      if (Math.abs(dx - activePosition.current.x) > 3 || Math.abs(dy - activePosition.current.y) > 3) {
        hasMoved.current = true;
      }
      currentPos.current = { x: dx, y: dy };
      setPosition({ x: dx, y: dy });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      activePosition.current = currentPos.current;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch Drag Handler for Mobile/Tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }

    const touch = e.touches[0];
    isDragging.current = true;
    hasMoved.current = false;
    dragStart.current = {
      x: touch.clientX - activePosition.current.x,
      y: touch.clientY - activePosition.current.y
    };

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDragging.current) return;
      const moveTouch = moveEvent.touches[0];
      const dx = moveTouch.clientX - dragStart.current.x;
      const dy = moveTouch.clientY - dragStart.current.y;
      if (Math.abs(dx - activePosition.current.x) > 3 || Math.abs(dy - activePosition.current.y) > 3) {
        hasMoved.current = true;
      }
      currentPos.current = { x: dx, y: dy };
      setPosition({ x: dx, y: dy });
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
      activePosition.current = currentPos.current;
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleOrbClick = (e: React.MouseEvent) => {
    if (hasMoved.current) {
      e.stopPropagation();
      return;
    }
    togglePanel();
  };

  const handleTypingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendQuery(inputText.trim());
      setInputText('');
      setShowTypingInput(false);
    }
  };

  const orbScale = isListening ? 1 + audioLevel * 0.4 : 1;

  return (
    <div 
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`fixed bottom-6 right-6 z-[9990] flex flex-col items-end select-none font-sans pointer-events-auto transition-transform duration-75 ${
        isDragging.current ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none'
      }}
    >
      {/* Live Voice HUD Response Card */}
      {!dismissedBubble && (liveTranscript || response) && (
        <div className="w-[360px] sm:w-[420px] max-w-[92vw] glass p-4 rounded-2xl bg-surface/95 border border-border-strong shadow-2xl mb-3 space-y-2 animate-fade-in relative">
          <div className="flex items-center justify-between border-b border-border-soft pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} /> Investigation Assistant HUD
              </span>
            </div>
            <button
              onClick={() => setDismissedBubble(true)}
              className="text-text-dim hover:text-text p-1 rounded-lg transition-colors text-xs cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>

          {liveTranscript ? (
            <div className="p-3 rounded-xl bg-surface-2 border border-accent/40 text-xs font-mono text-accent font-bold">
              &quot;{liveTranscript}&quot;
            </div>
          ) : (
            <div className="text-xs text-text leading-relaxed font-sans max-h-40 overflow-y-auto pr-1">
              <p>{response}</p>
            </div>
          )}

          {/* Quick Suggestion Chips */}
          {suggestions.length > 0 && (
            <div className="pt-2 border-t border-border-soft flex flex-wrap gap-1.5">
              {suggestions.slice(0, 3).map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => sendQuery(sug)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-surface-2 border border-border-soft text-brand font-mono font-bold hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Holographic S.I.R.I.S. Command Sphere */}
      <div 
        className="relative group flex items-center justify-center cursor-pointer select-none" 
        onClick={handleOrbClick}
        title="S.I.R.I.S. Intelligence & Voice Assistant (Click to expand / Drag to reposition)"
      >
        {/* High-Contrast Floating Drop Shadow & Ambient Aura */}
        <div 
          className={`absolute inset-0 rounded-full transition-all duration-300 pointer-events-none ${
            orbState === 'listening' ? 'bg-rose-500/35 blur-2xl' :
            orbState === 'thinking' ? 'bg-amber-500/30 blur-2xl' :
            orbState === 'speaking' ? 'bg-cyan-500/35 blur-2xl' :
            'bg-slate-950/60 blur-xl group-hover:bg-amber-500/30'
          }`} 
          style={{ transform: `scale(${isListening ? 1.5 + audioLevel * 1.2 : 1.3})` }}
        />

        {/* Outer High-Contrast Tactical Radar Ring (with dark background backing to pop from white page) */}
        <div 
          className={`w-24 h-24 sm:w-26 sm:h-26 rounded-full border-2 transition-all duration-300 flex items-center justify-center relative bg-slate-950/80 shadow-[0_12px_36px_rgba(0,0,0,0.5)] ${
            orbState === 'listening' ? 'border-rose-400 border-dashed animate-spin' :
            orbState === 'thinking' ? 'border-amber-400 border-dashed animate-spin' :
            orbState === 'speaking' ? 'border-cyan-400 border-dashed' :
            'border-amber-500/70 border-dashed group-hover:border-amber-400 group-hover:rotate-45'
          }`}
          style={{ transform: `scale(${isListening ? 1.06 + audioLevel * 0.3 : 1})` }}
        >
          {/* Compass / HUD North Indicator */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950 shadow-sm shadow-amber-400" />
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-600/80 border border-slate-950" />

          {/* Inner Luminous Crystal Well (72px) with sharp high-contrast border */}
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full p-1 bg-white border-2 border-amber-400 shadow-[0_4px_16px_rgba(0,0,0,0.35)] flex items-center justify-center">
            
            {/* High-Contrast Core Orb */}
            <div className={`w-full h-full rounded-full flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${
              orbState === 'listening'
                ? 'bg-gradient-to-tr from-rose-700 via-rose-600 to-rose-500 text-white shadow-rose-900/80'
                : orbState === 'thinking'
                ? 'bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white shadow-amber-900/80'
                : orbState === 'speaking'
                ? 'bg-gradient-to-tr from-cyan-700 via-cyan-600 to-cyan-500 text-white shadow-cyan-900/80'
                : 'bg-gradient-to-b from-white to-amber-50/70'
            }`}>
              
              {/* Dynamic State Graphics */}
              {isListening ? (
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 bg-white rounded-full transition-all duration-75 shadow-sm" style={{ height: `${Math.max(8, audioLevel * 32)}px` }} />
                    <span className="w-1.5 bg-white rounded-full transition-all duration-75 shadow-sm" style={{ height: `${Math.max(14, audioLevel * 44)}px` }} />
                    <span className="w-1.5 bg-white rounded-full transition-all duration-75 shadow-sm" style={{ height: `${Math.max(8, audioLevel * 28)}px` }} />
                  </div>
                  <span className="text-[8px] font-mono font-black uppercase tracking-wider text-white">REC</span>
                </div>
              ) : orbState === 'thinking' ? (
                <div className="flex flex-col items-center justify-center gap-1">
                  <Activity size={24} className="animate-spin text-white drop-shadow" />
                  <span className="text-[7px] font-mono font-bold uppercase tracking-wider text-amber-200">INTEL</span>
                </div>
              ) : orbState === 'speaking' ? (
                <div className="flex flex-col items-center justify-center gap-1">
                  <Waves size={24} className="animate-pulse text-white drop-shadow" />
                  <span className="text-[7px] font-mono font-bold uppercase tracking-wider text-cyan-200">VOICE</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-1 w-full h-full relative">
                  <img 
                    src="/siris_clean.png" 
                    alt="S.I.R.I.S." 
                    className="w-13 h-13 sm:w-14 sm:h-14 object-contain group-hover:scale-110 transition-transform duration-300 pointer-events-none" 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dedicated High-Visibility S.I.R.I.S. Station Pill Badge */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950 border border-amber-400 shadow-[0_4px_12px_rgba(0,0,0,0.7)] flex items-center gap-1 z-10 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-mono font-black tracking-widest text-amber-300 drop-shadow">
            S.I.R.I.S.
          </span>
        </div>
      </div>

      {/* High-Contrast Floating Controls Toolbar */}
      <div className="mt-3 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 border-2 border-amber-500/80 shadow-[0_8px_24px_rgba(0,0,0,0.6)] text-xs font-mono backdrop-blur-md">
        {/* Click-to-Talk Mic Toggle Button */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleListening(); }}
          className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
            isListening
              ? 'bg-rose-600 text-white shadow-rose-900/50 scale-105 animate-pulse border border-rose-300'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black border border-amber-300 hover:scale-105'
          }`}
          title="Click to toggle mic recording"
        >
          <Mic size={13} className={isListening ? 'animate-bounce' : 'text-slate-950'} />
          <span>{isListening ? 'LISTENING…' : 'CLICK TO TALK'}</span>
        </button>

        {/* Keyboard Input Toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowTypingInput(!showTypingInput); }}
          className="p-1.5 rounded-full text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800 hover:border-amber-500/40"
          title="Type investigation query"
        >
          <Keyboard size={14} />
        </button>

        {/* Mute Toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
          className="p-1.5 rounded-full text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800 hover:border-amber-500/40"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={14} className="text-rose-400" /> : <Volume2 size={14} className="text-slate-300" />}
        </button>
      </div>

      {/* Quick Typing Input Bar */}
      {showTypingInput && (
        <form onSubmit={handleTypingSubmit} className="mt-2 w-72 flex items-center gap-2 glass p-1.5 rounded-2xl bg-surface border border-border-soft shadow-xl">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask S.I.R.I.S AI..."
            autoFocus
            className="flex-1 text-xs font-mono bg-transparent text-text outline-none px-2"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded-xl bg-brand text-bg font-bold text-xs hover:bg-brand-bright transition-colors font-mono cursor-pointer"
          >
            SEND
          </button>
        </form>
      )}
    </div>
  );
}
