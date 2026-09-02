import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { processAiraQuery } from '../../services/airaService';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';


export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
  structuredData?: any;
}

interface AiraContextType {
  orbState: OrbState;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  toggleMute: () => void;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  liveTranscript: string;
  audioLevel: number;
  response: string;
  chatHistory: ChatMessage[];
  startListening: () => void;
  stopListening: () => void;
  sendQuery: (query: string) => void;
  speakText: (text: string, lang?: string) => void;
  stopSpeaking: () => void;
  suggestions: string[];
}

const AiraContext = createContext<AiraContextType | undefined>(undefined);

const INTEL_KNOWLEDGE_BASE: Record<string, { answer: string; suggestions: string[] }> = {
  vehicle: {
    answer: "Vehicle **OD-02-AB-1234** (Silver Maruti Swift) has been flagged at 4 ANPR camera checkpoints along NH-16. Reconstructed flight trail shows movement from Khandagiri Square (21:42 IST) to Cuttack Sadar Link Road (22:15 IST). Linked to FIR-2026-0142.",
    suggestions: ["Show vehicle trail OD-02-AB-1234", "Check cross-station FIR links", "Dispatch patrol unit"]
  },
  money: {
    answer: "Pass-through mule account network detected. Account **OD-MULE-441** forwarded 95% of ₹1.9 Lakhs to **COLLECTOR-OD-9** within 35 minutes. Structuring detected just under ₹50,000 PAN reporting threshold.",
    suggestions: ["Open Money Trail Workspace", "Export FIU Report", "Flag controller account"]
  },
  cctv: {
    answer: "16 CCTV ANPR cameras active across Bhubaneswar-Cuttack corridor. Camera **CAM-BBSR-0010** (Khandagiri Sq) registered suspect visual match for **OD-02-AB-1234** at 21:58 IST with 96% match confidence.",
    suggestions: ["Review CCTV Live Stream", "Reconstruct Geo-Trail", "Verify face match"]
  },
  map: {
    answer: "Live Crime Density Heatmap active for Bhubaneswar-Cuttack corridor. High intensity crime hotspots detected at **Khandagiri Chhak** (22 cases), **Master Canteen Square** (38 cases), and **Palasuni NH-16 Flyover**.",
    suggestions: ["Open GIS Crime Map", "Scan Anomaly Radar", "View Hotspot Telemetry"]
  },
  fir: {
    answer: "State Case Registry holds **1,420 active FIRs**. Top surging crime category: **Commercial Burglary** in Khandagiri PS jurisdiction (3.3× baseline volume).",
    suggestions: ["Open Anomaly Radar", "Scan M.O. patterns", "Register new FIR"]
  }
};

export const AiraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [response, setResponse] = useState<string>('S.I.R.I.S. AI Co-Pilot ready. Hold mic or type a query to analyze cases, ANPR vehicle trails, or AML money flow.');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'S.I.R.I.S. AI Co-Pilot ready. Hold mic or type a query to analyze cases, ANPR vehicle trails, or AML money flow.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: ["Show vehicle trail OD-02-AB-1234", "Analyze AML Money Trail", "Scan Anomaly Radar"]
    }
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Show vehicle trail OD-02-AB-1234", "Analyze AML Money Trail", "Scan Anomaly Radar"
  ]);

  const recognitionRef = useRef<any>(null);
  const isPttPressedRef = useRef<boolean>(false);
  const accumulatedFinalRef = useRef<string>('');
  const lastInterimRef = useRef<string>('');
  const liveTranscriptRef = useRef<string>('');

  // Audio level animation frame refs
  const smoothedLevelRef = useRef<number>(0);
  const audioLevelFrameRef = useRef<number | null>(null);
  const lastTranscriptLenRef = useRef<number>(0);

  // Volume detection driven by character transcript rate (DRISHTI logic)
  const startVolumeDetection = useCallback(() => {
    lastTranscriptLenRef.current = 0;
    const DECAY = 0.88;
    const ATTACK = 0.55;

    const tick = () => {
      const currentLen = liveTranscriptRef.current?.length || 0;
      const delta = Math.max(0, currentLen - lastTranscriptLenRef.current);
      lastTranscriptLenRef.current = currentLen;

      const target = delta > 0 ? Math.min(1, delta * 0.22) : 0;
      smoothedLevelRef.current = smoothedLevelRef.current * DECAY + target * (1 - DECAY) * (1 / ATTACK);
      smoothedLevelRef.current = Math.min(1, Math.max(0, smoothedLevelRef.current));

      setAudioLevel(Math.round(smoothedLevelRef.current * 100) / 100);
      audioLevelFrameRef.current = requestAnimationFrame(tick);
    };
    audioLevelFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const stopVolumeDetection = useCallback(() => {
    if (audioLevelFrameRef.current) cancelAnimationFrame(audioLevelFrameRef.current);
    audioLevelFrameRef.current = null;
    smoothedLevelRef.current = 0;
    setAudioLevel(0);
  }, []);

  // Initialize SpeechRecognition with DRISHTI PTT Accumulation Engine
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 3;
        rec.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

        rec.onstart = () => {
          setIsListening(true);
          setOrbState('listening');
        };

        rec.onresult = (event: any) => {
          let newFinal = '';
          let newInterim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const r = event.results[i];
            if (r.isFinal) newFinal += r[0].transcript;
            else newInterim += r[0].transcript;
          }
          if (newFinal) accumulatedFinalRef.current += ' ' + newFinal;
          lastInterimRef.current = newInterim;
          const display = (accumulatedFinalRef.current + ' ' + newInterim).trim();
          liveTranscriptRef.current = display;
          setLiveTranscript(display);
        };

        rec.onerror = (event: any) => {
          if (event.error === 'no-speech' || event.error === 'aborted') return;
          console.warn('[Aira Voice Engine] Speech recognition error:', event.error);
          setIsListening(false);
          setOrbState('idle');
        };

        rec.onend = () => {
          if (isPttPressedRef.current) {
            try { rec.start(); } catch (_) {}
          } else {
            setIsListening(false);
            setOrbState('idle');
          }
        };

        recognitionRef.current = rec;
      }
    }
  }, [language]);

  const togglePanel = () => setIsPanelOpen(prev => !prev);
  const toggleMute = () => setIsMuted(prev => !prev);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      if (orbState === 'speaking') setOrbState('idle');
    }
  }, [orbState]);

  // DRISHTI Natural Voice Selection & Speech Synthesis
  const speakText = useCallback((text: string, speakLang: string = 'en-IN') => {
    if (isMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      // Clean markdown formatting for clear natural voice
      const clean = text.replace(/\*\*/g, '').replace(/#/g, '').replace(/\[|\]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices();

      // Find best Indian English / Hindi voice
      const preferredVoice = voices.find(v => 
        v.lang === speakLang || 
        v.lang.startsWith(speakLang.substring(0, 2)) || 
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('heera') ||
        v.name.toLowerCase().includes('ravi')
      );

      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.lang = speakLang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setOrbState('speaking');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setOrbState('idle');
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setOrbState('idle');
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [isMuted]);

  const sendQuery = useCallback((query: string) => {
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setOrbState('thinking');
    setLiveTranscript('');

    setTimeout(() => {
      // Process query through AIRA Command Router & Intelligence Engine
      const res = processAiraQuery(query, { currentUser: 'Comm. Mahapatra' });
      const botResponseText = res.response;
      const botSuggestions = res.actions ? res.actions.map(a => a.label) : [];

      const botMsg: ChatMessage = {
        role: 'assistant',
        content: botResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: botSuggestions,
        structuredData: res.structuredData
      };

      setResponse(botResponseText);
      setSuggestions(botSuggestions);
      setChatHistory(prev => [...prev, botMsg]);

      // Speak AI response automatically with DRISHTI voice engine
      speakText(botResponseText, language === 'hi' ? 'hi-IN' : 'en-IN');

      // AUTOMATIC SYSTEM NAVIGATION across tabs, cases, and tools
      if (res.route) {
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.hash = ''; // ensure route navigation
            window.history.pushState({}, '', res.route);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }, 800);
      }
    }, 800);
  }, [language, speakText]);


  const startListening = () => {
    isPttPressedRef.current = true;
    accumulatedFinalRef.current = '';
    lastInterimRef.current = '';
    liveTranscriptRef.current = '';
    setLiveTranscript('');

    if (recognitionRef.current) {
      stopSpeaking();
      try {
        recognitionRef.current.start();
      } catch (e) {
        setIsListening(true);
        setOrbState('listening');
      }
    }
    startVolumeDetection();
  };

  const stopListening = () => {
    isPttPressedRef.current = false;
    stopVolumeDetection();

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    setIsListening(false);
    setOrbState('idle');

    const captured = (accumulatedFinalRef.current + ' ' + lastInterimRef.current).trim() || liveTranscriptRef.current?.trim() || '';
    if (captured) {
      sendQuery(captured);
    }
  };

  return (
    <AiraContext.Provider
      value={{
        orbState,
        isPanelOpen,
        setIsPanelOpen,
        togglePanel,
        isListening,
        isSpeaking,
        isMuted,
        setIsMuted,
        toggleMute,
        language,
        setLanguage,
        liveTranscript,
        audioLevel,
        response,
        chatHistory,
        startListening,
        stopListening,
        sendQuery,
        speakText,
        stopSpeaking,
        suggestions
      }}
    >
      {children}
    </AiraContext.Provider>
  );
};

export const useAira = () => {
  const ctx = useContext(AiraContext);
  if (!ctx) throw new Error('useAira must be used within an AiraProvider');
  return ctx;
};

