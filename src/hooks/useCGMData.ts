import { useState, useEffect, useCallback, useRef } from 'react';
import { CGMDataResponse, CurrentGlucose, LoadingState, AppError } from '../types';
import { api } from '../services/api';
import { SmartPollingAnalyzer, PollingStrategy } from '../utils/smartPolling';

interface UseCGMDataOptions {
  hours?: number;
  refreshInterval?: number; // Fallback interval when smart polling is disabled
  autoRefresh?: boolean;
  enableSmartPolling?: boolean;
}

interface UseCGMDataReturn {
  // Data
  cgmData: CGMDataResponse | null;
  currentGlucose: CurrentGlucose | null;
  
  // State
  loading: LoadingState;
  error: AppError | null;
  lastUpdated: Date | null;
  
  // Smart polling info
  pollingStrategy: PollingStrategy | null;
  nextReadingIn: string;
  
  // Actions
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useCGMData = (options: UseCGMDataOptions = {}): UseCGMDataReturn => {
  const {
    hours = 24,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    autoRefresh = true,
    enableSmartPolling = true
  } = options;

  // State
  const [cgmData, setCgmData] = useState<CGMDataResponse | null>(null);
  const [currentGlucose, setCurrentGlucose] = useState<CurrentGlucose | null>(null);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<AppError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pollingStrategy, setPollingStrategy] = useState<PollingStrategy | null>(null);
  const [nextReadingIn, setNextReadingIn] = useState<string>('Unknown');

  // Refs for managing timers
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading('loading');
      setError(null);

      console.log(`🔄 Fetching CGM data (${hours}h)...`);

      // Fetch both current and historical data in parallel
      const [historicalData, currentData] = await Promise.all([
        api.cgm.getCGMData(hours),
        api.cgm.getCurrentGlucose()
      ]);

      setCgmData(historicalData);
      setCurrentGlucose(currentData);
      setLastUpdated(new Date());
      setLoading('success');

      // Update polling strategy with new data
      if (enableSmartPolling && historicalData.data.length > 0) {
        const strategy = SmartPollingAnalyzer.getPollingStrategy(historicalData.data);
        setPollingStrategy(strategy);
        
        console.log(`✅ CGM data loaded: ${historicalData.data.length} readings`);
        console.log(`🧠 Smart polling: ${strategy.mode} mode, next check in ${strategy.nextInterval / 1000}s`);
        if (strategy.nextExpectedReading) {
          console.log(`⏰ Next reading expected: ${strategy.nextExpectedReading.toLocaleTimeString()}`);
        }
      } else {
        console.log(`✅ CGM data loaded: ${historicalData.data.length} readings`);
      }

    } catch (err: any) {
      console.error('❌ Failed to fetch CGM data:', err);
      
      const appError: AppError = {
        code: err.code || 'FETCH_ERROR',
        message: err.message || 'Failed to fetch CGM data',
        details: err.details,
        timestamp: new Date()
      };
      
      setError(appError);
      setLoading('error');
    }
  }, [hours, enableSmartPolling]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
    if (loading === 'error') {
      setLoading('idle');
    }
  }, [loading]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Smart polling setup
  useEffect(() => {
    if (!autoRefresh) return;

    const setupNextRefresh = () => {
      // Clear existing interval
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }

      let nextInterval = refreshInterval; // Fallback

      if (enableSmartPolling && pollingStrategy) {
        nextInterval = pollingStrategy.nextInterval;
        const mode = pollingStrategy.mode === 'intensive' ? '🔥 INTENSIVE' : '😌 Normal';
        console.log(`🔄 ${mode} polling: next check in ${nextInterval / 1000}s`);
      } else {
        console.log(`🔄 Standard polling: next check in ${nextInterval / 1000}s`);
      }

      intervalRef.current = setTimeout(() => {
        fetchData();
      }, nextInterval);
    };

    // Set up initial refresh
    setupNextRefresh();
    
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [autoRefresh, enableSmartPolling, pollingStrategy, fetchData, refreshInterval]);

  // Countdown timer for next reading
  useEffect(() => {
    if (!enableSmartPolling || !pollingStrategy?.nextExpectedReading) {
      setNextReadingIn('Unknown');
      return;
    }

    const updateCountdown = () => {
      const timeStr = SmartPollingAnalyzer.formatTimeUntilNext(pollingStrategy.nextExpectedReading);
      setNextReadingIn(timeStr);
    };

    // Update immediately
    updateCountdown();

    // Update every 10 seconds
    countdownRef.current = setInterval(updateCountdown, 10000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [enableSmartPolling, pollingStrategy]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setLoading('idle');
      setError(null);
    };
  }, []);

  return {
    cgmData,
    currentGlucose,
    loading,
    error,
    lastUpdated,
    pollingStrategy,
    nextReadingIn,
    refresh,
    clearError
  };
};