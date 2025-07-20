import { useState, useEffect, useCallback, useRef } from 'react';
import { CGMReading } from '../types';

interface UseIntelligentPollingResult {
  isLiveMode: boolean;
  toggleLiveMode: () => void;
  timeUntilNext: number;
  lastUpdate: Date | null;
  nextExpectedReading: Date | null;
  estimatedInterval: number;
}

interface UseIntelligentPollingOptions {
  onUpdate?: () => void;
  currentReading?: any;
  historicalData?: { readings: CGMReading[] } | null;
  fallbackIntervalMs?: number;
}

export function useIntelligentPolling(options: UseIntelligentPollingOptions = {}): UseIntelligentPollingResult {
  const { 
    onUpdate, 
    currentReading, 
    historicalData, 
    fallbackIntervalMs = 5 * 60 * 1000 // 5 minutes default
  } = options;
  
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [nextExpectedReading, setNextExpectedReading] = useState<Date | null>(null);
  const [estimatedInterval, setEstimatedInterval] = useState(fallbackIntervalMs);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const isScheduledRef = useRef(false);
  
  // Calculate the average interval between readings
  const calculateReadingInterval = useCallback((readings: CGMReading[]): number => {
    if (readings.length < 2) return fallbackIntervalMs;
    
    // Sort readings by timestamp
    const sortedReadings = [...readings].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Calculate intervals between consecutive readings
    const intervals: number[] = [];
    for (let i = 1; i < sortedReadings.length; i++) {
      const prev = new Date(sortedReadings[i - 1].timestamp).getTime();
      const curr = new Date(sortedReadings[i].timestamp).getTime();
      const interval = curr - prev;
      
      // Only include intervals that are reasonable (between 2-10 minutes)
      if (interval >= 2 * 60 * 1000 && interval <= 10 * 60 * 1000) {
        intervals.push(interval);
      }
    }
    
    if (intervals.length === 0) return fallbackIntervalMs;
    
    // Calculate median interval (more robust than average)
    intervals.sort((a, b) => a - b);
    const median = intervals.length % 2 === 0
      ? (intervals[intervals.length / 2 - 1] + intervals[intervals.length / 2]) / 2
      : intervals[Math.floor(intervals.length / 2)];
    
    return Math.round(median);
  }, [fallbackIntervalMs]);
  
  // Calculate when the next reading is expected
  const calculateNextExpectedReading = useCallback((
    latestReadingTime: string,
    intervalMs: number
  ): Date => {
    const latestTime = new Date(latestReadingTime).getTime();
    
    // If the latest reading is very recent (less than 1 minute old), 
    // the next reading should be intervalMs from that time
    const now = Date.now();
    const timeSinceLatest = now - latestTime;
    
    if (timeSinceLatest < 60 * 1000) {
      // Recent reading, next one should be in ~intervalMs
      return new Date(latestTime + intervalMs);
    } else {
      // Older reading, calculate based on expected pattern
      // Find the next expected reading time that's in the future
      let nextTime = latestTime;
      while (nextTime <= now) {
        nextTime += intervalMs;
      }
      return new Date(nextTime);
    }
  }, []);
  
  // Update estimated interval and next expected reading when data changes
  useEffect(() => {
    if (historicalData?.readings && historicalData.readings.length > 0) {
      const newInterval = calculateReadingInterval(historicalData.readings);
      setEstimatedInterval(newInterval);
      
      // Find the most recent reading
      const sortedReadings = [...historicalData.readings].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      const latestReading = sortedReadings[0];
      const nextExpected = calculateNextExpectedReading(latestReading.timestamp, newInterval);
      setNextExpectedReading(nextExpected);
    }
  }, [historicalData, calculateReadingInterval, calculateNextExpectedReading]);
  
  // Also update when current reading changes (might be more recent)
  useEffect(() => {
    if (currentReading && currentReading.timestamp) {
      const nextExpected = calculateNextExpectedReading(currentReading.timestamp, estimatedInterval);
      setNextExpectedReading(nextExpected);
    }
  }, [currentReading, estimatedInterval, calculateNextExpectedReading]);
  
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
  
  const scheduleNextUpdate = useCallback(() => {
    if (!nextExpectedReading || !isLiveMode) return;
    
    // Clear any existing timers first
    clearTimers();
    
    const now = Date.now();
    const nextReadingTime = nextExpectedReading.getTime();
    const msUntilNext = Math.max(0, nextReadingTime - now);
    
    // Add a small buffer (30 seconds) to ensure the reading is available
    const msWithBuffer = msUntilNext + 30 * 1000;
    
    // If the next expected reading is in the past, we should update immediately
    // but then calculate the proper next time
    if (msUntilNext < 0) {
      console.log('Next reading is in the past, updating immediately and recalculating...');
      if (onUpdate) {
        onUpdate();
        setLastUpdate(new Date());
      }
      // Calculate next future reading time
      let futureTime = nextReadingTime;
      while (futureTime <= now) {
        futureTime += estimatedInterval;
      }
      setNextExpectedReading(new Date(futureTime));
      return;
    }
    
    console.log(`Next CGM reading expected at ${nextExpectedReading.toLocaleTimeString()}, checking in ${Math.round(msWithBuffer / 1000)}s`);
    
    timeoutRef.current = setTimeout(() => {
      console.log('Timer fired, updating data...');
      if (onUpdate) {
        onUpdate();
        setLastUpdate(new Date());
      }
      
      // Schedule the next update by recalculating from now
      if (isLiveMode) {
        const newNextExpected = new Date(Date.now() + estimatedInterval);
        setNextExpectedReading(newNextExpected);
      }
    }, msWithBuffer);
    
    // Start countdown
    setTimeUntilNext(msWithBuffer);
    countdownRef.current = setInterval(() => {
      setTimeUntilNext(prev => Math.max(0, prev - 1000));
    }, 1000);
  }, [nextExpectedReading, onUpdate, estimatedInterval, isLiveMode, clearTimers]);
  
  const toggleLiveMode = useCallback(() => {
    setIsLiveMode(prev => !prev);
  }, []);
  
  // Handle live mode changes
  useEffect(() => {
    if (isLiveMode && nextExpectedReading) {
      // Don't immediately update when entering live mode - wait for the next expected reading
      scheduleNextUpdate();
    } else {
      clearTimers();
      setTimeUntilNext(0);
    }
    
    return () => clearTimers();
  }, [isLiveMode, nextExpectedReading, scheduleNextUpdate, clearTimers]);
  
  // Remove this effect - it's causing repeated rescheduling
  // The scheduling is already handled in the main live mode effect
  
  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);
  
  return {
    isLiveMode,
    toggleLiveMode,
    timeUntilNext,
    lastUpdate,
    nextExpectedReading,
    estimatedInterval,
  };
}