import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseDrishtiVoiceOptions {
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onError?: (err: any) => void;
  enableClapWake?: boolean;
  onWake?: () => void;
}

export function useDrishtiVoice({
  onSpeakStart,
  onSpeakEnd,
  onError,
  enableClapWake = false,
  onWake,
}: UseDrishtiVoiceOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const callbacksRef = useRef({ onSpeakStart, onSpeakEnd, onError, onWake });
  useEffect(() => {
    callbacksRef.current = { onSpeakStart, onSpeakEnd, onError, onWake };
  });

  const recognitionRef = useRef<any>(null);
  const isRecognitionRunningRef = useRef(false);
  const voicesCacheRef = useRef<SpeechSynthesisVoice[]>([]);
  const langRef = useRef('en-IN');

  // PTT transcript accumulation
  const accumulatedFinalRef = useRef('');
  const lastInterimRef = useRef('');
  const liveTranscriptRef = useRef('');
  const isPttPressedRef = useRef(false);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isMediaRecordingRef = useRef(false);

  const recognitionRestartCountRef = useRef(0);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;

  // Audio level animation
  const smoothedLevelRef = useRef(0);
  const audioLevelFrameRef = useRef<number | null>(null);
  const lastTranscriptLenRef = useRef(0);
  const audioLevelLastUpdateRef = useRef(0);
  const activeTtsIdRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check mic permission
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    navigator.permissions?.query({ name: 'microphone' as any }).then(r => {
      setMicPermission(r.state as any);
      r.onchange = () => setMicPermission(r.state as any);
    }).catch(() => {});
  }, []);

  // Preload voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => { voicesCacheRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  // Initialize SpeechRecognition Engine once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.warn('[DrishtiVoice] SpeechRecognition not supported in this browser environment');
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;

    rec.onstart = () => { isRecognitionRunningRef.current = true; };

    rec.onresult = (event: any) => {
      setError(null);
      recognitionRestartCountRef.current = 0;
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

    rec.onerror = (e: any) => {
      const err = e.error;
      if (err === 'no-speech' || err === 'aborted') {
        setError(null);
        if (err === 'no-speech') {
          if (isPttPressedRef.current && !isRecognitionRunningRef.current) {
            try { rec.start(); } catch (_) {}
          } else if (!isPttPressedRef.current) {
            setIsListening(false);
          }
        }
        return;
      }
      setError(err);
      if (['not-allowed', 'service-not-allowed'].includes(err)) {
        setMicPermission('denied');
        setIsListening(false);
        return;
      }
      if (!isPttPressedRef.current) {
        setIsListening(false);
      }
    };

    rec.onend = () => {
      isRecognitionRunningRef.current = false;
      if (isPttPressedRef.current && recognitionRestartCountRef.current < 3) {
        recognitionRestartCountRef.current++;
        try {
          rec.start();
        } catch (_) {
          setTimeout(() => {
            if (isPttPressedRef.current && !isRecognitionRunningRef.current) {
              try { rec.start(); } catch (_) {}
            }
          }, 150);
        }
      } else {
        recognitionRestartCountRef.current = 0;
        setIsListening(false);
      }
    };

    recognitionRef.current = rec;
    return () => { try { rec.abort(); } catch (_) {} };
  }, []);

  // Volume level detection
  const startVolumeDetection = useCallback(() => {
    lastTranscriptLenRef.current = 0;
    const DECAY = 0.88;
    const ATTACK = 0.55;
    const FPS = 50;

    const tick = () => {
      const currentLen = liveTranscriptRef.current?.length || 0;
      const delta = Math.max(0, currentLen - lastTranscriptLenRef.current);
      lastTranscriptLenRef.current = currentLen;

      const target = delta > 0 ? Math.min(1, delta * 0.18) : 0;
      smoothedLevelRef.current = smoothedLevelRef.current * DECAY + target * (1 - DECAY) * (1 / ATTACK);
      smoothedLevelRef.current = Math.min(1, Math.max(0, smoothedLevelRef.current));

      const now = Date.now();
      if (now - audioLevelLastUpdateRef.current >= FPS) {
        audioLevelLastUpdateRef.current = now;
        setAudioLevel(Math.round(smoothedLevelRef.current * 100) / 100);
      }

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

  const requestMicPermission = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        setMicPermission('granted');
        return true;
      }
    } catch {
      setMicPermission('denied');
    }
    return false;
  }, []);

  // Start PTT Session
  const startListening = useCallback(async (lang = 'en-IN') => {
    isPttPressedRef.current = true;
    setIsListening(true);
    langRef.current = lang;
    retryCountRef.current = 0;
    recognitionRestartCountRef.current = 0;
    accumulatedFinalRef.current = '';
    lastInterimRef.current = '';
    setLiveTranscript('');

    if (micPermission !== 'granted') {
      const ok = await requestMicPermission();
      if (!ok || !isPttPressedRef.current) {
        setIsListening(false);
        isPttPressedRef.current = false;
        setError('not-allowed');
        return;
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      isMediaRecordingRef.current = true;
    } catch (mrErr: any) {
      console.warn('[DrishtiVoice] MediaRecorder fallback to browser SpeechRecognition:', mrErr.message);
      isMediaRecordingRef.current = false;
    }

    if (recognitionRef.current) {
      recognitionRef.current.lang = lang || 'en-IN';
      try {
        recognitionRef.current.start();
      } catch (e: any) {
        if (e.name !== 'InvalidStateError') {
          recognitionRef.current.lang = 'en-IN';
          try { recognitionRef.current.start(); } catch (_) {}
        }
      }
    }

    startVolumeDetection();
  }, [micPermission, requestMicPermission, startVolumeDetection]);

  // Stop PTT Session & Return Transcript
  const stopListeningAndGetTranscript = useCallback(async (): Promise<string> => {
    isPttPressedRef.current = false;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    try { stopVolumeDetection(); } catch (_) {}
    setIsListening(false);

    if (isMediaRecordingRef.current && mediaRecorderRef.current) {
      isMediaRecordingRef.current = false;
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (_) {}
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    const captured = (accumulatedFinalRef.current + ' ' + lastInterimRef.current).trim() || liveTranscriptRef.current?.trim() || '';
    accumulatedFinalRef.current = '';
    lastInterimRef.current = '';
    liveTranscriptRef.current = '';
    setLiveTranscript('');
    return captured;
  }, [stopVolumeDetection]);

  // Best Voice Selection Algorithm
  const findBestVoice = useCallback((lang: string) => {
    const voices = voicesCacheRef.current;
    if (!voices.length) return null;

    const prefix = lang.split('-')[0];
    const preferredKeywords = ['india', 'ravi', 'heera', 'kalpana', 'google', 'microsoft', 'neural'];

    for (const kw of preferredKeywords) {
      const v = voices.find(v => (v.lang === lang || v.lang.startsWith(prefix)) && v.name.toLowerCase().includes(kw));
      if (v) return v;
    }

    return voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(prefix)) || null;
  }, []);

  // Speech Synthesis
  const speak = useCallback(async (text: string, lang = 'en-IN') => {
    if (!text || !text.trim()) return;

    activeTtsIdRef.current++;
    const currentTtsId = activeTtsIdRef.current;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (_) {}
      audioRef.current = null;
    }
    setIsSpeaking(false);

    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const cleanText = text.replace(/\*\*/g, '').replace(/#/g, '').replace(/\[|\]/g, '');
    const utt = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    voicesCacheRef.current = voices;

    const bestVoice = findBestVoice(lang);
    if (bestVoice) utt.voice = bestVoice;
    utt.lang = lang;
    utt.rate = 0.95;
    utt.pitch = 1.0;
    utt.volume = 1.0;

    utt.onstart = () => {
      if (currentTtsId === activeTtsIdRef.current) {
        setIsSpeaking(true);
        callbacksRef.current.onSpeakStart?.();
      }
    };

    utt.onend = () => {
      if (currentTtsId === activeTtsIdRef.current) {
        setIsSpeaking(false);
        callbacksRef.current.onSpeakEnd?.();
      }
    };

    utt.onerror = (e: any) => {
      if (currentTtsId === activeTtsIdRef.current) {
        setIsSpeaking(false);
        callbacksRef.current.onSpeakEnd?.();
      }
    };

    window.speechSynthesis.speak(utt);
  }, [findBestVoice]);

  const stopSpeaking = useCallback(() => {
    activeTtsIdRef.current++;
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (_) {}
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return {
    startListening,
    stopListeningAndGetTranscript,
    speak,
    stopSpeaking,
    requestMicPermission,
    isListening,
    isSpeaking,
    liveTranscript,
    micPermission,
    audioLevel,
    error,
  };
}
