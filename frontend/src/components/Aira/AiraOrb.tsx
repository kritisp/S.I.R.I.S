import React, { useState, useRef } from 'react';
import { Mic, VolumeX, Volume2, Sparkles, X, Keyboard } from 'lucide-react';
import { useAira } from './AiraProvider';

export function AiraOrb() {
  const { 
    orbState, togglePanel, isListening, isMuted, toggleMute,
    liveTranscript, response, startListening, stopListening, sendQuery, suggestions, audioLevel
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
                <Sparkles size={11} /> S.I.R.I.S. AI CO-PILOT HUD
              </span>
            </div>
            <button
              onClick={() => setDismissedBubble(true)}
              className="text-text-dim hover:text-text p-1 rounded-lg transition-colors text-xs"
            >
              <X size={13} />
            </button>
          </div>

          {liveTranscript ? (
            <div className="p-3 rounded-xl bg-surface-2 border border-accent/40 text-xs font-mono text-accent font-bold animate-pulse">
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
                  ⚡ {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Multi-Ring AI Orb */}
      <div className="relative group flex items-center justify-center cursor-pointer" onClick={handleOrbClick}>
        {/* Outer Pulsing Ambient Aura Ring */}
        <div 
          className={`absolute inset-0 rounded-full blur-md transition-all duration-300 ${
            orbState === 'listening' ? 'bg-emerald-500/50 animate-ping' :
            orbState === 'thinking' ? 'bg-amber-500/50 scale-125 animate-spin' :
            orbState === 'speaking' ? 'bg-cyan-500/40 scale-125 animate-pulse' :
            'bg-brand/30 scale-110 group-hover:scale-125'
          }`} 
          style={{ transform: `scale(${orbScale * 1.2})` }}
        />

        {/* Rotating Outer Gyro Ring */}
        <div 
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed transition-all duration-300 flex items-center justify-center ${
            orbState === 'listening' ? 'border-emerald-400 rotate-45' :
            orbState === 'thinking' ? 'border-amber-400 animate-spin' :
            orbState === 'speaking' ? 'border-cyan-400 animate-pulse' :
            'border-brand/60 group-hover:border-brand'
          }`}
          style={{ transform: `scale(${orbScale})` }}
        >
          {/* Inner Glowing Orb Nucleus */}
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            orbState === 'listening' ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-emerald-500/50 scale-105' :
            orbState === 'thinking' ? 'bg-gradient-to-tr from-amber-600 to-yellow-400 text-white shadow-amber-500/50 scale-105' :
            orbState === 'speaking' ? 'bg-gradient-to-tr from-cyan-600 to-blue-400 text-white shadow-cyan-500/50 scale-105' :
            'bg-gradient-to-tr from-brand to-brand-bright text-bg shadow-brand/40 group-hover:scale-105'
          }`}>
            <Sparkles size={24} className={orbState !== 'idle' ? 'animate-bounce' : ''} />
          </div>
        </div>
      </div>


      {/* Floating Controls Bar */}
      <div className="mt-2.5 flex items-center gap-2 glass px-3 py-1.5 rounded-full bg-surface border border-border-soft shadow-xl text-xs font-mono">
        {/* PTT Hold-to-Talk Mic Button */}
        <button
          onMouseDown={(e) => { e.preventDefault(); startListening(); }}
          onMouseUp={(e) => { e.preventDefault(); stopListening(); }}
          onTouchStart={(e) => { e.preventDefault(); startListening(); }}
          onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
          className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase transition-all flex items-center gap-1.5 ${
            isListening
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105 animate-pulse'
              : 'bg-surface-2 text-text hover:text-brand border border-border-soft'
          }`}
        >
          <Mic size={12} className={isListening ? 'animate-bounce' : ''} />
          <span>{isListening ? 'LISTENING…' : 'HOLD TO TALK'}</span>
        </button>

        {/* Keyboard Input Toggle */}
        <button
          onClick={() => setShowTypingInput(!showTypingInput)}
          className="p-1.5 rounded-full text-text-dim hover:text-brand hover:bg-surface-hover transition-colors"
          title="Type query"
        >
          <Keyboard size={14} />
        </button>

        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className="p-1.5 rounded-full text-text-dim hover:text-brand hover:bg-surface-hover transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={14} className="text-danger-bright" /> : <Volume2 size={14} />}
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
            className="px-3 py-1 rounded-xl bg-brand text-bg font-bold text-xs hover:bg-brand-bright transition-colors font-mono"
          >
            SEND
          </button>
        </form>
      )}
    </div>
  );
}
