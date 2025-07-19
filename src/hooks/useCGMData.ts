/**
 * CGM data fetching hook
 * 
 * Manages CGM data fetching, caching, real-time updates, and error handling
 * using the CGM service layer
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cgmService, CGMServiceOptions } from '../services';
import { 
  CGMReading, 
  CurrentGlucose, 
  CGMDataResponse, 
  LoadingState, 
  AppError 
} from '../types';

/**
 * CGM data hook options
 */
export interface UseCGMDataOptions {
  /** Hours of historical data to fetch */
  hours?: number;
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
  /** Whether to fetch data immediately on mount */
  fetchOnMount?: boolean;
  /** Whether to include analysis data */
  includeAnalysis?: boolean;
  /** Device filter */
  device?: string;
  /** Error callback */
  onError?: (error: AppError) => void;
  /** Data update callback */
  onDataUpdate?: (data: CGMDataResponse) => void;
}

/**
 * CGM data hook return type
 */
export interface UseCGMDataReturn {
  /** CGM readings data */
  data: CGMReading[];
  /** Current glucose reading */
  currentGlucose: CurrentGlucose | null;
  /** Complete API response */
  response: CGMDataResponse | null;
  /** Loading state */
  loadingState: LoadingState;
  /** Error state */
  error: AppError | null;
  /** Last successful fetch timestamp */
  lastFetch: Date | null;
  /** Time until next auto-refresh (if enabled) */
  nextRefreshIn: number;
  /** Manually refresh data */
  refresh: () => Promise<void>;
  /** Fetch data with custom options */
  fetchData: (options?: CGMServiceOptions) => Promise<void>;
  /** Clear error state */
  clearError: () => void;
  /** Update refresh interval */
  setRefreshInterval: (interval: number) => void;
  /** Check if data is stale */
  isStale: boolean;
  /** Data quality metrics */
  dataQuality: {
    totalPoints: number;
    validPoints: number;
    gapCount: number;
    oldestReading?: Date;
    newestReading?: Date;
  };
}

/**
 * Custom hook for CGM data management
 */
export const useCGMData = (options: UseCGMDataOptions = {}): UseCGMDataReturn => {
  const {
    hours = 24,
    refreshInterval = 5 * 60 * 1000, // 5 minutes default
    fetchOnMount = true,
    includeAnalysis = true,
    device,
    onError,
    onDataUpdate,
  } = options;

  // State
  const [data, setData] = useState<CGMReading[]>([]);
  const [currentGlucose, setCurrentGlucose] = useState<CurrentGlucose | null>(null);
  const [response, setResponse] = useState<CGMDataResponse | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<AppError | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(0);
  const [currentRefreshInterval, setCurrentRefreshInterval] = useState(refreshInterval);

  // Refs for cleanup
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized service options
  const serviceOptions = useMemo((): CGMServiceOptions => ({
    hours,
    includeAnalysis,
    device,
  }), [hours, includeAnalysis, device]);

  // Data quality metrics
  const dataQuality = useMemo(() => {
    if (!data.length) {
      return {
        totalPoints: 0,
        validPoints: 0,
        gapCount: 0,
      };
    }

    const sortedData = [...data].sort((a, b) => 
      new Date(a.dateString || a.datetime).getTime() - 
      new Date(b.dateString || b.datetime).getTime()
    );

    const validPoints = sortedData.filter(reading => 
      reading.sgv >= 20 && reading.sgv <= 600
    ).length;

    // Count data gaps (more than 15 minutes between readings)
    let gapCount = 0;
    for (let i = 1; i < sortedData.length; i++) {
      const prev = new Date(sortedData[i - 1].dateString || sortedData[i - 1].datetime);
      const curr = new Date(sortedData[i].dateString || sortedData[i].datetime);
      const diffMinutes = (curr.getTime() - prev.getTime()) / (1000 * 60);
      if (diffMinutes > 15) gapCount++;
    }

    return {
      totalPoints: data.length,
      validPoints,
      gapCount,
      oldestReading: sortedData.length > 0 ? new Date(sortedData[0].dateString || sortedData[0].datetime) : undefined,
      newestReading: sortedData.length > 0 ? new Date(sortedData[sortedData.length - 1].dateString || sortedData[sortedData.length - 1].datetime) : undefined,
    };
  }, [data]);

  // Check if data is stale (older than twice the refresh interval)
  const isStale = useMemo(() => {
    if (!lastFetch || currentRefreshInterval === 0) return false;
    const staleThreshold = currentRefreshInterval * 2;
    return (Date.now() - lastFetch.getTime()) > staleThreshold;
  }, [lastFetch, currentRefreshInterval]);

  // Fetch data function
  const fetchData = useCallback(async (customOptions?: CGMServiceOptions) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const options = customOptions || serviceOptions;

    try {
      setLoadingState('loading');
      setError(null);

      // Fetch both historical data and current glucose
      const [dataResponse, currentResponse] = await Promise.all([
        cgmService.getCGMData(options),
        cgmService.getCurrentGlucose(),
      ]);

      setResponse(dataResponse);
      setData(dataResponse.data);
      setCurrentGlucose(currentResponse);
      setLastFetch(new Date());
      setLoadingState('success');

      // Call update callback
      onDataUpdate?.(dataResponse);

    } catch (err) {
      const appError = err as AppError;
      setError(appError);
      setLoadingState('error');
      
      // Call error callback
      onError?.(appError);
      
      console.error('🚨 CGM data fetch failed:', appError);
    }
  }, [serviceOptions, onDataUpdate, onError]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
    if (loadingState === 'error') {
      setLoadingState('idle');
    }
  }, [loadingState]);

  // Update refresh interval
  const setRefreshInterval = useCallback((interval: number) => {
    setCurrentRefreshInterval(interval);
  }, []);

  // Setup auto-refresh
  useEffect(() => {
    if (currentRefreshInterval === 0) return;

    const setupRefresh = () => {
      // Clear existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      // Set up next refresh
      refreshTimeoutRef.current = setTimeout(() => {
        fetchData();
        setupRefresh(); // Schedule next refresh
      }, currentRefreshInterval);

      // Update countdown
      setNextRefreshIn(currentRefreshInterval);
    };

    setupRefresh();

    // Cleanup
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [currentRefreshInterval, fetchData]);

  // Countdown timer for next refresh
  useEffect(() => {
    if (currentRefreshInterval === 0 || nextRefreshIn === 0) return;

    countdownIntervalRef.current = setInterval(() => {
      setNextRefreshIn(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [nextRefreshIn, currentRefreshInterval]);

  // Initial fetch on mount
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, []); // Only run on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  return {
    data,
    currentGlucose,
    response,
    loadingState,
    error,
    lastFetch,
    nextRefreshIn,
    refresh,
    fetchData,
    clearError,
    setRefreshInterval,
    isStale,
    dataQuality,
  };
};

/**
 * Hook for real-time CGM monitoring with alerts
 */
export interface UseRealtimeCGMOptions extends UseCGMDataOptions {
  /** Alert thresholds */
  alertThresholds?: {
    low: number;
    high: number;
    veryLow: number;
    veryHigh: number;
  };
  /** Alert callback */
  onAlert?: (alert: {
    type: 'low' | 'high' | 'veryLow' | 'veryHigh' | 'trend';
    glucose: number;
    direction: string;
    timestamp: Date;
  }) => void;
}

/**
 * Enhanced CGM hook with real-time monitoring and alerts
 */
export const useRealtimeCGM = (options: UseRealtimeCGMOptions = {}) => {
  const {
    alertThresholds = { low: 70, high: 180, veryLow: 54, veryHigh: 250 },
    onAlert,
    ...cgmOptions
  } = options;

  const cgmData = useCGMData({
    ...cgmOptions,
    refreshInterval: cgmOptions.refreshInterval || 5 * 60 * 1000, // 5 minutes
  });

  const prevGlucoseRef = useRef<CurrentGlucose | null>(null);

  // Monitor for alerts
  useEffect(() => {
    if (!cgmData.currentGlucose || !onAlert) return;

    const current = cgmData.currentGlucose;
    const glucose = current.current_glucose;
    
    if (glucose === null) return;

    const timestamp = new Date(current.timestamp);

    // Check glucose level alerts
    if (glucose <= alertThresholds.veryLow) {
      onAlert({ type: 'veryLow', glucose, direction: current.direction, timestamp });
    } else if (glucose <= alertThresholds.low) {
      onAlert({ type: 'low', glucose, direction: current.direction, timestamp });
    } else if (glucose >= alertThresholds.veryHigh) {
      onAlert({ type: 'veryHigh', glucose, direction: current.direction, timestamp });
    } else if (glucose >= alertThresholds.high) {
      onAlert({ type: 'high', glucose, direction: current.direction, timestamp });
    }

    // Check for rapid trends
    if (['DoubleUp', 'DoubleDown'].includes(current.direction)) {
      onAlert({ type: 'trend', glucose, direction: current.direction, timestamp });
    }

    prevGlucoseRef.current = current;
  }, [cgmData.currentGlucose, alertThresholds, onAlert]);

  return {
    ...cgmData,
    alertThresholds,
  };
};