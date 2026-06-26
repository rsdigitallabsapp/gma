import { useState, useCallback, useRef } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

function jaccardSimilarity(a, b) {
  const normalize = (s) =>
    s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).filter(Boolean);
  const aWords = normalize(a);
  const bWords = normalize(b);
  if (aWords.length === 0 || bWords.length === 0) return 0;
  const setA = new Set(aWords);
  const setB = new Set(bWords);
  const intersection = [...setA].filter(w => setB.has(w));
  const union = new Set([...setA, ...setB]);
  return intersection.length / union.size;
}

export function useVoiceRecognition({ targetPhrase, totalReps = 3, onComplete, onRep }) {
  const [count, setCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const cooldownRef = useRef(false);
  const countRef = useRef(0);
  const isListeningRef = useRef(false);
  const activeRef = useRef(false);

  const startSession = useCallback(() => {
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  }, []);

  useSpeechRecognitionEvent('result', (event) => {
    if (!activeRef.current || cooldownRef.current) return;
    const transcript = event.results[0]?.transcript ?? '';
    const score = jaccardSimilarity(transcript, targetPhrase);

    if (score >= 0.65) {
      cooldownRef.current = true;
      const next = countRef.current + 1;
      countRef.current = next;
      setCount(next);
      onRep?.(next);

      if (next >= totalReps) {
        activeRef.current = false;
        ExpoSpeechRecognitionModule.stop();
        setIsListening(false);
        isListeningRef.current = false;
        setTimeout(() => onComplete?.(), 400);
      } else {
        setTimeout(() => {
          cooldownRef.current = false;
          if (activeRef.current) startSession();
        }, 900);
      }
    }
  });

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    isListeningRef.current = true;
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    isListeningRef.current = false;
    // Auto-restart if still active and not in cooldown
    if (activeRef.current && !cooldownRef.current) {
      setTimeout(() => {
        if (activeRef.current && !cooldownRef.current) startSession();
      }, 300);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') return;
    setError(event.error);
  });

  const start = useCallback(async () => {
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      setError('permissions-denied');
      return false;
    }
    setError(null);
    setCount(0);
    countRef.current = 0;
    cooldownRef.current = false;
    activeRef.current = true;
    startSession();
    return true;
  }, [startSession]);

  const stop = useCallback(() => {
    activeRef.current = false;
    ExpoSpeechRecognitionModule.stop();
    setIsListening(false);
    isListeningRef.current = false;
  }, []);

  const reset = useCallback(() => {
    stop();
    setCount(0);
    countRef.current = 0;
    cooldownRef.current = false;
    setError(null);
  }, [stop]);

  return { count, isListening, error, start, stop, reset };
}
