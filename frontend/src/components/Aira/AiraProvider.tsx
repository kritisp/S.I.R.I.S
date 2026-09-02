import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { processAiraQuery } from '../../services/airaService';
import { useDrishtiVoice } from '../../hooks/useDrishtiVoice';

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
  toggleListening: () => void;
  sendQuery: (query: string) => void;
  speakText: (text: string, lang?: string) => void;
  stopSpeaking: () => void;
  suggestions: string[];
}

const AiraContext = createContext<AiraContextType | undefined>(undefined);

export const AiraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isThinking, setIsThinking] = useState<boolean>(false);
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

  // Connect exact Drishti Voice Hook
  const voice = useDrishtiVoice({
    onSpeakStart: () => {},
    onSpeakEnd: () => {},
  });

  const orbState: OrbState = isThinking 
    ? 'thinking' 
    : voice.isListening 
    ? 'listening' 
    : voice.isSpeaking 
    ? 'speaking' 
    : 'idle';

  const togglePanel = () => setIsPanelOpen(prev => !prev);
  const toggleMute = () => setIsMuted(prev => !prev);

  const speakText = useCallback((text: string, lang?: string) => {
    if (isMuted) return;
    const targetLang = lang || (language === 'hi' ? 'hi-IN' : 'en-IN');
    voice.speak(text, targetLang);
  }, [isMuted, language, voice]);

  const stopSpeaking = useCallback(() => {
    voice.stopSpeaking();
  }, [voice]);

  const sendQuery = useCallback((query: string) => {
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setIsThinking(true);

    setTimeout(() => {
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
      setIsThinking(false);

      if (!isMuted) {
        voice.speak(botResponseText, language === 'hi' ? 'hi-IN' : 'en-IN');
      }

      if (res.route) {
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.hash = '';
            window.history.pushState({}, '', res.route);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }, 800);
      }
    }, 600);
  }, [isMuted, language, voice]);

  const startListening = useCallback(() => {
    voice.stopSpeaking();
    voice.startListening(language === 'hi' ? 'hi-IN' : 'en-IN');
  }, [language, voice]);

  const stopListening = useCallback(async () => {
    const captured = await voice.stopListeningAndGetTranscript();
    if (captured && captured.trim()) {
      sendQuery(captured.trim());
    }
  }, [sendQuery, voice]);

  const toggleListening = useCallback(() => {
    if (voice.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening, voice.isListening]);

  return (
    <AiraContext.Provider
      value={{
        orbState,
        isPanelOpen,
        setIsPanelOpen,
        togglePanel,
        isListening: voice.isListening,
        isSpeaking: voice.isSpeaking,
        isMuted,
        setIsMuted,
        toggleMute,
        language,
        setLanguage,
        liveTranscript: voice.liveTranscript,
        audioLevel: voice.audioLevel,
        response,
        chatHistory,
        startListening,
        stopListening,
        toggleListening,
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
