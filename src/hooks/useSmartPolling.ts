import { useState, useEffect, useCallback, useRef } from 'react';
import { CGMReading } from '../types';

interface UseSmartPollingResult {
  timeUntilNext: number;
  lastUpdate: Date | null;
  nextExpectedReading: Date | null;
  estimatedInterval: number;
}

interface UseSmartPollingOptions {
  onUpdate?: () => void;
  currentReading?: any;
  historicalData?: { readings: CGMReading[] } | null;
  fallbackIntervalMs?: number;
}

export function useSmartPolling(options: UseSmartPollingOptions = {}): UseSmartPollingResult {
  const { 
    onUpdate, 
    currentReading, 
    historicalData, 
    fallbackIntervalMs = 5 * 60 * 1000 // 5 minutes default
  } = options;
  
  // Always in live mode now
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [nextExpectedReading, setNextExpectedReading] = useState<Date | null>(null);
  const [estimatedInterval, setEstimatedInterval] = useState(fallbackIntervalMs);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const nextExpectedRef = useRef<Date | null>(null);
  
  // Calculate the average interval between readings
  const calculateReadingInterval = useCallback((readings: CGMReading[]): number => {
    if (readings.length < 2) return fallbackIntervalMs;
    
    // Sort readings by timestamp (newest first)
    const sortedReadings = [...readings].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Calculate intervals between recent consecutive readings (use last 10)
    const intervals: number[] = [];
    const recentReadings = sortedReadings.slice(0, Math.min(10, sortedReadings.length));
    
    for (let i = 1; i < recentReadings.length; i++) {
      const curr = new Date(recentReadings[i - 1].timestamp).getTime();
      const prev = new Date(recentReadings[i].timestamp).getTime();
      const interval = curr - prev;
      
      // Only include intervals that are reasonable (between 4-6 minutes)
      if (interval >= 4 * 60 * 1000 && interval <= 6 * 60 * 1000) {
        intervals.push(interval);
      }
    }
    
    if (intervals.length === 0) return fallbackIntervalMs;
    
    // Use average of recent intervals
    const average = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    return Math.round(average);
  }, [fallbackIntervalMs]);
  
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);
  
  const performUpdate = useCallback(() => {
    console.log('Performing update...');
    if (onUpdate) {
      onUpdate();
      setLastUpdate(new Date());
    }
  }, [onUpdate]);
  
  const scheduleNextUpdate = useCallback(() => {
    clearTimers();
    
    if (!nextExpectedRef.current) {
      return;
    }
    
    const now = Date.now();
    const targetTime = nextExpectedRef.current.getTime();
    let msUntilUpdate = targetTime - now;
    
    // If we're past the expected time, calculate the next future slot
    if (msUntilUpdate < 0) {
      const intervals = Math.ceil(-msUntilUpdate / estimatedInterval);
      const newTargetTime = targetTime + (intervals * estimatedInterval);
      nextExpectedRef.current = new Date(newTargetTime);
      msUntilUpdate = newTargetTime - now;
    }
    
    // Add 30 second buffer to ensure data is available
    msUntilUpdate += 30 * 1000;
    
    console.log(`Scheduling next update for ${nextExpectedRef.current.toLocaleTimeString()} (in ${Math.round(msUntilUpdate / 1000)}s)`);
    
    // Set up the one-time update
    timeoutRef.current = setTimeout(() => {
      performUpdate();
      
      // Calculate next update time
      const nextTime = new Date(nextExpectedRef.current!.getTime() + estimatedInterval);
      nextExpectedRef.current = nextTime;
      setNextExpectedReading(nextTime);
      
      // Schedule the next update
      scheduleNextUpdate();
    }, msUntilUpdate);
    
    // Update countdown
    setTimeUntilNext(msUntilUpdate);
    
    // Start countdown timer
    countdownRef.current = setInterval(() => {
      setTimeUntilNext(prev => {
        const newValue = Math.max(0, prev - 1000);
        // console.log('Countdown tick:', Math.floor(newValue / 1000), 'seconds remaining');
        if (newValue === 0) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
        }
        return newValue;
      });
    }, 1000);
  }, [estimatedInterval, performUpdate, clearTimers]);
  
  // Update interval calculation when historical data changes
  useEffect(() => {
    if (historicalData?.readings && historicalData.readings.length > 0) {
      const newInterval = calculateReadingInterval(historicalData.readings);
      setEstimatedInterval(newInterval);
      
      // Find the most recent reading
      const sortedReadings = [...historicalData.readings].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      if (sortedReadings.length > 0) {
        const latestTime = new Date(sortedReadings[0].timestamp).getTime();
        const nextTime = new Date(latestTime + newInterval);
        nextExpectedRef.current = nextTime;
        setNextExpectedReading(nextTime);
      }
    }
  }, [historicalData, calculateReadingInterval]);
  
  // Update expected time when current reading changes
  useEffect(() => {
    if (currentReading?.timestamp) {
      const readingTime = new Date(currentReading.timestamp).getTime();
      const nextTime = new Date(readingTime + estimatedInterval);
      nextExpectedRef.current = nextTime;
      setNextExpectedReading(nextTime);
    }
  }, [currentReading?.timestamp, estimatedInterval]);
  
  // Start scheduling when component mounts and data is available
  useEffect(() => {
    if (nextExpectedRef.current) {
      console.log('Starting smart polling...');
      scheduleNextUpdate();
    }
    
    return () => clearTimers();
  }, [scheduleNextUpdate, clearTimers]);
  
  return {
    timeUntilNext,
    lastUpdate,
    nextExpectedReading,
    estimatedInterval,
  };
}