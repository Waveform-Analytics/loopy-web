import { useState, useEffect, useCallback, useRef } from 'react';

interface UseLiveModeResult {
  isLiveMode: boolean;
  toggleLiveMode: () => void;
  timeUntilNext: number;
  lastUpdate: Date | null;
}

interface UseLiveModeOptions {
  intervalMs?: number;
  onUpdate?: () => void;
}

export function useLiveMode(options: UseLiveModeOptions = {}): UseLiveModeResult {
  const { intervalMs = 5 * 60 * 1000, onUpdate } = options; // Default 5 minutes
  
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    setTimeUntilNext(intervalMs);
    
    countdownRef.current = setInterval(() => {
      setTimeUntilNext(prev => {
        if (prev <= 1000) {
          return intervalMs; // Reset countdown
        }
        return prev - 1000;
      });
    }, 1000);
  }, [intervalMs]);

  const toggleLiveMode = useCallback(() => {
    setIsLiveMode(prev => !prev);
  }, []);

  // Handle live mode timer
  useEffect(() => {
    if (isLiveMode) {
      // Immediate update when entering live mode
      if (onUpdate) {
        onUpdate();
        setLastUpdate(new Date());
      }
      
      // Set up recurring updates
      intervalRef.current = setInterval(() => {
        if (onUpdate) {
          onUpdate();
          setLastUpdate(new Date());
        }
      }, intervalMs);

      // Start countdown
      startCountdown();
    } else {
      clearTimers();
      setTimeUntilNext(0);
    }

    return () => clearTimers();
  }, [isLiveMode, intervalMs, onUpdate, clearTimers, startCountdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return {
    isLiveMode,
    toggleLiveMode,
    timeUntilNext,
    lastUpdate,
  };
}