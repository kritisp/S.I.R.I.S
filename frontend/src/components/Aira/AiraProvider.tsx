import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { processAiraQuery, processAiraQueryAsync } from '../../services/airaService';
import { useDrishtiVoice } from '../../hooks/useDrishtiVoice';
import { useMockState } from '../../mockServices/MockStateContext';
import { bhasiniTranslationService, SupportedLanguage } from '../../services/bhasiniTranslationService';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
  structuredData?: any;
}

const LANG_LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  or: 'or-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
};

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
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  liveTranscript: string;
  audioLevel: number;
  response: string;
  chatHistory: ChatMessage[];
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  sendQuery: (query: string) => void;
  speakText: (text: string, lang?: SupportedLanguage | string) => void;
  stopSpeaking: () => void;
  suggestions: string[];
}

const AiraContext = createContext<AiraContextType | undefined>(undefined);

export const AiraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useMockState();
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [response, setResponse] = useState<string>('S.I.R.I.S. Investigation Support active. Query case dockets, cross-station FIR records, or legal section references.');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'S.I.R.I.S. Investigation Support active. Query case dockets, cross-station FIR records, or legal section references.',
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

  const speakText = useCallback(async (text: string, lang?: SupportedLanguage | string) => {
    if (isMuted || !text.trim()) return;

    let targetLang: SupportedLanguage = language;
    if (lang) {
      if (['en', 'hi', 'or', 'bn', 'mr', 'ta', 'te'].includes(lang)) {
        targetLang = lang as SupportedLanguage;
      } else if (lang.startsWith('hi')) targetLang = 'hi';
      else if (lang.startsWith('or')) targetLang = 'or';
      else if (lang.startsWith('bn')) targetLang = 'bn';
      else if (lang.startsWith('mr')) targetLang = 'mr';
      else if (lang.startsWith('ta')) targetLang = 'ta';
      else if (lang.startsWith('te')) targetLang = 'te';
      else targetLang = 'en';
    }

    try {
      // Use Bhasini multilingual translation + neural TTS with Web Speech fallback
      await bhasiniTranslationService.speakMultilingual(text, targetLang, 'en');
    } catch (err) {
      console.warn('[AiraProvider] Bhasini speak fallback notice:', err);
      const bcp47 = LANG_LOCALE_MAP[targetLang] || 'en-IN';
      voice.speak(text, bcp47);
    }
  }, [isMuted, language, voice]);

  const stopSpeaking = useCallback(() => {
    voice.stopSpeaking();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [voice]);

  const sendQuery = useCallback(async (query: string) => {
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const activeOfficer = state.currentUser?.name || 'Officer';
      const res = await processAiraQueryAsync(query, { 
        currentUser: activeOfficer,
        station: state.currentUser?.station,
        role: state.currentUser?.role
      });
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

      if (!isMuted) {
        speakText(botResponseText, language);
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
    } catch (err) {
      console.error("[AiraProvider] Error processing query:", err);
    } finally {
      setIsThinking(false);
    }
  }, [isMuted, language, speakText, state.currentUser]);

  const startListening = useCallback(() => {
    stopSpeaking();
    const bcp47 = LANG_LOCALE_MAP[language] || 'en-IN';
    voice.startListening(bcp47);
  }, [language, stopSpeaking, voice]);

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
