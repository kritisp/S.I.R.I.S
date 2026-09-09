import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMockState } from '../../mockServices/MockStateContext';
import { processKarenQuery, KarenResponse, KarenContext } from '../../services/karenService';

export type KarenListeningState = 'IDLE' | 'SPEAKING' | 'LISTENING' | 'PROCESSING' | 'RESPONDING';

export interface KarenMessage {
  sender: 'USER' | 'KAREN';
  text: string;
  responseData?: KarenResponse;
  timestamp: string;
}

interface KarenContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  listeningState: KarenListeningState;
  setListeningState: (state: KarenListeningState) => void;
  transcript: string;
  setTranscript: (text: string) => void;
  response: KarenResponse | null;
  setResponse: (resp: KarenResponse | null) => void;
  history: KarenMessage[];
  setHistory: React.Dispatch<React.SetStateAction<KarenMessage[]>>;
  position: { x: number; y: number };
  setPosition: (pos: { x: number; y: number }) => void;
  startListening: () => void;
  stopListening: () => void;
  handleSubmitQuery: (query: string) => void;
  speechSupported: boolean;
  resetKaren: () => void;
  speak: (text: string, callback?: () => void) => void;
  // Audio Speech Synthesis
  isSpeaking: boolean;
  isPaused: boolean;
  speakResponse: (text: string) => void;
  stopSpeaking: () => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  replaySpeaking: () => void;
}

const KarenContextObj = createContext<KarenContextType | undefined>(undefined);

export const useKaren = () => {
  const ctx = useContext(KarenContextObj);
  if (!ctx) throw new Error('useKaren must be used within a KarenProvider');
  return ctx;
};

export const KarenProvider = ({ children }: { children: ReactNode }) => {
  const { state, dispatch } = useMockState();
  const location = useLocation();
  const navigate = useNavigate();

  // Positions persisted in localStorage
  const [position, setPos] = useState<{ x: number; y: number }>(() => {
    const saved = localStorage.getItem('karen-position');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    // Fallback bottom-right
    return { x: window.innerWidth - 130, y: window.innerHeight - 130 };
  });

  const setPosition = (pos: { x: number; y: number }) => {
    setPos(pos);
    localStorage.setItem('karen-position', JSON.stringify(pos));
  };

  const [isOpen, setIsOpen] = useState(false);
  const [listeningState, setListeningState] = useState<KarenListeningState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState<KarenResponse | null>(null);
  const [history, setHistory] = useState<KarenMessage[]>([]);

  // Speech Recognition API setup
  const [recognition, setRecognition] = useState<any>(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Speech Synthesis TTS setup
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState('');

  const speakResponse = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    // Strip markdown formatting for natural voice output
    const cleanSpeechText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/•/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[_#>`]/g, '')
      .trim();

    if (!cleanSpeechText) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Female')) && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en'));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis notification:', e);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    setLastSpokenText(cleanSpeechText);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const pauseSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  };

  const resumeSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
    }
  };

  const replaySpeaking = () => {
    if (lastSpokenText) {
      speakResponse(lastSpokenText);
    } else if (response?.response) {
      speakResponse(response.response);
    }
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        stopSpeaking();
        setListeningState('LISTENING');
        setTranscript('');
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const liveText = finalTranscript || interimTranscript;
        if (liveText) {
          setTranscript(liveText);
        }

        if (event.results[event.results.length - 1].isFinal) {
          const finalResultText = event.results[event.results.length - 1][0].transcript;
          setTranscript(finalResultText);
          handleSubmitQuery(finalResultText);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setListeningState('IDLE');
      };

      rec.onend = () => {
        setListeningState(prev => prev === 'LISTENING' ? 'IDLE' : prev);
      };

      setRecognition(rec);
    }
  }, []);

  // 1. Background Wake Word Listener (looks for "hello karen" or "karen" when Karen is closed)
  useEffect(() => {
    if (!state.currentUser) return;
    if (location.pathname === '/' || location.pathname === '/login') return;
    if (isOpen) return; // Only listen in background when closed

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let bgRec: any = null;
    let shouldRestart = true;

    const startBgRec = () => {
      try {
        bgRec = new SpeechRecognition();
        bgRec.continuous = true;
        bgRec.interimResults = true;
        bgRec.lang = 'en-US';

        bgRec.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const spoken = event.results[i][0].transcript.toLowerCase();
            if (spoken.includes('hello karen') || spoken.includes('karen')) {
              shouldRestart = false;
              bgRec.stop();
              setIsOpen(true);
              break;
            }
          }
        };

        bgRec.onerror = (e: any) => {
          // Ignore background errors
        };

        bgRec.onend = () => {
          if (shouldRestart && !isOpen) {
            setTimeout(() => {
              if (shouldRestart && !isOpen) startBgRec();
            }, 1000);
          }
        };

        bgRec.start();
      } catch (err) {
        console.warn('Bg SpeechRecognition failed to initialize:', err);
      }
    };

    startBgRec();

    return () => {
      shouldRestart = false;
      if (bgRec) {
        bgRec.onend = null;
        try {
          bgRec.stop();
        } catch (e) {}
      }
    };
  }, [isOpen, currentUserId, location.pathname]);

  // 2. Background Clap Activation (detects sudden loud spike in microphone volume when closed)
  useEffect(() => {
    if (!state.currentUser) return;
    if (location.pathname === '/' || location.pathname === '/login') return;
    if (isOpen) return; // Only run when closed

    let audioContext: AudioContext | null = null;
    let mediaStream: MediaStream | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let processor: ScriptProcessorNode | null = null;
    let active = true;

    const startClapDetector = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioContextClass();
        source = audioContext.createMediaStreamSource(mediaStream);
        
        processor = audioContext.createScriptProcessor(2048, 1, 1);
        
        let lastClapTime = 0;
        processor.onaudioprocess = (e) => {
          if (!active) return;
          const inputData = e.inputBuffer.getChannelData(0);
          let peak = 0;
          for (let i = 0; i < inputData.length; i++) {
            const val = Math.abs(inputData[i]);
            if (val > peak) peak = val;
          }

          if (peak > 0.85) {
            const now = Date.now();
            if (now - lastClapTime > 1500) {
              lastClapTime = now;
              setIsOpen(true);
            }
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      } catch (err) {
        console.warn("Background AudioContext clap detector failed:", err);
      }
    };

    startClapDetector();

    return () => {
      active = false;
      if (processor && source) {
        try {
          source.disconnect(processor);
        } catch (e) {}
      }
      if (audioContext) {
        try {
          audioContext.close();
        } catch (e) {}
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, currentUserId, location.pathname]);

  const startListening = () => {
    stopSpeaking();
    if (recognition) {
      try {
        recognition.start();
      } catch (e) {
        console.warn('SpeechRecognition already running', e);
      }
    } else {
      // Simulate Speech Recognition with typewriter output for visual parity in browser tests
      setListeningState('LISTENING');
      setTranscript('');
      
      const isCasePage = window.location.pathname.includes('/cases/');
      const simulatedText = isCasePage ? "Open CCTV" : "Tell me about FIR 541";
      let currentIndex = 0;
      
      const interval = setInterval(() => {
        if (currentIndex < simulatedText.length) {
          setTranscript(simulatedText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            handleSubmitQuery(simulatedText);
          }, 800);
        }
      }, 70);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    } else {
      setListeningState('IDLE');
    }
  };

  const speak = (text: string, callback?: () => void) => {
    if (!('speechSynthesis' in window)) {
      if (callback) callback();
      return;
    }
    window.speechSynthesis.cancel();
    
    // Clean text: strip markdown tags for natural pronunciation
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/•/g, '')
      .replace(/✓/g, '')
      .replace(/>/g, '')
      .replace(/:/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onend = () => {
      if (callback) callback();
    };
    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error:", e);
      if (callback) callback();
    };

    // Load available voices and try to match a premium female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.includes('Google US Female') || 
      v.name.includes('Zira') || 
      v.name.includes('Samantha') || 
      v.name.includes('female')
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const resetKaren = () => {
    stopSpeaking();
    setListeningState('IDLE');
    setTranscript('');
    setResponse(null);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSubmitQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    stopSpeaking();
    setListeningState('PROCESSING');
    setTranscript(queryText);

    // Context determination
    const match = location.pathname.match(/\/cases\/([^/]+)/);
    const currentCaseId = match ? match[1] : undefined;
    const role = state.currentUser?.role;
    const station = state.stations.find(s => s.id === state.currentUser?.stationId)?.name;
    const currentUser = state.currentUser?.name;

    const context: KarenContext = {
      currentUser,
      station,
      currentCaseId,
      currentPage: location.pathname,
      role,
      cases: state.cases,
      stations: state.stations,
      evidence: state.evidence
    };

    setTimeout(() => {
      const resp = processKarenQuery(queryText, context);
      setResponse(resp);
      setListeningState('SPEAKING');

      speak(resp.response, () => {
        setListeningState('RESPONDING');
      });

      // Automatically speak the response using Web Speech Synthesis
      speakResponse(resp.response);

      // Keep type compliance for history
      setHistory([
        {
          sender: 'USER',
          text: queryText,
          timestamp: new Date().toLocaleTimeString()
        },
        {
          sender: 'KAREN',
          text: resp.response,
          responseData: resp,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }, 1800);
  };

  // Expose global test hook for automated verification
  useEffect(() => {
    (window as any).__karenSubmitQuery = (text: string) => {
      handleSubmitQuery(text);
    };
    return () => {
      delete (window as any).__karenSubmitQuery;
    };
  }, [isOpen]);

  const lastAlertId = state.alerts[0]?.id;
  const lastAlertType = state.alerts[0]?.type;
  const lastAlertIsRead = state.alerts[0]?.isRead;
  const lastAlertRelatedCaseId = state.alerts[0]?.relatedCaseId;
  const currentUserId = state.currentUser?.id;
  const currentUserName = state.currentUser?.name;
  const [lastProcessedAlertId, setLastProcessedAlertId] = useState<string>('');

  useEffect(() => {
    if (!currentUserId) return;
    if (
      lastAlertId &&
      lastAlertType === 'CROSS_STATION_MATCH' &&
      !lastAlertIsRead &&
      lastAlertId !== lastProcessedAlertId
    ) {
      setLastProcessedAlertId(lastAlertId);

      // Auto expand Karen core
      setIsOpen(true);
      setListeningState('SPEAKING');

      const mockResponse: KarenResponse = {
        intent: 'PROACTIVE_ALERT',
        response: `${currentUserName || 'Inspector'}, new intelligence has been discovered.\nCross-station relationship matching identified a related case in Cuttack Sadar.\n• Case: **CR-CTC-2026-00981**\n• Similarity: **94%**`,
        actions: [
          { label: 'VIEW RELATIONSHIP', route: `/cases/${lastAlertRelatedCaseId}` },
          { label: 'REQUEST ACCESS', route: `/requests` }
        ]
      };
      setResponse(mockResponse);
      speak(mockResponse.response, () => {
        setListeningState('RESPONDING');
      });
      speakResponse(mockResponse.response);

      setHistory([
        {
          sender: 'KAREN',
          text: mockResponse.response,
          responseData: mockResponse,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);

      // Automatically mark the alert as read
      dispatch({ type: 'MARK_ALERT_READ', payload: lastAlertId });
    }
  }, [lastAlertId, lastAlertType, lastAlertIsRead, lastProcessedAlertId, currentUserId]);

  return (
    <KarenContextObj.Provider
      value={{
        isOpen,
        setIsOpen,
        listeningState,
        setListeningState,
        transcript,
        setTranscript,
        response,
        setResponse,
        history,
        setHistory,
        position,
        setPosition,
        startListening,
        stopListening,
        handleSubmitQuery,
        speechSupported,
        resetKaren,
        speak,
        isSpeaking,
        isPaused,
        speakResponse,
        stopSpeaking,
        pauseSpeaking,
        resumeSpeaking,
        replaySpeaking
      }}
    >
      {children}
    </KarenContextObj.Provider>
  );
};
